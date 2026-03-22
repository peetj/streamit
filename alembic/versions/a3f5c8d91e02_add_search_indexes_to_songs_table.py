"""add search indexes to songs table

Revision ID: a3f5c8d91e02
Revises: 2a12566ae957
Create Date: 2026-03-22 00:00:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'a3f5c8d91e02'
down_revision = '2a12566ae957'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('ix_songs_title', 'songs', ['title'])
    op.create_index('ix_songs_artist', 'songs', ['artist'])
    op.create_index('ix_songs_album', 'songs', ['album'])


def downgrade() -> None:
    op.drop_index('ix_songs_album', table_name='songs')
    op.drop_index('ix_songs_artist', table_name='songs')
    op.drop_index('ix_songs_title', table_name='songs')
