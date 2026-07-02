"""
Shared SQLAlchemy mixins.

Mixins here are composed into models via multiple inheritance, e.g.:

    class User(Base, TimestampMixin):
        ...

Keeping these separate from `models/user.py` avoids every future model
(LeetCodeProfile, Goal, Contest, etc.) re-declaring the same two columns.
"""

from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column


def _utcnow() -> datetime:
    """Timezone-aware UTC now, used as the default/onupdate callable.

    Using a plain function (rather than `datetime.utcnow`) ensures the
    stored value is tz-aware, which avoids subtle bugs when comparing
    against other tz-aware datetimes (e.g. JWT `exp` claims in Module 3).
    """
    return datetime.now(UTC)


class TimestampMixin:
    """Adds `created_at` and `updated_at` columns to a model.

    - `created_at` is set once, at insert time.
    - `updated_at` is set at insert time and refreshed on every update
      by the database driver via SQLAlchemy's `onupdate` callable.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=_utcnow,
        onupdate=_utcnow,
        nullable=False,
    )
