"""
LeetCodeSubmission model.

Stores recent submissions for a connected LeetCode profile, refreshed
on each sync. We keep a bounded, recent window rather than full
history — see app/services/leetcode_service.py's sync logic for the
retention policy.

Field names are deliberately NOT identical to LeetCode's own GraphQL
field names — they match src/types/leetcode.ts's LeetCodeSubmission
interface (Module 4B frontend), since that frontend is already built
and this model exists to satisfy its contract: submission_id (string
from LeetCode, stored as our own surrogate `id` + a separate
`leetcode_submission_id` for dedup), title_slug, title, status,
language, timestamp (unix epoch seconds, as LeetCode returns it —
NOT converted to a DateTime column, so re-serializing matches the
frontend's `number` type exactly), runtime, memory, difficulty.
"""

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class LeetCodeSubmission(Base, TimestampMixin):
    __tablename__ = "leetcode_submissions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    profile_id: Mapped[int] = mapped_column(
        ForeignKey("leetcode_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # LeetCode's own submission id, used to deduplicate on re-sync
    # (a sync should not create duplicate rows for the same submission).
    leetcode_submission_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)

    title_slug: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)

    # Unix epoch seconds, exactly as LeetCode's API returns it — kept as
    # a plain integer rather than DateTime so it round-trips to the
    # frontend's `timestamp: number` field without a conversion layer.
    timestamp: Mapped[int] = mapped_column(BigInteger, nullable=False)

    runtime: Mapped[str | None] = mapped_column(String(50), nullable=True)
    memory: Mapped[str | None] = mapped_column(String(50), nullable=True)
    difficulty: Mapped[str | None] = mapped_column(String(10), nullable=True)

    profile = relationship("LeetCodeProfile", back_populates="submissions")

    def __repr__(self) -> str:
        return f"<LeetCodeSubmission id={self.id} title={self.title!r}>"
