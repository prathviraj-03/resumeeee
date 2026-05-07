import httpx
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from app.config.settings import get_settings
from app.schemas.resume import ATSScoreRequest
from app.services.ats_service import run_ats_score

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter()

async def _fetch_master_profile(user_id: str, authorization: Optional[str] = None) -> dict:
    """Fetch the user's master profile from the Profile Service."""
    headers = {"X-User-Id": user_id}
    if authorization:
        headers["Authorization"] = authorization

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{settings.PROFILE_SERVICE_URL}/api/profile",
                headers=headers,
            )
            resp.raise_for_status()
            return resp.json()
    except httpx.HTTPStatusError as e:
        logger.error("profile_fetch_http_error", user_id=user_id, status=e.response.status_code)
        raise HTTPException(
            status_code=status.HTTP_424_FAILED_DEPENDENCY,
            detail=f"Could not fetch master profile: HTTP {e.response.status_code}",
        )
    except Exception as e:
        logger.error("profile_fetch_error", user_id=user_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_424_FAILED_DEPENDENCY,
            detail="Could not reach Profile Service. Ensure your profile is complete.",
        )

@router.post("/ats/score", summary="Calculate ATS score for a job description")
async def calculate_ats_score(
    payload: ATSScoreRequest,
    request: Request,
    x_user_id: Optional[str] = Header(None),
):
    """
    Fetch user profile and calculate ATS score against JD using OpenAI.
    """
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity (X-User-Id header)")

    authorization = request.headers.get("authorization")

    # 1. Fetch master profile
    profile = await _fetch_master_profile(user_id, authorization)

    # 2. Run ATS scoring (Direct OpenAI call)
    result = await run_ats_score(profile, payload.jobDescription)

    return {
        **result,
        "resume_id": "master",
        "user_id": user_id
    }
