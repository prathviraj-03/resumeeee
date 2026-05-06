from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import uuid
import aiofiles

from app.utils.database import get_db
from app.models.resume import Resume
from app.schemas.resume import (
    ParsedResume, ResumeUploadResponse, 
    ResumeListResponse, ResumeListItem, DownloadUrlResponse
)
from app.services.pdf_generator import generate_resume_pdf
from app.utils.storage import get_storage
from app.config import get_settings
import os

settings = get_settings()
router = APIRouter()

@router.get("/", response_model=ResumeListResponse)
@router.get("", response_model=ResumeListResponse, include_in_schema=False)
async def list_resumes(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):

    """List all resumes belonging to the authenticated user."""
    # Extract user identity manually for maximum resilience
    user_id = x_user_id or request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == user_id)
        .order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()

    
    items = [
        ResumeListItem(
            id=r.id,
            resume_id=r.id,
            filename=r.filename,
            status=r.status,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        for r in resumes
    ]
    
    return ResumeListResponse(total=len(items), data=items)

@router.get("/{resume_id}/download", response_model=DownloadUrlResponse)
async def get_download_url(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    """Generate a secure, signed download URL for a resume."""
    user_id = x_user_id or request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )

    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    storage = get_storage()
    if settings.STORAGE_BACKEND == "local":
        # For local dev, return a direct link if accessible or a mock
        return DownloadUrlResponse(url=f"/api/v1/download/{resume.id}")
    
    # Cloudinary signed URL
    from app.utils.storage import CloudinaryStorage
    if isinstance(storage, CloudinaryStorage):
        url = storage.generate_download_url(resume.storage_path)
        return DownloadUrlResponse(url=url)
    
    raise HTTPException(status_code=500, detail="Storage configuration error.")

@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resume(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    """Delete a resume from DB and storage."""
    user_id = x_user_id or request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )

    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Delete from storage
    try:
        storage = get_storage()
        await storage.delete(resume.storage_path)
    except Exception as e:
        # Log error but continue with DB deletion
        print(f"Error deleting from storage: {e}")

    await db.delete(resume)
    await db.commit()
    return None

@router.post("/", response_model=ResumeUploadResponse)
async def create_resume_from_data(
    payload: ParsedResume,
    x_user_id: str = Header(...),
    template_id: str = "resume.tex",
    filename: str = "manual_entry.pdf",
    db: AsyncSession = Depends(get_db),
):
    """Create a new resume entry directly from form data."""
    resume_id = str(uuid.uuid4())
    
    # Reconstruct raw_text for ATS scoring
    raw_parts = [payload.summary or ""]
    for exp in payload.experience:
        raw_parts.append(f"{exp.title} {exp.company} {' '.join(exp.description)}")
    for edu in payload.education:
        raw_parts.append(f"{edu.degree} {edu.institution}")
    raw_parts.append(" ".join(payload.skills))
    payload.raw_text = "\n".join(raw_parts)

    resume = Resume(
        id=resume_id,
        user_id=x_user_id,
        filename=filename,
        storage_path="manual",
        parsed_data=payload.model_dump(),
        status="parsed",
        template_id=template_id
    )
    
    db.add(resume)
    await db.commit()
    return ResumeUploadResponse(
        id=resume_id,
        resume_id=resume_id,
        filename=filename,
        status="parsed",
        parsed_data=payload,
        message="Resume created successfully."
    )


@router.put("/{resume_id}", response_model=ResumeUploadResponse)
async def update_resume_data(
    resume_id: str,
    payload: ParsedResume,
    x_user_id: str = Header(...),
    template_id: str = None,
    db: AsyncSession = Depends(get_db),
):
    """Update existing resume data and template preference."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == x_user_id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    if template_id:
        resume.template_id = template_id

    # Reconstruct raw_text
    raw_parts = [payload.summary or ""]
    for exp in payload.experience:
        raw_parts.append(f"{exp.title} {exp.company} {' '.join(exp.description)}")
    payload.raw_text = "\n".join(raw_parts)

    resume.parsed_data = payload.model_dump()
    resume.status = "parsed"
    
    await db.commit()
    return ResumeUploadResponse(
        id=resume_id,
        resume_id=resume_id,
        filename=resume.filename,
        status="parsed",
        parsed_data=payload,
        message="Resume updated successfully."
    )


@router.post("/{resume_id}/parse", response_model=ResumeUploadResponse)
async def reparse_resume(
    resume_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_user_id: Optional[str] = Header(None),
):
    """Re-run the AI parsing logic for an existing resume."""
    user_id = x_user_id or request.headers.get("x-user-id") or request.headers.get("X-User-Id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing User Identity")

    from app.services.pdf_parser import parse_resume_file
    from app.utils.logger import logger

    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
    )

    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")

    # Get file bytes from storage
    try:
        storage = get_storage()
        file_bytes = await storage.read(resume.storage_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file from storage: {str(e)}")

    # Parse the file
    try:
        parsed = await parse_resume_file(file_bytes, resume.filename)

        resume.parsed_data = parsed.model_dump()
        resume.status = "parsed"
        message = "Resume re-parsed successfully."
    except Exception as e:
        logger.error("reparse_resume_error", error=str(e))
        resume.status = "error"
        message = f"Parsing failed: {str(e)}"

    await db.commit()

    return ResumeUploadResponse(
        id=resume.id,
        resume_id=resume.id,
        filename=resume.filename,
        status=resume.status,
        parsed_data=ParsedResume(**resume.parsed_data) if resume.parsed_data else None,
        message=message,
    )


@router.post("/{resume_id}/generate", summary="Generate PDF from saved data")

async def generate_pdf_for_resume(
    resume_id: str,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
):
    """Trigger PDF generation and upload to Cloudinary/Storage."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == x_user_id)
    )
    resume = result.scalar_one_or_none()
    if not resume or not resume.parsed_data:
        raise HTTPException(status_code=404, detail="Resume data not found.")

    # 1. Generate local PDF
    output_filename = f"generated_{resume_id}.pdf"
    temp_path = os.path.join(settings.LOCAL_STORAGE_PATH, "output", output_filename)
    
    # For manual entries, we treat 'parsed_data' as both original and optimized
    parsed_resume = ParsedResume(**resume.parsed_data)
    
    pdf_path = await generate_resume_pdf(
        optimized=parsed_resume, 
        original=parsed_resume,
        output_path=temp_path,
        template_name=resume.template_id
    )

    # 2. Upload to Cloudinary/Storage
    storage = get_storage()
    async with aiofiles.open(pdf_path, "rb") as f:
        file_bytes = await f.read()
    
    storage_path = await storage.save(file_bytes, output_filename, subfolder="generated")
    
    # 3. Update DB
    resume.generated_pdf_path = storage_path
    await db.commit()

    return {
        "resume_id": resume_id,
        "pdf_url": storage_path if settings.STORAGE_BACKEND == "local" else storage.generate_download_url(storage_path)
    }

@router.get("/{resume_id}", response_model=ResumeUploadResponse)

async def get_resume_data(
    resume_id: str,
    x_user_id: str = Header(..., alias="X-User-Id"),
    db: AsyncSession = Depends(get_db),
):
    """Fetch resume data for the form."""
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == x_user_id)
    )
    resume = result.scalar_one_or_none()
    
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found.")
        
    return ResumeUploadResponse(
        id=resume.id,
        resume_id=resume.id,
        filename=resume.filename,
        status=resume.status,
        parsed_data=ParsedResume(**resume.parsed_data) if resume.parsed_data else None,
        message="Resume data retrieved."
    )


