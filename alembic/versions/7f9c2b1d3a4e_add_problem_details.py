"""add problem details

Revision ID: 7f9c2b1d3a4e
Revises: d17c30156c1f
Create Date: 2026-03-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7f9c2b1d3a4e"
down_revision: Union[str, Sequence[str], None] = "d17c30156c1f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "problem_details",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("description_html", sa.Text(), nullable=False),
        sa.Column("difficulty", sa.String(length=20), nullable=True),
        sa.Column("source", sa.String(length=50), nullable=False),
        sa.Column("fetched_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_problem_details_slug"),
    )
    op.create_index(op.f("ix_problem_details_id"), "problem_details", ["id"], unique=False)
    op.create_index(op.f("ix_problem_details_slug"), "problem_details", ["slug"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_problem_details_slug"), table_name="problem_details")
    op.drop_index(op.f("ix_problem_details_id"), table_name="problem_details")
    op.drop_table("problem_details")
