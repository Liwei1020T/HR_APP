"""002_create_channels_and_memberships

Revision ID: 002
Revises: 001
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_channels'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create channels table
    op.create_table(
        'channels',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default=sa.text('1')),
        sa.Column('created_by', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['created_by'], ['users.id'], name='fk_channels_created_by'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name', name='uq_channels_name')
    )
    op.create_index('ix_channels_is_public', 'channels', ['is_public'])
    op.create_index('ix_channels_created_by', 'channels', ['created_by'])

    # Create channel_members table
    op.create_table(
        'channel_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('channel_id', sa.Integer(), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='member'),
        sa.Column('joined_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_channel_members_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['channel_id'], ['channels.id'], name='fk_channel_members_channel_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'channel_id', name='uq_channel_members_user_channel')
    )
    op.create_index('ix_channel_members_user_id', 'channel_members', ['user_id'])
    op.create_index('ix_channel_members_channel_id', 'channel_members', ['channel_id'])


def downgrade() -> None:
    op.drop_index('ix_channel_members_channel_id', table_name='channel_members')
    op.drop_index('ix_channel_members_user_id', table_name='channel_members')
    op.drop_table('channel_members')
    
    op.drop_index('ix_channels_created_by', table_name='channels')
    op.drop_index('ix_channels_is_public', table_name='channels')
    op.drop_table('channels')
