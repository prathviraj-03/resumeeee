import httpx
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status, Request
from app.config.settings import get_settings
from app.schemas.resume import SkillGapRequest
from app.services.skills_service import analyze_skill_gap, generate_roadmap

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter()


def _validate_roadmap_payload(data: dict) -> bool:
    if not isinstance(data, dict):
        return False

    if not isinstance(data.get("target_role"), str):
        return False

    if not isinstance(data.get("estimated_weeks"), int):
        return False

    weeks = data.get("weeks")
    if not isinstance(weeks, list):
        return False

    for week in weeks:
        if not isinstance(week, dict):
            return False
        if not isinstance(week.get("week_number"), int):
            return False
        if not isinstance(week.get("focus_area"), str):
            return False

        items = week.get("items")
        if not isinstance(items, list):
            return False

        for item in items:
            if not isinstance(item, dict):
                return False
            if not all(isinstance(item.get(k), str) for k in ["skill", "title", "description", "resource", "priority"]):
                return False

    return True

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

@router.post("/skill-gap/analyze", summary="Analyze skill gaps against a JD")
async def analyze_skills(
    payload: SkillGapRequest,
    request: Request,
    x_user_id: Optional[str] = Header(None),
):
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    authorization = request.headers.get("authorization")
    
    # Use provided profile data or fetch fresh
    profile = payload.profile_data or await _fetch_master_profile(user_id, authorization)
    
    try:
        result = await analyze_skill_gap(profile, payload.job_description)
        return result
    except Exception as e:
        logger.exception("skill_gap_analyze_failed user_id=%s error=%s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Skill gap analysis failed. Please try again.",
        )

@router.post("/skill-gap/generate", summary="Generate a learning roadmap")
async def generate_skills_roadmap(
    payload: SkillGapRequest,
    request: Request,
    x_user_id: Optional[str] = Header(None),
):
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    # Use provided missing skills or derived from a fresh analysis if needed
    # But frontend usually passes missing skills in 'current_skills' field for this endpoint
    missing_skills = payload.current_skills or []

    if not missing_skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Missing skills are required to generate a roadmap.",
        )

    try:
        result = await generate_roadmap(missing_skills, payload.job_description)
    except Exception as e:
        logger.exception("skill_gap_generate_failed user_id=%s error=%s", user_id, str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Roadmap generation failed. Please try again.",
        )

    if not _validate_roadmap_payload(result):
        logger.error("skill_gap_generate_invalid_payload user_id=%s", user_id)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Roadmap generation returned an invalid payload.",
        )

    return result
