"""
LeetCode service.

Orchestrates LeetCodeClient (external API calls) and LeetCodeRepository
(persistence) for the connect/sync/profile/submissions flows. This is
the only layer that should know the sequence of steps involved.
"""

from datetime import UTC, datetime

from app.core.exceptions import (
    LeetCodeAlreadyConnectedError,
    LeetCodeProfileNotConnectedError,
    LeetCodeSyncFailedError,
    LeetCodeUsernameInvalidError,
)
from app.integrations.leetcode_client import (
    LeetCodeAPIError,
    LeetCodeClient,
    LeetCodeUserNotFoundError,
)
from app.models.leetcode_profile import LeetCodeProfile
from app.models.leetcode_submission import LeetCodeSubmission
from app.repositories.leetcode_repository import LeetCodeRepository
from app.schemas.leetcode import LeetCodeSyncResponse


def _counts_by_difficulty(ac_submission_num: list[dict[str, object]]) -> dict[str, int]:
    """Reshape LeetCode's [{difficulty, count}, ...] list into a dict keyed by difficulty."""
    result: dict[str, int] = {}
    for row in ac_submission_num:
        difficulty = row["difficulty"]
        count = row["count"]
        if not isinstance(difficulty, str) or not isinstance(count, int | str):
            continue
        result[difficulty] = int(count)
    return result


def _as_int(value: object) -> int:
    """Safely coerce untyped external API data to int, at the one boundary that needs to."""
    if not isinstance(value, int | str):
        raise ValueError(f"Expected an int-convertible value, got {type(value).__name__}.")
    return int(value)


def _as_str(value: object) -> str:
    if value is None:
        raise ValueError("Expected a string value, got None.")
    return str(value)


class LeetCodeService:
    def __init__(
        self, repository: LeetCodeRepository, client: LeetCodeClient | None = None
    ) -> None:
        self._repository = repository
        self._client = client or LeetCodeClient()

    async def connect(self, *, user_id: int, username: str) -> LeetCodeProfile:
        """
        Link a LeetCode username to the current user, validating it
        exists on LeetCode, then performing an initial sync so the
        profile has real data immediately rather than showing zeros
        until the next manual sync.
        """
        existing = self._repository.get_profile_by_user_id(user_id)
        if existing is not None:
            raise LeetCodeAlreadyConnectedError()

        try:
            await self._client.fetch_profile(username)
        except LeetCodeUserNotFoundError as exc:
            raise LeetCodeUsernameInvalidError(username) from exc
        except LeetCodeAPIError as exc:
            raise LeetCodeSyncFailedError(str(exc)) from exc

        profile = self._repository.create_profile(user_id=user_id, leetcode_username=username)
        await self._sync_profile(profile)
        return profile

    async def sync(self, *, user_id: int) -> LeetCodeSyncResponse:
        """Re-fetch stats and recent submissions for the connected profile."""
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise LeetCodeProfileNotConnectedError()

        submissions_saved = await self._sync_profile(profile)
        synced_at = profile.synced_at or datetime.now(UTC)
        return LeetCodeSyncResponse(
            message="LeetCode data synced successfully.",
            synced_at=synced_at.isoformat(),
            submissions_saved=submissions_saved,
        )

    def get_profile(self, *, user_id: int) -> LeetCodeProfile:
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise LeetCodeProfileNotConnectedError()
        return profile

    def get_submissions(self, *, user_id: int, limit: int = 20) -> list[LeetCodeSubmission]:
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise LeetCodeProfileNotConnectedError()
        return self._repository.get_submissions(profile.id, limit=limit)

    def disconnect(self, *, user_id: int) -> None:
        """
        Remove the LeetCode connection for this user.

        Cascades to leetcode_submissions via the FK's ON DELETE CASCADE,
        so no separate submission cleanup is needed. Idempotent: if no
        profile is connected, raises LeetCodeProfileNotConnectedError so
        the caller can return a clear 404 rather than a silent 200.
        """
        profile = self._repository.get_profile_by_user_id(user_id)
        if profile is None:
            raise LeetCodeProfileNotConnectedError()
        self._repository.delete_profile(profile)

    async def _sync_profile(self, profile: LeetCodeProfile) -> int:
        """
        Shared sync logic for connect() and sync(). Returns the number
        of NEW submissions saved (existing ones are skipped via
        get_existing_submission_ids, so re-syncing is idempotent).
        """
        try:
            profile_data = await self._client.fetch_profile(profile.leetcode_username)
            recent_submissions = await self._client.fetch_recent_submissions(
                profile.leetcode_username, limit=20
            )
        except (LeetCodeUserNotFoundError, LeetCodeAPIError) as exc:
            raise LeetCodeSyncFailedError(str(exc)) from exc

        matched_user_raw = profile_data["matchedUser"]
        if not isinstance(matched_user_raw, dict):
            raise LeetCodeSyncFailedError("Unexpected response shape from LeetCode (matchedUser).")
        matched_user: dict[str, object] = matched_user_raw

        submit_stats = matched_user.get("submitStats")
        all_questions = profile_data.get("allQuestionsCount")
        if not isinstance(submit_stats, dict) or not isinstance(all_questions, list):
            raise LeetCodeSyncFailedError("Unexpected response shape from LeetCode (stats).")

        ac_counts = _counts_by_difficulty(submit_stats["acSubmissionNum"])
        total_counts = _counts_by_difficulty(all_questions)

        user_profile_raw = matched_user.get("profile") or {}
        contributions_raw = matched_user.get("contributions") or {}
        user_profile: dict[str, object] = (
            user_profile_raw if isinstance(user_profile_raw, dict) else {}
        )
        contributions: dict[str, object] = (
            contributions_raw if isinstance(contributions_raw, dict) else {}
        )

        ranking_raw = user_profile.get("ranking")
        points_raw = contributions.get("points", 0)

        self._repository.update_profile_stats(
            profile,
            display_name=(str(user_profile["realName"]) if user_profile.get("realName") else None),
            avatar_url=(
                str(user_profile["userAvatar"]) if user_profile.get("userAvatar") else None
            ),
            ranking=_as_int(ranking_raw) if ranking_raw is not None else None,
            total_solved=ac_counts.get("All", 0),
            total_questions=total_counts.get("All", 0),
            easy_solved=ac_counts.get("Easy", 0),
            easy_total=total_counts.get("Easy", 0),
            medium_solved=ac_counts.get("Medium", 0),
            medium_total=total_counts.get("Medium", 0),
            hard_solved=ac_counts.get("Hard", 0),
            hard_total=total_counts.get("Hard", 0),
            contribution_points=_as_int(points_raw),
            synced_at=datetime.now(UTC),
        )

        existing_ids = self._repository.get_existing_submission_ids(profile.id)
        new_submissions = []
        for item in recent_submissions:
            submission_id = _as_int(item["id"])
            if submission_id in existing_ids:
                continue
            new_submissions.append(
                LeetCodeSubmission(
                    profile_id=profile.id,
                    leetcode_submission_id=submission_id,
                    title_slug=_as_str(item["titleSlug"]),
                    title=_as_str(item["title"]),
                    status=_as_str(item["statusDisplay"]),
                    language=_as_str(item["lang"]),
                    timestamp=_as_int(item["timestamp"]),
                    runtime=None,
                    memory=None,
                    difficulty=None,
                )
            )
        self._repository.bulk_create_submissions(new_submissions)
        return len(new_submissions)
