"""
Goal repository.

Pure data-access layer for the goals table. No progress computation,
no target-metric knowledge — that's GoalService's job (see
app/services/goal_service.py).
"""

from datetime import date

from sqlalchemy.orm import Session

from app.models.enums import GoalType
from app.models.goal import Goal


class GoalRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        user_id: int,
        goal_type: GoalType,
        title: str,
        target_value: int,
        deadline: date | None,
    ) -> Goal:
        goal = Goal(
            user_id=user_id,
            goal_type=goal_type,
            title=title,
            target_value=target_value,
            deadline=deadline,
        )
        self._db.add(goal)
        self._db.commit()
        self._db.refresh(goal)
        return goal

    def get_by_id_for_user(self, goal_id: int, user_id: int) -> Goal | None:
        return (
            self._db.query(Goal)
            .filter(Goal.id == goal_id, Goal.user_id == user_id)
            .first()
        )

    def list_by_user(self, user_id: int) -> list[Goal]:
        return (
            self._db.query(Goal)
            .filter(Goal.user_id == user_id)
            .order_by(Goal.created_at.desc())
            .all()
        )

    def update(
        self,
        goal: Goal,
        *,
        title: str,
        target_value: int,
        deadline: date | None,
    ) -> Goal:
        goal.title = title
        goal.target_value = target_value
        goal.deadline = deadline
        self._db.add(goal)
        self._db.commit()
        self._db.refresh(goal)
        return goal

    def delete(self, goal: Goal) -> None:
        self._db.delete(goal)
        self._db.commit()
