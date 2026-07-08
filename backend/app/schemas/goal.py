"""
Goal schemas.

GoalResponse is never built via `model_validate()` on the ORM instance
alone — like LeetCodeProfileResponse.from_model, it needs data GoalService
computes live (current_value, progress_percentage, is_achieved,
is_expired) that the Goal model itself doesn't store. Always construct
it via `GoalResponse.build()`.
"""

from datetime import date
from typing import TYPE_CHECKING

from pydantic import BaseModel, Field, field_validator

from app.models.enums import GoalType
from app.schemas.validators import validate_deadline_not_past

if TYPE_CHECKING:
    from app.models.goal import Goal


class GoalCreate(BaseModel):
    goal_type: GoalType
    title: str = Field(min_length=1, max_length=255)
    target_value: int = Field(gt=0)
    deadline: date | None = None

    @field_validator("deadline")
    @classmethod
    def _deadline_not_past(cls, value: date | None) -> date | None:
        return validate_deadline_not_past(value)


class GoalUpdate(BaseModel):
    """
    goal_type is intentionally not updatable: it determines which
    metric GoalService.compute_progress reads, and changing it on an
    existing goal would silently repurpose the goal's history.
    Delete and recreate instead.
    """

    title: str = Field(min_length=1, max_length=255)
    target_value: int = Field(gt=0)
    deadline: date | None = None

    @field_validator("deadline")
    @classmethod
    def _deadline_not_past(cls, value: date | None) -> date | None:
        return validate_deadline_not_past(value)


class GoalResponse(BaseModel):
    id: int
    user_id: int
    goal_type: GoalType
    title: str
    target_value: int
    deadline: date | None
    current_value: int
    progress_percentage: float
    is_achieved: bool
    is_expired: bool
    created_at: str
    updated_at: str

    @classmethod
    def build(
        cls,
        goal: "Goal",
        *,
        current_value: int,
        progress_percentage: float,
        is_achieved: bool,
        is_expired: bool,
    ) -> "GoalResponse":
        return cls(
            id=goal.id,
            user_id=goal.user_id,
            goal_type=goal.goal_type,
            title=goal.title,
            target_value=goal.target_value,
            deadline=goal.deadline,
            current_value=current_value,
            progress_percentage=progress_percentage,
            is_achieved=is_achieved,
            is_expired=is_expired,
            created_at=goal.created_at.isoformat(),
            updated_at=goal.updated_at.isoformat(),
        )
