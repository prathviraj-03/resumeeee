"""
evaluator_service.py — Answer submission + LangChain evaluation.
"""

import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import InterviewSession, InterviewResponse, QuestionBank
from app.schemas.schemas import AnswerSubmitRequest, AnswerSubmitResponse, EvaluationBreakdown
from app.chains.eval_chain import evaluate_answer

logger = logging.getLogger(__name__)


async def submit_answer(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    req: AnswerSubmitRequest,
) -> AnswerSubmitResponse:
    # Validate session ownership
    sess_result = await db.execute(
        select(InterviewSession).where(
            InterviewSession.session_id == uuid.UUID(session_id),
            InterviewSession.user_id == uuid.UUID(user_id),
        )
    )
    session = sess_result.scalar_one_or_none()
    if not session:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status != "active":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Session is not active")

    # Validate question belongs to session's question order
    if session.question_order:
        allowed_ids = json.loads(session.question_order)
        if str(req.question_id) not in allowed_ids:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Question not part of this session")

    # Fetch question text
    q_result = await db.execute(
        select(QuestionBank).where(QuestionBank.question_id == req.question_id)
    )
    question = q_result.scalar_one_or_none()
    if not question:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Question not found")

    # Check for duplicate answer
    dup_result = await db.execute(
        select(InterviewResponse).where(
            InterviewResponse.session_id == uuid.UUID(session_id),
            InterviewResponse.question_id == req.question_id,
        )
    )
    existing = dup_result.scalar_one_or_none()
    if existing:
        from fastapi import HTTPException
        raise HTTPException(status_code=409, detail="Answer already submitted for this question")

    # LLM evaluation
    eval_result = await evaluate_answer(
        question_text=question.question_text,
        answer_text=req.answer_text,
        session_type=session.session_type.value,
        job_description=session.job_description,
    )

    score = eval_result.get("overall_score", 5)
    feedback = eval_result.get("feedback", "No feedback available.")

    breakdown = {
        "relevance": eval_result.get("relevance", 5),
        "depth": eval_result.get("depth", 5),
        "clarity": eval_result.get("clarity", 5),
    }
    if "star_format" in eval_result:
        breakdown["star_format"] = eval_result["star_format"]

    # Persist response
    response = InterviewResponse(
        session_id=uuid.UUID(session_id),
        question_id=req.question_id,
        user_answer_text=req.answer_text,
        ai_feedback=feedback,
        score_for_question=score,
        evaluation_breakdown=json.dumps(breakdown),
    )
    db.add(response)
    await db.flush()

    return AnswerSubmitResponse(
        response_id=response.response_id,
        question_id=response.question_id,
        score_for_question=score,
        ai_feedback=feedback,
        breakdown=EvaluationBreakdown(**breakdown),
    )
