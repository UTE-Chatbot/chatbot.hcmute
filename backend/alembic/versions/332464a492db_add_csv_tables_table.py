"""add_csv_tables_table

Revision ID: 332464a492db
Revises: e34fb282ac7e
Create Date: 2025-11-30 01:24:39.190388

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '332464a492db'
down_revision: Union[str, Sequence[str], None] = 'e34fb282ac7e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'csv_tables',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('url', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('columns', sa.dialects.postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('NOW()')),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_csv_tables_id'), 'csv_tables', ['id'], unique=False)
    op.create_index(op.f('ix_csv_tables_name'), 'csv_tables', ['name'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_csv_tables_name'), table_name='csv_tables')
    op.drop_index(op.f('ix_csv_tables_id'), table_name='csv_tables')
    op.drop_table('csv_tables')
