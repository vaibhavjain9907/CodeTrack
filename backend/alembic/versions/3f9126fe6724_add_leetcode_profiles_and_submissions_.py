"""add leetcode profiles and submissions tables

Revision ID: 3f9126fe6724
Revises: 71a2e84aeae9
Create Date: 2026-06-29 07:05:40.564108

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "3f9126fe6724"
down_revision: Union[str, None] = "71a2e84aeae9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "leetcode_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("leetcode_username", sa.String(length=100), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("ranking", sa.Integer(), nullable=True),
        sa.Column("total_solved", sa.Integer(), nullable=False),
        sa.Column("total_questions", sa.Integer(), nullable=False),
        sa.Column("easy_solved", sa.Integer(), nullable=False),
        sa.Column("easy_total", sa.Integer(), nullable=False),
        sa.Column("medium_solved", sa.Integer(), nullable=False),
        sa.Column("medium_total", sa.Integer(), nullable=False),
        sa.Column("hard_solved", sa.Integer(), nullable=False),
        sa.Column("hard_total", sa.Integer(), nullable=False),
        sa.Column("acceptance_rate", sa.Float(), nullable=True),
        sa.Column("contribution_points", sa.Integer(), nullable=False),
        sa.Column("streak", sa.Integer(), nullable=False),
        sa.Column("synced_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_leetcode_profiles_id"), "leetcode_profiles", ["id"], unique=False)
    op.create_index(
        op.f("ix_leetcode_profiles_leetcode_username"),
        "leetcode_profiles",
        ["leetcode_username"],
        unique=False,
    )
    op.create_index(
        op.f("ix_leetcode_profiles_user_id"), "leetcode_profiles", ["user_id"], unique=True
    )
    op.create_table(
        "leetcode_submissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("profile_id", sa.Integer(), nullable=False),
        sa.Column("leetcode_submission_id", sa.BigInteger(), nullable=False),
        sa.Column("title_slug", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("language", sa.String(length=50), nullable=False),
        sa.Column("timestamp", sa.BigInteger(), nullable=False),
        sa.Column("runtime", sa.String(length=50), nullable=True),
        sa.Column("memory", sa.String(length=50), nullable=True),
        sa.Column("difficulty", sa.String(length=10), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["profile_id"], ["leetcode_profiles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_leetcode_submissions_id"), "leetcode_submissions", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_leetcode_submissions_leetcode_submission_id"),
        "leetcode_submissions",
        ["leetcode_submission_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_leetcode_submissions_profile_id"),
        "leetcode_submissions",
        ["profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_leetcode_submissions_profile_id"), table_name="leetcode_submissions")
    op.drop_index(
        op.f("ix_leetcode_submissions_leetcode_submission_id"), table_name="leetcode_submissions"
    )
    op.drop_index(op.f("ix_leetcode_submissions_id"), table_name="leetcode_submissions")
    op.drop_table("leetcode_submissions")
    op.drop_index(op.f("ix_leetcode_profiles_user_id"), table_name="leetcode_profiles")
    op.drop_index(op.f("ix_leetcode_profiles_leetcode_username"), table_name="leetcode_profiles")
    op.drop_index(op.f("ix_leetcode_profiles_id"), table_name="leetcode_profiles")
    op.drop_table("leetcode_profiles")
