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

from app.services.pdf_parser import parse_resume_file

settings = get_settings()
logger = logging.getLogger(__name__)
router = APIRouter()

async def _fetch_resume_content(
    user_id: str,
    resume_id: Optional[str] = None,
    authorization: Optional[str] = None
) -> dict:
    """
    Fetch content from either the master profile or a specific resume PDF.
    """
    headers = {"X-User-Id": user_id}
    if authorization:
        headers["Authorization"] = authorization

    # If resume_id is provided, fetch that specific resume's content
    if resume_id and resume_id != "master":
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                # 1. Get the download URL from the profile service
                url_resp = await client.get(
                    f"{settings.PROFILE_SERVICE_URL}/api/profile/resumes/{resume_id}/download",
                    headers=headers,
                )
                url_resp.raise_for_status()
                download_url = url_resp.json().get("url")

                if not download_url:
                    raise HTTPException(status_code=404, detail="Resume download URL not found.")

                # 2. Download the actual file content
                file_resp = await client.get(download_url)
                file_resp.raise_for_status()
                
                # 3. Parse the file content
                parsed_content = await parse_resume_file(file_resp.content, f"{resume_id}.pdf")
                return parsed_content

        except httpx.HTTPStatusError as e:
            logger.error("resume_fetch_http_error", user_id=user_id, resume_id=resume_id, status=e.response.status_code)
            raise HTTPException(
                status_code=status.HTTP_424_FAILED_DEPENDENCY,
                detail=f"Could not fetch resume PDF: HTTP {e.response.status_code}",
            )
        except Exception as e:
            logger.error("resume_fetch_error", user_id=user_id, resume_id=resume_id, error=str(e))
            raise HTTPException(
                status_code=status.HTTP_424_FAILED_DEPENDENCY,
                detail=f"Could not retrieve or parse resume PDF: {e}",
            )

    # Default to fetching the master profile
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
    Fetch user profile or a specific resume and calculate ATS score against a JD.
    If `jobDescription` is omitted, a resume-only analysis is performed.
    If `resumeId` is omitted, the master profile is used.
    """
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity (X-User-Id header)")

    if not payload.jobDescription and not payload.resumeId:
        raise HTTPException(status_code=400, detail="Either jobDescription or resumeId must be provided.")

    authorization = request.headers.get("authorization")

    # 1. Fetch resume content (master profile or specific PDF)
    content_to_score = await _fetch_resume_content(user_id, payload.resumeId, authorization)

    # 2. Run ATS scoring
    result = await run_ats_score(content_to_score, payload.jobDescription)

    return {
        **result,
        "resume_id": payload.resumeId or "master",
        "user_id": user_id
    }
