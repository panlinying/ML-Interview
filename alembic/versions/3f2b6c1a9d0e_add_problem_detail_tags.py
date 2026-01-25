"""add problem detail tags

Revision ID: 3f2b6c1a9d0e
Revises: 18f0fefef3f4
Create Date: 2026-03-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f2b6c1a9d0e"
down_revision: Union[str, Sequence[str], None] = "18f0fefef3f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("problem_details", sa.Column("tags", sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("problem_details", "tags")
