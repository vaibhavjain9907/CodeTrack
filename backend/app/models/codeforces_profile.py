"""
CodeforcesProfile model.

One row per user who has connected a Codeforces handle. Unlike
LeetCode's public API (which exposes no contest/rating history for
arbitrary users), Codeforces's API genuinely returns rating, rank,
and full contest history — so this model is intentionally richer than
LeetCodeProfile, not forced into the same shape. See
app/services/codeforces_service.py for the sync flow.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class CodeforcesProfile(Base, TimestampMixin):
    __tablename__ = "codeforces_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )

    handle: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    organization: Mapped[str | None] = mapped_column(String(255), nullable=True)

    rank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_rank: Mapped[str | None] = mapped_column(String(50), nullable=True)
    max_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    contribution: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    total_solved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user = relationship("User", lazy="joined")
    submissions = relationship(
        "CodeforcesSubmission",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="desc(CodeforcesSubmission.creation_time_seconds)",
    )
    rating_history = relationship(
        "CodeforcesContestResult",
        back_populates="profile",
        cascade="all, delete-orphan",
        order_by="desc(CodeforcesContestResult.rating_update_time_seconds)",
    )

    def __repr__(self) -> str:
        return f"<CodeforcesProfile id={self.id} handle={self.handle!r}>"
