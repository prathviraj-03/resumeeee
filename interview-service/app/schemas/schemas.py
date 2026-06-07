from __future__ import annotations
from pydantic import BaseModel, Field, UUID4
from typing import Optional, List
from datetime import datetime
from app.models.models import SessionType, Difficulty


# ── Question Bank ──────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: UUID4 = Field(serialization_alias="id", validation_alias="question_id")
    question_id: UUID4
    text: str = Field(serialization_alias="text", validation_alias="question_text")
    question_text: str
    category: str
    difficulty: Difficulty
    session_type: SessionType

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


# ── Session ────────────────────────────────────────────────────────────────

class SessionStartRequest(BaseModel):
    session_type: SessionType
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: Optional[Difficulty] = None
    category: Optional[str] = None
    job_description: Optional[str] = None
    profile_data: Optional[dict] = None


class SessionStartResponse(BaseModel):
    id: UUID4 = Field(serialization_alias="id", validation_alias="session_id")
    session_id: UUID4
    session_type: SessionType
    questions: List[QuestionOut]
    start_time: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


class SessionOut(BaseModel):
    id: UUID4 = Field(serialization_alias="id", validation_alias="session_id")
    session_id: UUID4
    user_id: UUID4
    session_type: SessionType
    overall_score: Optional[int]
    summary_report: Optional[str]
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    questions: List[QuestionOut] = []
    responses: List[ResponseOut] = []

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


class SessionListItem(BaseModel):
    id: UUID4 = Field(serialization_alias="id", validation_alias="session_id")
    session_id: UUID4
    session_type: SessionType
    overall_score: Optional[int]
    status: str
    start_time: datetime
    end_time: Optional[datetime]

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


# ── Answer / Response ──────────────────────────────────────────────────────

class AnswerSubmitRequest(BaseModel):
    question_id: UUID4
    answer_text: str = Field(min_length=1, max_length=5000)


class EvaluationBreakdown(BaseModel):
    relevance: int = Field(ge=0, le=10)
    depth: int = Field(ge=0, le=10)
    clarity: int = Field(ge=0, le=10)
    star_format: Optional[int] = Field(default=None, ge=0, le=10)  # behavioral only


class AnswerSubmitResponse(BaseModel):
    response_id: UUID4
    question_id: UUID4
    score_for_question: int
    ai_feedback: str
    breakdown: EvaluationBreakdown
    
    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


class ResponseOut(BaseModel):
    id: UUID4 = Field(serialization_alias="id", validation_alias="response_id")
    response_id: UUID4
    question_id: UUID4
    user_answer_text: Optional[str]
    user_audio_s3_url: Optional[str]
    ai_feedback: Optional[str]
    score_for_question: Optional[int]
    evaluation_breakdown: Optional[str]
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "populate_by_name": True
    }


# ── Session End ────────────────────────────────────────────────────────────

class SessionEndResponse(BaseModel):
    session_id: UUID4
    overall_score: int
    summary_report: str
    end_time: datetime
    responses_evaluated: int


# ── Auth helpers (lightweight — real auth lives in Auth Service) ───────────

class TokenData(BaseModel):
    user_id: str


# ── Audio upload ───────────────────────────────────────────────────────────

class AudioUploadResponse(BaseModel):
    response_id: UUID4
    s3_url: str
