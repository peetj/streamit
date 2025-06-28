"""add play count field to songs table

Revision ID: 2a12566ae957
Revises: 4640eee96cdb
Create Date: 2025-06-28 12:59:46.223160

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2a12566ae957'
down_revision = '4640eee96cdb'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add play_count column to songs table
    op.add_column('songs', sa.Column('play_count', sa.Integer(), nullable=True, server_default='0'))


def downgrade() -> None:
    # Remove play_count column from songs table
    op.drop_column('songs', 'play_count')