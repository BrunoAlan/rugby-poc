"""Add AI analysis fields

Revision ID: a1b2c3d4e5f6
Revises: e530b49e113f
Create Date: 2026-01-25 21:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'e530b49e113f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('matches', sa.Column('ai_analysis', sa.Text(), nullable=True))
    op.add_column('matches', sa.Column('ai_analysis_generated_at', sa.DateTime(), nullable=True))
    op.add_column('matches', sa.Column('ai_analysis_error', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('matches', 'ai_analysis_error')
    op.drop_column('matches', 'ai_analysis_generated_at')
    op.drop_column('matches', 'ai_analysis')
