"""
POST /api/v1/optimize
  → Fetch master profile from Profile Service
  → Call OpenAI to generate optimized resume
  → Render HTML template → PDF via Puppeteer
  → Upload to Cloudinary
  → Return download URL immediately

GET /api/v1/optimize/{job_id}
  → Poll job status and retrieve result
"""
import hashlib
import os
import uuid
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.utils.database import get_db
from app.models.resume import OptimizationJob
from app.schemas.resume import (
    OptimizationRequest,
    OptimizationResponse,
    JobStatusResponse,
    OptimizedResumeData,
)
from app.chains.optimize_chain import run_optimization_chain
from app.services.pdf_generator import generate_resume_pdf
from app.utils.storage import get_storage
from app.utils.logger import logger
from app.config import get_settings

settings = get_settings()
router = APIRouter()


def _jd_hash(jd: str) -> str:
    return hashlib.sha256(jd.encode()).hexdigest()[:16]


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


async def _run_pipeline(job_id: str, profile: dict, job_description: str, template_id: str, db: AsyncSession):
    """
    Full optimization pipeline — runs synchronously within the request.
    Updates the OptimizationJob record as it progresses.
    """
    # Load job
    result = await db.execute(select(OptimizationJob).where(OptimizationJob.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        return

    try:
        # Step 1 → Call OpenAI
        job.status = "processing"
        job.progress = 20
        await db.commit()

        optimized: OptimizedResumeData = await run_optimization_chain(
            profile=profile,
            job_description=job_description,
        )
        job.optimized_data = optimized.model_dump()
        job.progress = 60
        await db.commit()

        # Step 2 → Generate PDF
        output_path = os.path.join(
            settings.LOCAL_STORAGE_PATH, "output", f"{job_id}.pdf"
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        await generate_resume_pdf(
            optimized=optimized,
            original=optimized,      # profile already embedded in optimized data
            output_path=output_path,
            template_name=template_id,
        )
        job.progress = 80
        await db.commit()

        # Step 3 → Upload to storage
        storage = get_storage()
        with open(output_path, "rb") as f:
            pdf_bytes = f.read()

        storage_path = await storage.save(
            pdf_bytes, f"{job_id}.pdf", subfolder="resumes/optimized"
        )

        # Cleanup temp file
        try:
            os.remove(output_path)
        except OSError:
            pass

        # Step 4 → Complete
        job.output_pdf_path = storage_path
        job.status = "completed"
        job.progress = 100
        await db.commit()

        logger.info("optimization_pipeline_complete", job_id=job_id)

    except Exception as e:
        logger.error("optimization_pipeline_failed", job_id=job_id, error=str(e))
        job.status = "failed"
        job.error_message = str(e)
        await db.commit()
        raise


def _build_download_url(job: OptimizationJob) -> Optional[str]:
    """Return the API download URL — the endpoint proxies the PDF directly."""
    if job.status != "completed" or not job.output_pdf_path:
        return None
    return f"/api/v1/download/{job.id}"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post(
    "/optimize",
    response_model=OptimizationResponse,
    status_code=status.HTTP_200_OK,
    summary="Optimize resume against a job description",
    tags=["optimization"],
)
async def optimize_resume(
    payload: OptimizationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    """
    Full pipeline:
    1. Fetch master profile from Profile Service
    2. Call OpenAI to generate optimized resume content
    3. Render PDF from HTML template (Puppeteer)
    4. Upload PDF to Cloudinary / local storage
    5. Return download URL + structured optimized data
    """
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity (X-User-Id header)")

    authorization = request.headers.get("authorization")

    # Fetch master profile
    profile = await _fetch_master_profile(user_id, authorization)

    # Create job record
    job_id = str(uuid.uuid4())
    job = OptimizationJob(
        id=job_id,
        user_id=user_id,
        job_description=payload.job_description,
        jd_hash=_jd_hash(payload.job_description),
        template_id=payload.template_id,
        profile_snapshot=profile,
        status="pending",
        progress=0,
    )
    db.add(job)
    await db.commit()

    logger.info("optimization_started", job_id=job_id, user_id=user_id)

    # Run pipeline (synchronous — blocks until complete)
    await _run_pipeline(job_id, profile, payload.job_description, payload.template_id, db)

    # Reload job for final state
    result = await db.execute(select(OptimizationJob).where(OptimizationJob.id == job_id))
    job = result.scalar_one()

    optimized_data = OptimizedResumeData(**job.optimized_data) if job.optimized_data else None

    return OptimizationResponse(
        job_id=job_id,
        status=job.status,
        optimized_data=optimized_data,
        download_url=_build_download_url(job),
        error=job.error_message,
        created_at=job.created_at,
    )


@router.get(
    "/optimize/{job_id}",
    response_model=JobStatusResponse,
    summary="Get optimization job status",
    tags=["optimization"],
)
async def get_optimization_status(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(OptimizationJob).where(OptimizationJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Optimization job not found.")

    optimized_data = OptimizedResumeData(**job.optimized_data) if job.optimized_data else None

    return JobStatusResponse(
        job_id=job_id,
        status=job.status,
        progress=job.progress,
        optimized_data=optimized_data,
        download_url=_build_download_url(job),
        error=job.error_message,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )
