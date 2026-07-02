"""
LeetCode schemas.

These shapes are deliberately fixed by an already-built frontend
(src/types/leetcode.ts, Module 4B) — this file is the backend half of
a contract the frontend committed to before this backend existed.
Field names and nesting (statistics as a nested object, not flat
fields) must match exactly.
"""

from typing import TYPE_CHECKING

from pydantic import BaseModel, ConfigDict, Field

if TYPE_CHECKING:
    from app.models.leetcode_profile import LeetCodeProfile


class LeetCodeStatistics(BaseModel):
    total_solved: int
    total_questions: int
    easy_solved: int
    easy_total: int
    medium_solved: int
    medium_total: int
    hard_solved: int
    hard_total: int
    acceptance_rate: float | None
    contribution_points: int
    streak: int


class LeetCodeProfileResponse(BaseModel):
    """
    Note: from_attributes alone cannot populate `statistics`, since the
    ORM model (app/models/leetcode_profile.py) stores those fields
    flat, not as a nested object. Always construct this via
    `from_model()`, not `model_validate()` directly on the ORM instance.
    """

    id: int
    user_id: int
    leetcode_username: str
    display_name: str | None
    avatar_url: str | None
    ranking: int | None
    synced_at: str | None
    statistics: LeetCodeStatistics | None

    @classmethod
    def from_model(cls, profile: "LeetCodeProfile") -> "LeetCodeProfileResponse":
        statistics = (
            LeetCodeStatistics(
                total_solved=profile.total_solved,
                total_questions=profile.total_questions,
                easy_solved=profile.easy_solved,
                easy_total=profile.easy_total,
                medium_solved=profile.medium_solved,
                medium_total=profile.medium_total,
                hard_solved=profile.hard_solved,
                hard_total=profile.hard_total,
                acceptance_rate=profile.acceptance_rate,
                contribution_points=profile.contribution_points,
                streak=profile.streak,
            )
            if profile.synced_at is not None
            else None
        )
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            leetcode_username=profile.leetcode_username,
            display_name=profile.display_name,
            avatar_url=profile.avatar_url,
            ranking=profile.ranking,
            synced_at=profile.synced_at.isoformat() if profile.synced_at else None,
            statistics=statistics,
        )


class LeetCodeSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    submission_id: int = Field(validation_alias="leetcode_submission_id")
    title_slug: str
    title: str
    status: str
    language: str
    timestamp: int
    runtime: str | None
    memory: str | None
    difficulty: str | None


class LeetCodeSyncResponse(BaseModel):
    message: str
    synced_at: str
    submissions_saved: int


class LeetCodeConnectRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
