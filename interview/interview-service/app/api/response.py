from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.api.auth import get_current_user
from app.schemas.schemas import (
    AnswerSubmitRequest, AnswerSubmitResponse,
    AudioUploadResponse, TokenData,
)
from app.services.evaluator_service import submit_answer
from app.services.storage_service import upload_audio
from app.models.models import InterviewResponse
from sqlalchemy import select
import uuid

router = APIRouter(prefix="/api/interview/session", tags=["responses"])


@router.post("/{session_id}/answer", response_model=AnswerSubmitResponse)
async def submit(
    session_id: str,
    req: AnswerSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Submit a text answer for a question — triggers LLM evaluation immediately."""
    return await submit_answer(db, session_id, current_user.user_id, req)


@router.post("/{session_id}/answer/{response_id}/audio", response_model=AudioUploadResponse)
async def upload_answer_audio(
    session_id: str,
    response_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Upload an audio recording for an existing response.
    Accepts webm / ogg / mp4 audio. Stored in S3-compatible storage.
    """
    from fastapi import HTTPException

    allowed_types = {"audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav"}
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail=f"Unsupported audio type: {file.content_type}")

    # Verify response belongs to session + user
    result = await db.execute(
        select(InterviewResponse)
        .join(InterviewResponse.session)
        .where(
            InterviewResponse.response_id == uuid.UUID(response_id),
            InterviewResponse.session_id == uuid.UUID(session_id),
        )
    )
    response_row = result.scalar_one_or_none()
    if not response_row:
        raise HTTPException(status_code=404, detail="Response not found")

    file_bytes = await file.read()
    if len(file_bytes) > 50 * 1024 * 1024:  # 50 MB cap
        raise HTTPException(status_code=413, detail="Audio file too large (max 50 MB)")

    s3_url = await upload_audio(
        file_bytes=file_bytes,
        content_type=file.content_type,
        session_id=session_id,
        response_id=response_id,
    )
    if s3_url:
        response_row.user_audio_s3_url = s3_url
        await db.flush()

    return AudioUploadResponse(
        response_id=response_row.response_id,
        s3_url=s3_url or "storage-not-configured",
    )
