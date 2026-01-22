"""add problem references

Revision ID: 18f0fefef3f4
Revises: 2e6c4a91b2f0
Create Date: 2026-03-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "18f0fefef3f4"
down_revision: Union[str, Sequence[str], None] = "2e6c4a91b2f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "problem_references",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("problem_id", sa.String(length=50), nullable=False),
        sa.Column("language", sa.String(length=20), nullable=False),
        sa.Column("solution_code", sa.Text(), nullable=False),
        sa.Column("optimal_time_complexity", sa.String(length=50), nullable=True),
        sa.Column("optimal_space_complexity", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("problem_id", name="uq_problem_references_problem_id"),
    )
    op.create_index(op.f("ix_problem_references_id"), "problem_references", ["id"], unique=False)
    op.create_index(op.f("ix_problem_references_problem_id"), "problem_references", ["problem_id"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_problem_references_problem_id"), table_name="problem_references")
    op.drop_index(op.f("ix_problem_references_id"), table_name="problem_references")
    op.drop_table("problem_references")
