"""Pivot scoring_weights to per-position rows

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-02-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4e5f6a7b8c9'
down_revision: Union[str, None] = 'c3d4e5f6a7b8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create new table with per-position schema
    op.create_table(
        'scoring_weights_new',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('config_id', sa.Integer(), sa.ForeignKey('scoring_configurations.id'), nullable=False),
        sa.Column('action_name', sa.String(50), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('config_id', 'action_name', 'position', name='uq_config_action_position'),
    )

    # 2. Migrate data: expand each old row into 15 per-position rows
    conn = op.get_bind()
    old_rows = conn.execute(
        sa.text('SELECT id, config_id, action_name, forwards_weight, backs_weight, created_at, updated_at FROM scoring_weights')
    ).fetchall()

    for row in old_rows:
        config_id = row[1]
        action_name = row[2]
        forwards_weight = row[3]
        backs_weight = row[4]
        created_at = row[5]
        updated_at = row[6]

        for pos in range(1, 16):
            weight = forwards_weight if pos <= 8 else backs_weight
            conn.execute(
                sa.text(
                    'INSERT INTO scoring_weights_new (config_id, action_name, position, weight, created_at, updated_at) '
                    'VALUES (:config_id, :action_name, :position, :weight, :created_at, :updated_at)'
                ),
                {
                    'config_id': config_id,
                    'action_name': action_name,
                    'position': pos,
                    'weight': weight,
                    'created_at': created_at,
                    'updated_at': updated_at,
                },
            )

    # 3. Drop old table and rename new one
    op.drop_table('scoring_weights')
    op.rename_table('scoring_weights_new', 'scoring_weights')


def downgrade() -> None:
    # 1. Create old-schema table
    op.create_table(
        'scoring_weights_old',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('config_id', sa.Integer(), sa.ForeignKey('scoring_configurations.id'), nullable=False),
        sa.Column('action_name', sa.String(50), nullable=False),
        sa.Column('forwards_weight', sa.Float(), nullable=False),
        sa.Column('backs_weight', sa.Float(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('config_id', 'action_name', name='uq_config_action'),
    )

    # 2. Collapse per-position rows back: position=1 -> forwards, position=9 -> backs
    conn = op.get_bind()
    rows = conn.execute(
        sa.text(
            'SELECT DISTINCT config_id, action_name FROM scoring_weights'
        )
    ).fetchall()

    for row in rows:
        config_id = row[0]
        action_name = row[1]

        fwd_row = conn.execute(
            sa.text(
                'SELECT weight, created_at, updated_at FROM scoring_weights '
                'WHERE config_id = :config_id AND action_name = :action_name AND position = 1'
            ),
            {'config_id': config_id, 'action_name': action_name},
        ).fetchone()

        back_row = conn.execute(
            sa.text(
                'SELECT weight FROM scoring_weights '
                'WHERE config_id = :config_id AND action_name = :action_name AND position = 9'
            ),
            {'config_id': config_id, 'action_name': action_name},
        ).fetchone()

        if fwd_row and back_row:
            conn.execute(
                sa.text(
                    'INSERT INTO scoring_weights_old (config_id, action_name, forwards_weight, backs_weight, created_at, updated_at) '
                    'VALUES (:config_id, :action_name, :forwards_weight, :backs_weight, :created_at, :updated_at)'
                ),
                {
                    'config_id': config_id,
                    'action_name': action_name,
                    'forwards_weight': fwd_row[0],
                    'backs_weight': back_row[0],
                    'created_at': fwd_row[1],
                    'updated_at': fwd_row[2],
                },
            )

    # 3. Drop new table and rename old one back
    op.drop_table('scoring_weights')
    op.rename_table('scoring_weights_old', 'scoring_weights')
