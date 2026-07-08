"""
Goal model.

One row per goal a user creates (e.g. "solve 500 LeetCode problems",
"reach Codeforces rating 1600"). Unlike LeetCodeProfile/CodeforcesProfile,
a user may have many goals, so there is no unique constraint on
user_id — only an index for the list-by-user query.

Deliberately stores ONLY the target, never the current progress:
progress is always computed live from leetcode_profiles /
leetcode_submissions / codeforces_profiles / codeforces_submissions in
GoalService, the same way AnalyticsService and DashboardService derive
their numbers. Storing a cached "current_value" here would let it
drift from the real synced data.
"""

from datetime import date

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import GoalType
from app.models.mixins import TimestampMixin


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    goal_type: Mapped[GoalType] = mapped_column(
        SAEnum(GoalType, name="goal_type", native_enum=True),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)

    user = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<Goal id={self.id} type={self.goal_type.value} target={self.target_value}>"
