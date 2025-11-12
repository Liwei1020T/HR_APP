"""003_create_feedback_and_comments

Revision ID: 003_feedback
Revises: 002_channels
Create Date: 2025-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_feedback'
down_revision: Union[str, None] = '002_channels'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create feedback table
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('is_anonymous', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('submitted_by', sa.Integer(), nullable=False),
        sa.Column('assigned_to', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['submitted_by'], ['users.id'], name='fk_feedback_submitted_by'),
        sa.ForeignKeyConstraint(['assigned_to'], ['users.id'], name='fk_feedback_assigned_to'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feedback_submitted_by', 'feedback', ['submitted_by'])
    op.create_index('ix_feedback_assigned_to', 'feedback', ['assigned_to'])
    op.create_index('ix_feedback_status', 'feedback', ['status'])
    op.create_index('ix_feedback_category', 'feedback', ['category'])

    # Create feedback_comments table
    op.create_table(
        'feedback_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), nullable=False, server_default=sa.text('0')),
        sa.Column('feedback_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['feedback_id'], ['feedback.id'], name='fk_feedback_comments_feedback_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_feedback_comments_user_id'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feedback_comments_feedback_id', 'feedback_comments', ['feedback_id'])
    op.create_index('ix_feedback_comments_user_id', 'feedback_comments', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_feedback_comments_user_id', table_name='feedback_comments')
    op.drop_index('ix_feedback_comments_feedback_id', table_name='feedback_comments')
    op.drop_table('feedback_comments')
    
    op.drop_index('ix_feedback_category', table_name='feedback')
    op.drop_index('ix_feedback_status', table_name='feedback')
    op.drop_index('ix_feedback_assigned_to', table_name='feedback')
    op.drop_index('ix_feedback_submitted_by', table_name='feedback')
    op.drop_table('feedback')
