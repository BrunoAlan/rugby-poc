"""Add ai_analysis_status field

Revision ID: b2c3d4e5f6a7
Revises: 3f2634d667ac
Create Date: 2026-01-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = '3f2634d667ac'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'matches',
        sa.Column('ai_analysis_status', sa.String(length=20), nullable=False, server_default='skipped')
    )


def downgrade() -> None:
    op.drop_column('matches', 'ai_analysis_status')
