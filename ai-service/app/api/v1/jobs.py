"""
GET /api/v1/jobs           — list user's optimization history
DELETE /api/v1/jobs/{id}   — delete a job and its PDF
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.utils.database import get_db
from app.models.resume import OptimizationJob
from app.schemas.resume import JobListResponse, JobListItem
from app.utils.storage import get_storage
from app.utils.logger import logger

router = APIRouter()


def _download_url(job: OptimizationJob) -> Optional[str]:
    """Return the API download URL — the endpoint proxies the PDF directly."""
    if job.status != "completed" or not job.output_pdf_path:
        return None
    return f"/api/v1/download/{job.id}"


@router.get(
    "/jobs",
    response_model=JobListResponse,
    summary="List user's optimization jobs",
    tags=["jobs"],
)
async def list_jobs(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    result = await db.execute(
        select(OptimizationJob)
        .where(OptimizationJob.user_id == user_id)
        .order_by(OptimizationJob.created_at.desc())
    )
    jobs = result.scalars().all()

    items = [
        JobListItem(
            job_id=j.id,
            status=j.status,
            progress=j.progress,
            template_id=j.template_id,
            download_url=_download_url(j),
            created_at=j.created_at,
            updated_at=j.updated_at,
        )
        for j in jobs
    ]
    return JobListResponse(total=len(items), data=items)


@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an optimization job and its PDF",
    tags=["jobs"],
)
async def delete_job(
    job_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    user_id = x_user_id or request.headers.get("x-user-id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    result = await db.execute(
        select(OptimizationJob).where(
            OptimizationJob.id == job_id,
            OptimizationJob.user_id == user_id,
        )
    )
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    # Delete PDF from storage
    if job.output_pdf_path:
        try:
            storage = get_storage()
            await storage.delete(job.output_pdf_path)
        except Exception as e:
            logger.warning("storage_delete_failed", job_id=job_id, error=str(e))

    await db.delete(job)
    await db.commit()
    return None
