"""
CodeforcesContestResult model.

Stores per-contest rating changes from Codeforces's user.rating
endpoint. This has no LeetCode equivalent — LeetCode's public API
exposes no contest/rating history for arbitrary users — so this
table exists purely because Codeforces's API genuinely supports it,
satisfying the "Contest history" frontend requirement honestly rather
than faking it.
"""

from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class CodeforcesContestResult(Base, TimestampMixin):
    __tablename__ = "codeforces_contest_results"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("codeforces_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    contest_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    contest_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    old_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    new_rating: Mapped[int] = mapped_column(Integer, nullable=False)
    rating_update_time_seconds: Mapped[int] = mapped_column(BigInteger, nullable=False)

    profile = relationship("CodeforcesProfile", back_populates="rating_history")

    def __repr__(self) -> str:
        return f"<CodeforcesContestResult id={self.id} contest={self.contest_name!r}>"
