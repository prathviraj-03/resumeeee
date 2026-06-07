"""profile first changes

Revision ID: 002
Revises: 001
Create Date: 2024-05-03 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ats_scores table
    op.alter_column('ats_scores', 'resume_id', existing_type=sa.String(36), nullable=True)

def downgrade() -> None:
    op.alter_column('ats_scores', 'resume_id', existing_type=sa.String(36), nullable=False)
