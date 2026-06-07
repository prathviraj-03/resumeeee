from sqlalchemy import String, Text, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base, TimestampMixin, UUIDMixin


class OptimizationJob(Base, UUIDMixin, TimestampMixin):
    """Stores every AI optimization request and its result."""
    __tablename__ = "optimization_jobs"

    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    job_description: Mapped[str] = mapped_column(Text, nullable=False)
    jd_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    template_id: Mapped[str] = mapped_column(String(50), default="resume.html", nullable=False)

    # Snapshot of the master profile used for this optimization
    profile_snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Pipeline state
    status: Mapped[str] = mapped_column(
        String(50), default="pending", nullable=False
    )  # pending | processing | completed | failed
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Outputs
    optimized_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    output_pdf_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
