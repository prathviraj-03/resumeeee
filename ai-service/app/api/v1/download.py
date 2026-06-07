"""
GET /api/v1/download/{job_id}

Proxies the optimized resume PDF directly to the client.
This avoids Cloudinary URL format issues and works regardless of
storage backend (Cloudinary or local).
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pathlib import Path

from app.utils.database import get_db
from app.models.resume import OptimizationJob
from app.utils.storage import get_storage
from app.utils.logger import logger

router = APIRouter()


@router.get(
    "/download/{job_id}",
    summary="Download the optimized resume PDF",
    tags=["download"],
    response_class=Response,
    responses={
        200: {
            "content": {"application/pdf": {}},
            "description": "PDF file download",
        },
        404: {"description": "Job or PDF not found"},
        409: {"description": "Job not yet completed"},
    },
)
async def download_pdf(
    job_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Stream the optimized resume PDF directly to the browser.

    Works for both Cloudinary and local storage backends.
    The PDF is fetched server-side and returned as a proper attachment,
    avoiding URL redirect issues and CORS errors.
    """
    result = await db.execute(
        select(OptimizationJob).where(OptimizationJob.id == job_id)
    )
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if job.status != "completed":
        raise HTTPException(
            status_code=409,
            detail=f"Job is not completed yet. Current status: {job.status}",
        )

    if not job.output_pdf_path:
        raise HTTPException(status_code=404, detail="PDF not available for this job.")

    storage = get_storage()
    filename = f"resume_{job_id[:8]}.pdf"

    try:
        # ── Cloudinary: fetch bytes server-side and stream to client ─────────
        # This is the most reliable approach — avoids URL signing issues,
        # CORS problems, and incorrect resource_type URL formatting.
        pdf_bytes = await storage.read(job.output_pdf_path)

        logger.info("pdf_download_ok", job_id=job_id, size=len(pdf_bytes))

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
                "Cache-Control": "no-cache",
            },
        )

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="PDF file not found in storage.")
    except Exception as e:
        logger.error("pdf_download_failed", job_id=job_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve PDF: {str(e)}")
