"""add liked songs many-to-many table

Revision ID: 4640eee96cdb
Revises: 0741de655593
Create Date: 2025-06-28 12:26:40.654609

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4640eee96cdb'
down_revision = '0741de655593'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'liked_songs',
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('song_id', sa.String(), sa.ForeignKey('songs.id'), primary_key=True)
    )


def downgrade() -> None:
    op.drop_table('liked_songs')