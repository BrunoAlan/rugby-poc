"""Add player evolution analysis fields

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-02-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('players', sa.Column('ai_evolution_analysis', sa.Text(), nullable=True))
    op.add_column('players', sa.Column('ai_evolution_analysis_status', sa.String(length=20), nullable=False, server_default='pending'))
    op.add_column('players', sa.Column('ai_evolution_analysis_error', sa.String(length=500), nullable=True))
    op.add_column('players', sa.Column('ai_evolution_generated_at', sa.DateTime(), nullable=True))
    op.add_column('players', sa.Column('ai_evolution_match_count', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('players', 'ai_evolution_match_count')
    op.drop_column('players', 'ai_evolution_generated_at')
    op.drop_column('players', 'ai_evolution_analysis_error')
    op.drop_column('players', 'ai_evolution_analysis_status')
    op.drop_column('players', 'ai_evolution_analysis')
