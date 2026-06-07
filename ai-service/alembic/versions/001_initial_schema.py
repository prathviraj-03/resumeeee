"""Initial schema

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ai_resumes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(512), nullable=False),
        sa.Column("parsed_data", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="uploaded"),
        sa.Column("template_id", sa.String(50), nullable=False, server_default="resume.tex"),
        sa.Column("generated_pdf_path", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "ats_scores",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("ai_resumes.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("jd_hash", sa.String(64), nullable=False),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("composite_score", sa.Float(), nullable=False),
        sa.Column("keyword_score", sa.Float(), nullable=False),
        sa.Column("semantic_score", sa.Float(), nullable=False),
        sa.Column("format_score", sa.Float(), nullable=False),
        sa.Column("keyword_matches", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("keyword_gaps", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("section_analysis", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "optimization_jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("resume_id", sa.String(36), sa.ForeignKey("ai_resumes.id", ondelete="CASCADE"), nullable=True),
        sa.Column("user_id", sa.String(36), nullable=False, index=True),
        sa.Column("jd_hash", sa.String(64), nullable=False),
        sa.Column("job_description", sa.Text(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("optimized_data", postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column("output_pdf_path", sa.String(512), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("progress", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("template_id", sa.String(50), nullable=False, server_default="resume.tex"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("optimization_jobs")
    op.drop_table("ats_scores")
    op.drop_table("ai_resumes")
