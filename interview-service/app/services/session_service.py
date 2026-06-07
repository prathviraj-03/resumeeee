"""
session_service.py — Session lifecycle: start, end, list, fetch.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.models import (
    InterviewSession, InterviewResponse, QuestionBank,
    SessionType, Difficulty,
)
from app.schemas.schemas import (
    SessionStartRequest, SessionStartResponse, SessionOut,
    SessionListItem, SessionEndResponse, QuestionOut, ResponseOut,
)
from app.chains.eval_chain import generate_session_summary
from app.config.redis_client import get_redis
from app.config.settings import settings

logger = logging.getLogger(__name__)


# ── Helpers ────────────────────────────────────────────────────────────────

def _cache_key(session_type: str, difficulty: Optional[str], category: Optional[str]) -> str:
    return f"qbank:{session_type}:{difficulty or 'any'}:{category or 'any'}"


async def _get_questions_cached(
    db: AsyncSession,
    session_type: SessionType,
    num: int,
    difficulty: Optional[Difficulty],
    category: Optional[str],
) -> list[QuestionBank]:
    """Fetch questions from Redis cache or DB."""
    redis = await get_redis()
    cache_key = _cache_key(session_type.value, difficulty.value if difficulty else None, category)

    try:
        cached = await redis.get(cache_key)
        if cached:
            question_ids = json.loads(cached)
            # Fetch the actual rows (avoids stale data on question edits)
            result = await db.execute(
                select(QuestionBank).where(
                    QuestionBank.question_id.in_(
                        [uuid.UUID(qid) for qid in question_ids[:num]]
                    )
                )
            )
            questions = result.scalars().all()
            if questions:
                return list(questions)
    except Exception as e:
        logger.warning("Redis cache miss/error: %s", e)

    # DB query with filters
    stmt = select(QuestionBank).where(QuestionBank.session_type == session_type)
    if difficulty:
        stmt = stmt.where(QuestionBank.difficulty == difficulty)
    if category:
        stmt = stmt.where(QuestionBank.category.ilike(f"%{category}%"))
    stmt = stmt.order_by(func.random()).limit(max(num, 50))  # fetch more for caching

    result = await db.execute(stmt)
    all_questions = result.scalars().all()

    # Cache full pool
    try:
        ids = [str(q.question_id) for q in all_questions]
        await redis.setex(cache_key, settings.QUESTION_CACHE_TTL, json.dumps(ids))
    except Exception as e:
        logger.warning("Failed to cache questions: %s", e)

    return list(all_questions[:num])


# ── Service functions ──────────────────────────────────────────────────────

async def start_session(
    db: AsyncSession,
    user_id: str,
    req: SessionStartRequest,
) -> SessionStartResponse:
    if req.job_description:
        from app.chains.question_generator import generate_dynamic_questions
        # Generate dynamic questions
        dynamic_qs = await generate_dynamic_questions(
            session_type=req.session_type.value,
            job_description=req.job_description,
            profile_data=req.profile_data or {},
            num_questions=req.num_questions,
            difficulty=req.difficulty.value if req.difficulty else "medium",
        )
        # Insert them into the QuestionBank
        questions = []
        for dq in dynamic_qs:
            q = QuestionBank(
                question_text=dq.get("question_text", ""),
                category=dq.get("category", req.category or "Dynamic"),
                difficulty=Difficulty(dq.get("difficulty", "medium")),
                session_type=req.session_type,
                follow_up_hint=dq.get("follow_up_hint"),
            )
            db.add(q)
            questions.append(q)
        await db.flush()  # To get the question_id UUIDs
    else:
        questions = await _get_questions_cached(
            db, req.session_type, req.num_questions, req.difficulty, req.category
        )
        if not questions:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=404,
                detail="No questions found matching the criteria. Seed the question bank first.",
            )

    question_order = [str(q.question_id) for q in questions]
    session = InterviewSession(
        user_id=uuid.UUID(user_id),
        session_type=req.session_type,
        status="active",
        question_order=json.dumps(question_order),
        job_description=req.job_description,
        profile_data=req.profile_data,
    )
    db.add(session)
    await db.flush()

    return SessionStartResponse(
        id=session.session_id,
        session_id=session.session_id,
        session_type=session.session_type,
        questions=[QuestionOut.model_validate(q) for q in questions],
        start_time=session.start_time,
    )


async def get_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
) -> SessionOut:
    result = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.session_id == uuid.UUID(session_id),
            InterviewSession.user_id == uuid.UUID(user_id),
        )
        .options(selectinload(InterviewSession.responses))
    )
    session = result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Hydrate questions from question_order
    questions_list = []
    if session.question_order:
        try:
            q_ids = [uuid.UUID(qid) for qid in json.loads(session.question_order)]
            q_result = await db.execute(
                select(QuestionBank).where(QuestionBank.question_id.in_(q_ids))
            )
            questions_map = {q.question_id: q for q in q_result.scalars().all()}
            # Maintain order
            questions_list = [questions_map[qid] for qid in q_ids if qid in questions_map]
        except Exception as e:
            logger.error("Failed to hydrate questions for session %s: %s", session_id, e)
    
    # Construct response manually to be safe with field names/aliases
    return SessionOut(
        id=session.session_id,
        session_id=session.session_id,
        user_id=session.user_id,
        session_type=session.session_type,
        overall_score=session.overall_score,
        summary_report=session.summary_report,
        status=session.status,
        start_time=session.start_time,
        end_time=session.end_time,
        questions=[QuestionOut.model_validate(q) for q in questions_list],
        responses=[ResponseOut.model_validate(r) for r in session.responses]
    )


async def list_sessions(
    db: AsyncSession,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
) -> list[SessionListItem]:
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == uuid.UUID(user_id))
        .order_by(InterviewSession.start_time.desc())
        .offset(skip)
        .limit(limit)
    )
    sessions = result.scalars().all()
    return [SessionListItem.model_validate(s) for s in sessions]


async def end_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
) -> SessionEndResponse:
    result = await db.execute(
        select(InterviewSession)
        .where(
            InterviewSession.session_id == uuid.UUID(session_id),
            InterviewSession.user_id == uuid.UUID(user_id),
        )
        .options(
            selectinload(InterviewSession.responses)
            .selectinload(InterviewResponse.question)
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "completed":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Session already completed")

    responses = session.responses
    scored = [r for r in responses if r.score_for_question is not None]

    # Weighted average → scale to 0-100
    if scored:
        avg_10 = sum(r.score_for_question for r in scored) / len(scored)
        overall_score = round(avg_10 * 10)
    else:
        overall_score = 0

    # Build QA transcript for summary
    qa_pairs = [
        {
            "question": r.question.question_text if r.question else "Unknown",
            "answer": r.user_answer_text or "(no answer)",
            "score": r.score_for_question or 0,
        }
        for r in responses
    ]

    summary = await generate_session_summary(
        session_type=session.session_type.value,
        overall_score=overall_score,
        qa_pairs=qa_pairs,
    )

    session.overall_score = overall_score
    session.summary_report = summary
    session.status = "completed"
    session.end_time = datetime.now(timezone.utc)
    await db.commit()

    return await get_session(db, str(session.session_id), user_id)


async def delete_session(
    db: AsyncSession,
    session_id: str,
    user_id: str,
) -> bool:
    result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.session_id == uuid.UUID(session_id),
            InterviewSession.user_id == uuid.UUID(user_id),
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    
    # SQLAlchemy will cascade delete responses if configured, but let's be safe
    # If using selectinload/relationship, it handles it.
    await db.delete(session)
    await db.commit()
    return True
