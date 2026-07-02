"""
Codeforces repository.

Extends BasePlatformRepository for the structurally-shared operations
(get_profile_by_user_id, delete_profile, get_submissions,
get_existing_submission_ids, bulk_create_submissions). Adds
Codeforces-specific methods for profile creation/update and contest
rating history, which have no LeetCode equivalent.
"""

from datetime import datetime

from app.models.codeforces_contest_result import CodeforcesContestResult
from app.models.codeforces_profile import CodeforcesProfile
from app.models.codeforces_submission import CodeforcesSubmission
from app.repositories.base_platform_repository import BasePlatformRepository


class CodeforcesRepository(BasePlatformRepository[CodeforcesProfile, CodeforcesSubmission]):
    profile_model = CodeforcesProfile

    def get_submissions(self, profile_id: int, *, limit: int = 20) -> list[CodeforcesSubmission]:
        return (
            self._db.query(CodeforcesSubmission)
            .filter(CodeforcesSubmission.profile_id == profile_id)
            .order_by(CodeforcesSubmission.creation_time_seconds.desc())
            .limit(limit)
            .all()
        )

    def get_existing_submission_ids(self, profile_id: int) -> set[int]:
        """Used by sync to avoid inserting duplicate rows for submissions already stored."""
        rows = (
            self._db.query(CodeforcesSubmission.codeforces_submission_id)
            .filter(CodeforcesSubmission.profile_id == profile_id)
            .all()
        )
        return {row[0] for row in rows}

    def create_profile(self, *, user_id: int, handle: str) -> CodeforcesProfile:
        profile = CodeforcesProfile(user_id=user_id, handle=handle)
        self._db.add(profile)
        self._db.commit()
        self._db.refresh(profile)
        return profile

    def update_profile_stats(
        self,
        profile: CodeforcesProfile,
        *,
        avatar_url: str | None,
        country: str | None,
        organization: str | None,
        rank: str | None,
        rating: int | None,
        max_rank: str | None,
        max_rating: int | None,
        contribution: int,
        total_solved: int,
        synced_at: datetime,
    ) -> CodeforcesProfile:
        profile.avatar_url = avatar_url
        profile.country = country
        profile.organization = organization
        profile.rank = rank
        profile.rating = rating
        profile.max_rank = max_rank
        profile.max_rating = max_rating
        profile.contribution = contribution
        profile.total_solved = total_solved
        profile.synced_at = synced_at
        self._db.add(profile)
        self._db.commit()
        self._db.refresh(profile)
        return profile

    def get_contest_history(
        self, profile_id: int, *, limit: int = 50
    ) -> list[CodeforcesContestResult]:
        return (
            self._db.query(CodeforcesContestResult)
            .filter(CodeforcesContestResult.profile_id == profile_id)
            .order_by(CodeforcesContestResult.rating_update_time_seconds.desc())
            .limit(limit)
            .all()
        )

    def get_existing_contest_ids(self, profile_id: int) -> set[int]:
        rows = (
            self._db.query(CodeforcesContestResult.contest_id)
            .filter(CodeforcesContestResult.profile_id == profile_id)
            .all()
        )
        return {row[0] for row in rows}

    def bulk_create_contest_results(self, results: list[CodeforcesContestResult]) -> None:
        if not results:
            return
        self._db.add_all(results)
        self._db.commit()
