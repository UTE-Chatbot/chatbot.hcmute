"""convert_user_id_to_uuid

Revision ID: aa04ab2a8b90
Revises: fa9a335d5e77
Create Date: 2025-11-21 13:22:05.645660

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa04ab2a8b90'
down_revision: Union[str, Sequence[str], None] = 'fa9a335d5e77'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
