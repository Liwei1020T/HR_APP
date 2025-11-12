"""005_create_announcements

Revision ID: 005_announcements
Revises: 004_notifications
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_announcements'
down_revision: Union[str, None] = '004_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create announcements table
    op.create_table(
        'announcements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('is_pinned', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_announcements_created_by'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_announcements_category', 'announcements', ['category'])
    op.create_index('ix_announcements_is_pinned', 'announcements', ['is_pinned'])
    op.create_index('ix_announcements_is_active', 'announcements', ['is_active'])
    op.create_index('ix_announcements_created_by', 'announcements', ['created_by'])
    op.create_index('ix_announcements_created_at', 'announcements', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_announcements_created_at', table_name='announcements')
    op.drop_index('ix_announcements_created_by', table_name='announcements')
    op.drop_index('ix_announcements_is_active', table_name='announcements')
    op.drop_index('ix_announcements_is_pinned', table_name='announcements')
    op.drop_index('ix_announcements_category', table_name='announcements')
    op.drop_table('announcements')
