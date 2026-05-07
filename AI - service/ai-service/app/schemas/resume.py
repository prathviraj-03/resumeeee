from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ── Contact ───────────────────────────────────────────────────────────────────

class ContactInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


# ── Optimized Output ──────────────────────────────────────────────────────────

class OptimizedResumeData(BaseModel):
    contact: Optional[ContactInfo] = None
    summary: str = ""
    experience: list[dict] = Field(default_factory=list)
    education: list[dict] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)
    projects: list[dict] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)


# ── API Request / Response ────────────────────────────────────────────────────

class OptimizationRequest(BaseModel):
    job_description: str = Field(..., min_length=50, description="The job description to optimize against")
    template_id: str = Field(default="resume.html", description="HTML template name to use for PDF generation")


class ATSScoreRequest(BaseModel):
    jobDescription: str = Field(..., min_length=50, description="The job description to score against")


class SkillGapRequest(BaseModel):
    job_description: str = Field(..., min_length=50)
    current_skills: Optional[list[str]] = None
    profile_data: Optional[dict] = None


class OptimizationResponse(BaseModel):
    job_id: str
    status: str                             # completed | failed
    optimized_data: Optional[OptimizedResumeData] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: str                             # pending | processing | completed | failed
    progress: int
    optimized_data: Optional[OptimizedResumeData] = None
    download_url: Optional[str] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class JobListItem(BaseModel):
    job_id: str
    status: str
    progress: int
    template_id: str
    download_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class JobListResponse(BaseModel):
    total: int
    data: list[JobListItem]
