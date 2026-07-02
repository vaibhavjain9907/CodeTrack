"""
LeetCode repository.

Pure data-access layer for leetcode_profiles and leetcode_submissions.
No GraphQL calls, no business logic — that's LeetCodeService's job
(app/services/leetcode_service.py).
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.leetcode_profile import LeetCodeProfile
from app.models.leetcode_submission import LeetCodeSubmission


class LeetCodeRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_profile_by_user_id(self, user_id: int) -> LeetCodeProfile | None:
        return self._db.query(LeetCodeProfile).filter(LeetCodeProfile.user_id == user_id).first()

    def create_profile(self, *, user_id: int, leetcode_username: str) -> LeetCodeProfile:
        profile = LeetCodeProfile(user_id=user_id, leetcode_username=leetcode_username)
        self._db.add(profile)
        self._db.commit()
        self._db.refresh(profile)
        return profile

    def update_profile_stats(
        self,
        profile: LeetCodeProfile,
        *,
        display_name: str | None,
        avatar_url: str | None,
        ranking: int | None,
        total_solved: int,
        total_questions: int,
        easy_solved: int,
        easy_total: int,
        medium_solved: int,
        medium_total: int,
        hard_solved: int,
        hard_total: int,
        contribution_points: int,
        synced_at: datetime,
    ) -> LeetCodeProfile:
        profile.display_name = display_name
        profile.avatar_url = avatar_url
        profile.ranking = ranking
        profile.total_solved = total_solved
        profile.total_questions = total_questions
        profile.easy_solved = easy_solved
        profile.easy_total = easy_total
        profile.medium_solved = medium_solved
        profile.medium_total = medium_total
        profile.hard_solved = hard_solved
        profile.hard_total = hard_total
        profile.contribution_points = contribution_points
        profile.synced_at = synced_at
        self._db.add(profile)
        self._db.commit()
        self._db.refresh(profile)
        return profile

    def delete_profile(self, profile: LeetCodeProfile) -> None:
        self._db.delete(profile)
        self._db.commit()

    def get_submissions(self, profile_id: int, *, limit: int = 20) -> list[LeetCodeSubmission]:
        return (
            self._db.query(LeetCodeSubmission)
            .filter(LeetCodeSubmission.profile_id == profile_id)
            .order_by(LeetCodeSubmission.timestamp.desc())
            .limit(limit)
            .all()
        )

    def get_existing_submission_ids(self, profile_id: int) -> set[int]:
        """Used by sync to avoid inserting duplicate rows for submissions already stored."""
        rows = (
            self._db.query(LeetCodeSubmission.leetcode_submission_id)
            .filter(LeetCodeSubmission.profile_id == profile_id)
            .all()
        )
        return {row[0] for row in rows}

    def bulk_create_submissions(self, submissions: list[LeetCodeSubmission]) -> None:
        if not submissions:
            return
        self._db.add_all(submissions)
        self._db.commit()
