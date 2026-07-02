"""
Codeforces schemas.

Unlike app/schemas/leetcode.py, there's no pre-existing frontend
contract constraining these shapes — the Codeforces frontend is being
built in this same module. Schemas are designed around Codeforces's
genuinely richer API (real verdicts, ratings, contest history)
rather than mirroring LeetCode's narrower one.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, computed_field


class CodeforcesProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    handle: str
    avatar_url: str | None
    country: str | None
    organization: str | None
    rank: str | None
    rating: int | None
    max_rank: str | None
    max_rating: int | None
    contribution: int
    total_solved: int
    synced_at: datetime | None


class CodeforcesSubmissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    submission_id: int = Field(validation_alias="codeforces_submission_id")
    contest_id: int | None
    problem_index: str
    problem_name: str
    problem_rating: int | None
    programming_language: str
    verdict: str | None
    passed_test_count: int
    time_consumed_millis: int
    memory_consumed_bytes: int
    creation_time_seconds: int


class CodeforcesContestResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    contest_id: int
    contest_name: str
    rank: int
    old_rating: int
    new_rating: int
    rating_update_time_seconds: int

    @computed_field  # type: ignore[prop-decorator]
    @property
    def rating_change(self) -> int:
        return self.new_rating - self.old_rating


class CodeforcesSyncResponse(BaseModel):
    message: str
    synced_at: str
    submissions_saved: int
    contests_saved: int


class CodeforcesConnectRequest(BaseModel):
    handle: str = Field(min_length=1, max_length=100)
