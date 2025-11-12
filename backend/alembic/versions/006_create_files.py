"""Create files table

Revision ID: 006_files
Revises: 005_announcements
Create Date: 2025-11-12

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '006_files'
down_revision = '005_announcements'
branch_labels = None
depends_on = None


def upgrade():
    # Create files table
    op.create_table(
        'files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('original_filename', sa.String(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('size', sa.BigInteger(), nullable=False),
        sa.Column('storage_path', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=True),
        sa.Column('entity_id', sa.Integer(), nullable=True),
        sa.Column('uploaded_by', sa.Integer(), nullable=False),
        sa.Column('uploaded_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_files_id', 'files', ['id'])
    op.create_index('ix_files_uploaded_by', 'files', ['uploaded_by'])
    op.create_index('ix_files_entity', 'files', ['entity_type', 'entity_id'])
    op.create_index('ix_files_uploaded_at', 'files', ['uploaded_at'])


def downgrade():
    op.drop_index('ix_files_uploaded_at', 'files')
    op.drop_index('ix_files_entity', 'files')
    op.drop_index('ix_files_uploaded_by', 'files')
    op.drop_index('ix_files_id', 'files')
    op.drop_table('files')
