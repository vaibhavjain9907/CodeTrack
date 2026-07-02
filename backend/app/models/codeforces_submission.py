"""
CodeforcesSubmission model.

Unlike LeetCode's public API (accepted submissions only, no
runtime/memory), Codeforces's user.status genuinely returns every
submission with a real verdict (WRONG_ANSWER, TIME_LIMIT_EXCEEDED,
etc.), problem rating, and resource usage — so this model captures
that real data rather than mirroring LeetCode's narrower shape.
"""

from sqlalchemy import BigInteger, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class CodeforcesSubmission(Base, TimestampMixin):
    __tablename__ = "codeforces_submissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("codeforces_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    codeforces_submission_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)

    contest_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    problem_index: Mapped[str] = mapped_column(String(10), nullable=False)
    problem_name: Mapped[str] = mapped_column(String(255), nullable=False)
    problem_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)

    programming_language: Mapped[str] = mapped_column(String(50), nullable=False)
    verdict: Mapped[str | None] = mapped_column(String(40), nullable=True)
    passed_test_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    time_consumed_millis: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    memory_consumed_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    creation_time_seconds: Mapped[int] = mapped_column(BigInteger, nullable=False)

    profile = relationship("CodeforcesProfile", back_populates="submissions")

    def __repr__(self) -> str:
        return f"<CodeforcesSubmission id={self.id} problem={self.problem_name!r}>"
