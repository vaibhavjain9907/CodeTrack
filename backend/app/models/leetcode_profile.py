"""
LeetCodeProfile model.

One row per user who has connected a LeetCode account. Statistics are
cached here (rather than computed on every request) because they come
from LeetCode's GraphQL API, which we should call only on an explicit
sync, not on every dashboard page load — see app/services/leetcode_service.py
for the sync flow this model supports.

Field names deliberately match what the already-built frontend
(src/types/leetcode.ts, from Module 4B) expects in its API responses:
leetcode_username, display_name, avatar_url, ranking, synced_at, and
the nested statistics fields. This model is the backend half of a
contract the frontend already commits to.
"""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class LeetCodeProfile(Base, TimestampMixin):
    __tablename__ = "leetcode_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    leetcode_username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ranking: Mapped[int | None] = mapped_column(Integer, nullable=True)

    total_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_questions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    easy_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    easy_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medium_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hard_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    hard_total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    acceptance_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    contribution_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    streak: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", lazy="joined")
    submissions = relationship(
        "LeetCodeSubmission",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="desc(LeetCodeSubmission.timestamp)",
    )

    def __repr__(self) -> str:
        return f"<LeetCodeProfile id={self.id} username={self.leetcode_username!r}>"
