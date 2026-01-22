"""add problem test cases

Revision ID: 2e6c4a91b2f0
Revises: 7f9c2b1d3a4e
Create Date: 2026-03-22 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2e6c4a91b2f0"
down_revision: Union[str, Sequence[str], None] = "7f9c2b1d3a4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "problem_test_cases",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("problem_id", sa.String(length=50), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=False),
        sa.Column("expected_output", sa.Text(), nullable=False),
        sa.Column("is_hidden", sa.Boolean(), nullable=False),
        sa.Column("time_limit_ms", sa.Integer(), nullable=True),
        sa.Column("slow_limit_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("problem_id", "input_text", "expected_output", name="uq_problem_test_case"),
    )
    op.create_index(op.f("ix_problem_test_cases_id"), "problem_test_cases", ["id"], unique=False)
    op.create_index(op.f("ix_problem_test_cases_problem_id"), "problem_test_cases", ["problem_id"], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_problem_test_cases_problem_id"), table_name="problem_test_cases")
    op.drop_index(op.f("ix_problem_test_cases_id"), table_name="problem_test_cases")
    op.drop_table("problem_test_cases")
