"""
Codeforces service.

Orchestrates CodeforcesClient (external API calls) and
CodeforcesRepository (persistence). Structurally mirrors
LeetCodeService's connect/sync/profile/submissions shape (same
guard-then-act pattern), but is NOT a shared base class with it — see
app/services/platform_parsing.py's docstring for why the orchestration
itself stays per-platform while only the int/str coercion is shared.

Codeforces-specific: also syncs contest rating history, which has no
LeetCode equivalent, and computes total_solved by counting distinct
problems with an OK verdict (Codeforces has no single "solved count"
field the way LeetCode's submitStatsGlobal does).
"""

from datetime import UTC, datetime

from app.core.exceptions import (
    CodeforcesAlreadyConnectedError,
    CodeforcesHandleInvalidError,
    CodeforcesProfileNotConnectedError,
    CodeforcesSyncFailedError,
)
from app.integrations.codeforces_client import (
    CodeforcesAPIError,
    CodeforcesClient,
    CodeforcesHandleNotFoundError,
)
from app.models.codeforces_contest_result import CodeforcesContestResult
from app.models.codeforces_profile import CodeforcesProfile
from app.models.codeforces_submission import CodeforcesSubmission
from app.repositories.codeforces_repository import CodeforcesRepository
from app.schemas.codeforces import CodeforcesSyncResponse
from app.services.platform_parsing import as_int, as_optional_int, as_optional_str, as_str

_SUBMISSIONS_FETCH_COUNT = 50


class CodeforcesService:
    def __init__(
        self, repository: CodeforcesRepository, client: CodeforcesClient | None = None
    ) -> None:
        self._repository = repository
        self._client = client or CodeforcesClient()

    async def connect(self, *, user_id: int, handle: str) -> CodeforcesProfile:
        """
        Link a Codeforces handle to the current user, validating it
        exists, then performing an initial sync so the profile has
        real data immediately rather than showing zeros until the
        next manual sync.
        """
        existing = self._repository.get_profile_by_user_id(user_id)
        if existing is not None:
            raise CodeforcesAlreadyConnectedError()

        try:
            await self._client.fetch_user_info(handle)
        except CodeforcesHandleNotFoundError as exc:
            raise CodeforcesHandleInvalidError(handle) from exc
        except CodeforcesAPIError as exc:
            raise CodeforcesSyncFailedError(str(exc)) from exc

        profile = self._repository.create_profile(user_id=user_id, handle=handle)
        await self._sync_profile(profile)
        return profile

    async def sync(self, *, user_id: int) -> CodeforcesSyncResponse:
        """Re-fetch profile stats, recent submissions, and contest history."""
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise CodeforcesProfileNotConnectedError()

        submissions_saved, contests_saved = await self._sync_profile(profile)
        synced_at = profile.synced_at or datetime.now(UTC)
        return CodeforcesSyncResponse(
            message="Codeforces data synced successfully.",
            synced_at=synced_at.isoformat(),
            submissions_saved=submissions_saved,
            contests_saved=contests_saved,
        )

    def get_profile(self, *, user_id: int) -> CodeforcesProfile:
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise CodeforcesProfileNotConnectedError()
        return profile

    def get_submissions(self, *, user_id: int, limit: int = 20) -> list[CodeforcesSubmission]:
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise CodeforcesProfileNotConnectedError()
        return self._repository.get_submissions(profile.id, limit=limit)

    def get_contest_history(
        self, *, user_id: int, limit: int = 50
    ) -> list[CodeforcesContestResult]:
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise CodeforcesProfileNotConnectedError()
        return self._repository.get_contest_history(profile.id, limit=limit)

    def disconnect(self, *, user_id: int) -> None:
        """
        Remove the Codeforces connection for this user.

        Cascades to codeforces_submissions and codeforces_contest_results
        via ON DELETE CASCADE — no separate child-row cleanup needed.
        Raises CodeforcesProfileNotConnectedError if nothing is connected.
        """
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise CodeforcesProfileNotConnectedError()
        self._repository.delete_profile(profile)

    async def _sync_profile(self, profile: CodeforcesProfile) -> tuple[int, int]:
        """
        Shared sync logic for connect() and sync(). Returns
        (submissions_saved, contests_saved) — both counts of NEW rows
        only, since dedup against existing ids makes re-syncing
        idempotent.
        """
        try:
            user_info = await self._client.fetch_user_info(profile.handle)
            submissions = await self._client.fetch_submissions(
                profile.handle, count=_SUBMISSIONS_FETCH_COUNT
            )
            rating_history = await self._client.fetch_rating_history(profile.handle)
        except (CodeforcesHandleNotFoundError, CodeforcesAPIError) as exc:
            raise CodeforcesSyncFailedError(str(exc)) from exc

        total_solved = self._count_distinct_solved(submissions)

        self._repository.update_profile_stats(
            profile,
            avatar_url=as_optional_str(user_info.get("avatar")),
            country=as_optional_str(user_info.get("country")),
            organization=as_optional_str(user_info.get("organization")),
            rank=as_optional_str(user_info.get("rank")),
            rating=as_optional_int(user_info.get("rating")),
            max_rank=as_optional_str(user_info.get("maxRank")),
            max_rating=as_optional_int(user_info.get("maxRating")),
            contribution=as_int(user_info.get("contribution", 0)),
            total_solved=total_solved,
            synced_at=datetime.now(UTC),
        )

        submissions_saved = self._save_new_submissions(profile, submissions)
        contests_saved = self._save_new_contest_results(profile, rating_history)
        return submissions_saved, contests_saved

    @staticmethod
    def _count_distinct_solved(submissions: list[dict[str, object]]) -> int:
        solved: set[tuple[object, object]] = set()
        for item in submissions:
            problem = item.get("problem")
            if isinstance(problem, dict) and item.get("verdict") == "OK":
                solved.add((problem.get("contestId"), problem.get("index")))
        return len(solved)

    def _save_new_submissions(
        self, profile: CodeforcesProfile, submissions: list[dict[str, object]]
    ) -> int:
        existing_ids = self._repository.get_existing_submission_ids(profile.id)
        new_rows = []
        for item in submissions:
            submission_id = as_int(item["id"])
            if submission_id in existing_ids:
                continue

            problem = item.get("problem")
            if not isinstance(problem, dict):
                continue

            new_rows.append(
                CodeforcesSubmission(
                    profile_id=profile.id,
                    codeforces_submission_id=submission_id,
                    contest_id=as_optional_int(item.get("contestId")),
                    problem_index=as_str(problem.get("index")),
                    problem_name=as_str(problem.get("name")),
                    problem_rating=as_optional_int(problem.get("rating")),
                    programming_language=as_str(item.get("programmingLanguage")),
                    verdict=as_optional_str(item.get("verdict")),
                    passed_test_count=as_int(item.get("passedTestCount", 0)),
                    time_consumed_millis=as_int(item.get("timeConsumedMillis", 0)),
                    memory_consumed_bytes=as_int(item.get("memoryConsumedBytes", 0)),
                    creation_time_seconds=as_int(item["creationTimeSeconds"]),
                )
            )
        self._repository.bulk_create_submissions(new_rows)
        return len(new_rows)

    def _save_new_contest_results(
        self, profile: CodeforcesProfile, rating_history: list[dict[str, object]]
    ) -> int:
        existing_ids = self._repository.get_existing_contest_ids(profile.id)
        new_rows = []
        for item in rating_history:
            contest_id = as_int(item["contestId"])
            if contest_id in existing_ids:
                continue
            new_rows.append(
                CodeforcesContestResult(
                    profile_id=profile.id,
                    contest_id=contest_id,
                    contest_name=as_str(item.get("contestName")),
                    rank=as_int(item.get("rank", 0)),
                    old_rating=as_int(item.get("oldRating", 0)),
                    new_rating=as_int(item.get("newRating", 0)),
                    rating_update_time_seconds=as_int(item["ratingUpdateTimeSeconds"]),
                )
            )
        self._repository.bulk_create_contest_results(new_rows)
        return len(new_rows)
