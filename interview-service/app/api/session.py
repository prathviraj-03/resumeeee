from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.database import get_db
from app.api.auth import get_current_user
from app.schemas.schemas import (
    SessionStartRequest, SessionStartResponse,
    SessionOut, SessionListItem, SessionEndResponse, TokenData,
)
from app.services.session_service import (
    start_session, get_session, list_sessions, end_session,
)

router = APIRouter(prefix="/api/interview/session", tags=["sessions"])


@router.post("/start", response_model=SessionStartResponse, status_code=201)
async def start(
    req: SessionStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Create a new interview session and receive the question list."""
    return await start_session(db, current_user.user_id, req)


@router.get("/sessions", response_model=list[SessionListItem])
async def list_user_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """List all past sessions for the authenticated user."""
    return await list_sessions(db, current_user.user_id, skip=skip, limit=limit)


@router.get("/{session_id}", response_model=SessionOut)
async def get_one_session(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Fetch a full session with all responses."""
    return await get_session(db, session_id, current_user.user_id)


@router.get("/{session_id}/report", response_model=SessionOut)
async def get_session_report(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Fetch the full post-interview report (same as fetching session, but explicit)."""
    session = await get_session(db, session_id, current_user.user_id)
    if session.status != "completed":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Report not available. Session is not completed.")
    return session


@router.post("/{session_id}/end", response_model=SessionOut)
async def end(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """End session, compute overall score, and generate summary report."""
    return await end_session(db, session_id, current_user.user_id)


@router.delete("/{session_id}", status_code=204)
async def delete(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Permanently delete an interview session and all its responses."""
    from app.services.session_service import delete_session
    await delete_session(db, session_id, current_user.user_id)
    return None
