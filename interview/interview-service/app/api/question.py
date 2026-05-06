from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel, Field
from typing import Optional
import uuid

from app.config.database import get_db
from app.api.auth import get_current_user
from app.schemas.schemas import QuestionOut, TokenData
from app.models.models import QuestionBank, SessionType, Difficulty
from app.config.redis_client import get_redis

router = APIRouter(prefix="/api/interview/questions", tags=["questions"])


# ── Input schema ───────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_text: str = Field(min_length=10, max_length=2000)
    category: str = Field(min_length=1, max_length=100)
    difficulty: Difficulty = Difficulty.medium
    session_type: SessionType
    follow_up_hint: Optional[str] = None


# ── Routes ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[QuestionOut])
async def list_questions(
    session_type: Optional[SessionType] = None,
    difficulty: Optional[Difficulty] = None,
    category: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(get_current_user),
):
    """List questions with optional filters."""
    stmt = select(QuestionBank)
    if session_type:
        stmt = stmt.where(QuestionBank.session_type == session_type)
    if difficulty:
        stmt = stmt.where(QuestionBank.difficulty == difficulty)
    if category:
        stmt = stmt.where(QuestionBank.category.ilike(f"%{category}%"))
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return [QuestionOut.model_validate(q) for q in result.scalars().all()]


@router.post("", response_model=QuestionOut, status_code=201)
async def create_question(
    body: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(get_current_user),
):
    """Add a question to the bank (admin)."""
    q = QuestionBank(**body.model_dump())
    db.add(q)
    await db.flush()
    # Invalidate cache for this type
    await _bust_cache(body.session_type.value)
    return QuestionOut.model_validate(q)


@router.delete("/{question_id}", status_code=204)
async def delete_question(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(get_current_user),
):
    result = await db.execute(
        select(QuestionBank).where(QuestionBank.question_id == uuid.UUID(question_id))
    )
    q = result.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    await db.delete(q)
    await _bust_cache(q.session_type.value)


@router.post("/seed", status_code=201)
async def seed_questions(
    db: AsyncSession = Depends(get_db),
    _: TokenData = Depends(get_current_user),
):
    """Seed the question bank with sample questions (idempotent)."""
    from app.seeds.question_seeds import SEED_QUESTIONS
    added = 0
    for q_data in SEED_QUESTIONS:
        existing = await db.execute(
            select(QuestionBank).where(
                QuestionBank.question_text == q_data["question_text"]
            )
        )
        if not existing.scalar_one_or_none():
            db.add(QuestionBank(**q_data))
            added += 1
    await db.flush()
    # Bust all caches
    redis = await get_redis()
    try:
        keys = await redis.keys("qbank:*")
        if keys:
            await redis.delete(*keys)
    except Exception:
        pass
    return {"message": f"Seeded {added} questions"}


async def _bust_cache(session_type: str):
    redis = await get_redis()
    try:
        keys = await redis.keys(f"qbank:{session_type}:*")
        if keys:
            await redis.delete(*keys)
    except Exception:
        pass
