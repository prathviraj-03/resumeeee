import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Text, ForeignKey,
    Enum as SAEnum, DateTime, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import enum

from app.config.database import Base


# ── Enums ──────────────────────────────────────────────────────────────────

class SessionType(str, enum.Enum):
    technical = "technical"
    behavioral = "behavioral"
    hr = "hr"


class Difficulty(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


# ── Models ─────────────────────────────────────────────────────────────────

class QuestionBank(Base):
    __tablename__ = "question_bank"

    question_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    difficulty = Column(SAEnum(Difficulty), nullable=False, default=Difficulty.medium)
    session_type = Column(SAEnum(SessionType), nullable=False)
    follow_up_hint = Column(Text, nullable=True)  # optional hint for evaluator
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    responses = relationship("InterviewResponse", back_populates="question")

    __table_args__ = (
        Index("idx_qbank_category", "category"),
        Index("idx_qbank_difficulty", "difficulty"),
        Index("idx_qbank_session_type", "session_type"),
    )


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    session_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)   # logical FK to Auth DB
    session_type = Column(SAEnum(SessionType), nullable=False)
    overall_score = Column(Integer, nullable=True)          # set on completion
    summary_report = Column(Text, nullable=True)            # LLM generated summary
    status = Column(String(20), nullable=False, default="active")  # active | completed | abandoned
    question_order = Column(Text, nullable=True)            # JSON list of question UUIDs
    job_description = Column(Text, nullable=True)           # JD for dynamic questions
    from sqlalchemy.dialects.postgresql import JSON
    profile_data = Column(JSON, nullable=True)              # Track user profile at the time
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime(timezone=True), nullable=True)

    responses = relationship(
        "InterviewResponse",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="InterviewResponse.created_at",
    )

    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_status", "status"),
    )


class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    response_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(
        UUID(as_uuid=True),
        ForeignKey("interview_sessions.session_id", ondelete="CASCADE"),
        nullable=False,
    )
    question_id = Column(
        UUID(as_uuid=True),
        ForeignKey("question_bank.question_id"),
        nullable=False,
    )
    user_answer_text = Column(Text, nullable=True)
    user_audio_s3_url = Column(Text, nullable=True)
    ai_feedback = Column(Text, nullable=True)
    score_for_question = Column(Integer, nullable=True)   # 0-10
    evaluation_breakdown = Column(Text, nullable=True)    # JSON: {relevance, depth, clarity, star}
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session = relationship("InterviewSession", back_populates="responses")
    question = relationship("QuestionBank", back_populates="responses")

    __table_args__ = (
        Index("idx_responses_session_id", "session_id"),
    )
