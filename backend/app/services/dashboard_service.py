"""
Dashboard service.

Aggregates real data from both LeetCode and Codeforces where a
profile is connected for either. Every number here is either a real
aggregation over the platform-specific tables, or an honest zero for
a platform/user that genuinely has none — never a fabricated value.

API contract preserved: get_summary/get_heatmap/get_platforms keep
the exact signatures the dashboard endpoints already call (see
app/api/v1/endpoints/dashboard.py) — only the constructor gained a
second repository dependency, which endpoints don't see directly
(it's wired through get_dashboard_service in app/api/deps.py).
"""

from datetime import date, datetime, timedelta

from app.models.codeforces_profile import CodeforcesProfile
from app.models.leetcode_profile import LeetCodeProfile
from app.repositories.codeforces_repository import CodeforcesRepository
from app.repositories.leetcode_repository import LeetCodeRepository
from app.schemas.dashboard import (
    DashboardSummary,
    HeatmapDay,
    HeatmapResponse,
    PlatformsResponse,
    PlatformSummary,
)

_SUPPORTED_PLATFORMS = ["leetcode", "codeforces"]


def _submission_date(unix_timestamp: int) -> date:
    return datetime.fromtimestamp(unix_timestamp, tz=None).date()


def _longest_and_current_streak(dates: list[date]) -> tuple[int, int]:
    """
    Shared streak math over a list of distinct activity dates (used
    for both single-platform and merged-across-platforms streaks).
    Returns (current_streak_days, longest_streak_days).
    """
    if not dates:
        return 0, 0

    sorted_dates = sorted(set(dates))

    longest = current_run = 1
    for i in range(1, len(sorted_dates)):
        if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
            current_run += 1
        else:
            current_run = 1
        longest = max(longest, current_run)

    today = date.today()
    most_recent = sorted_dates[-1]
    if most_recent not in (today, today - timedelta(days=1)):
        current_streak = 0
    else:
        current_streak = 1
        for i in range(len(sorted_dates) - 1, 0, -1):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                current_streak += 1
            else:
                break

    return current_streak, longest


class DashboardService:
    def __init__(
        self,
        leetcode_repository: LeetCodeRepository,
        codeforces_repository: CodeforcesRepository,
    ) -> None:
        self._leetcode_repository = leetcode_repository
        self._codeforces_repository = codeforces_repository

    def get_summary(self, *, user_id: int) -> DashboardSummary:
        """Aggregate top-line stats across both platforms for this user."""
        leetcode_profile = self._leetcode_repository.get_profile_by_user_id(user_id)
        codeforces_profile = self._codeforces_repository.get_profile_by_user_id(user_id)

        leetcode_solved = leetcode_profile.total_solved if leetcode_profile else 0
        codeforces_solved = codeforces_profile.total_solved if codeforces_profile else 0

        connected_count = sum(1 for p in (leetcode_profile, codeforces_profile) if p is not None)

        activity_dates = self._merged_activity_dates(leetcode_profile, codeforces_profile)
        current_streak, longest_streak = _longest_and_current_streak(activity_dates)

        return DashboardSummary(
            total_problems_solved=leetcode_solved + codeforces_solved,
            current_streak_days=current_streak,
            longest_streak_days=longest_streak,
            active_platform_count=len(_SUPPORTED_PLATFORMS),
            connected_platform_count=connected_count,
        )

    def get_heatmap(self, *, user_id: int, days: int = 365) -> HeatmapResponse:
        """
        Daily submission counts for the past `days` days, merged
        across both platforms. Days with no submissions on either
        platform are explicit count=0 entries (not omitted), so the
        frontend always gets a contiguous, correctly-shaped calendar.
        """
        today = date.today()
        window_start = today - timedelta(days=days - 1)

        counts_by_date: dict[date, int] = {}

        leetcode_profile = self._leetcode_repository.get_profile_by_user_id(user_id)
        if leetcode_profile is not None:
            # Submissions table is a bounded recent window (see
            # LeetCodeService._sync_profile), not full history — the
            # heatmap is therefore only as complete as the most recent
            # sync's window, which is an honest limitation, not a bug.
            for submission in self._leetcode_repository.get_submissions(
                leetcode_profile.id, limit=1000
            ):
                submission_date = _submission_date(submission.timestamp)
                if submission_date >= window_start:
                    counts_by_date[submission_date] = counts_by_date.get(submission_date, 0) + 1

        codeforces_profile = self._codeforces_repository.get_profile_by_user_id(user_id)
        if codeforces_profile is not None:
            for cf_submission in self._codeforces_repository.get_submissions(
                codeforces_profile.id, limit=1000
            ):
                submission_date = _submission_date(cf_submission.creation_time_seconds)
                if submission_date >= window_start:
                    counts_by_date[submission_date] = counts_by_date.get(submission_date, 0) + 1

        heatmap_days = []
        for offset in range(days):
            day = window_start + timedelta(days=offset)
            heatmap_days.append(HeatmapDay(date=day, count=counts_by_date.get(day, 0)))
        total_submissions = sum(counts_by_date.values())
        return HeatmapResponse(days=heatmap_days, total_submissions=total_submissions)

    def get_platforms(self, *, user_id: int) -> PlatformsResponse:
        """Per-platform comparison for this user."""
        leetcode_profile = self._leetcode_repository.get_profile_by_user_id(user_id)
        codeforces_profile = self._codeforces_repository.get_profile_by_user_id(user_id)

        platforms = [
            PlatformSummary(
                platform="leetcode",
                connected=leetcode_profile is not None,
                total_solved=leetcode_profile.total_solved if leetcode_profile else 0,
                rating=None,  # LeetCode "rating" applies to contests, not tracked yet
                last_synced_at=(
                    leetcode_profile.synced_at.isoformat()
                    if leetcode_profile and leetcode_profile.synced_at
                    else None
                ),
            ),
            PlatformSummary(
                platform="codeforces",
                connected=codeforces_profile is not None,
                total_solved=codeforces_profile.total_solved if codeforces_profile else 0,
                rating=codeforces_profile.rating if codeforces_profile else None,
                last_synced_at=(
                    codeforces_profile.synced_at.isoformat()
                    if codeforces_profile and codeforces_profile.synced_at
                    else None
                ),
            ),
        ]
        return PlatformsResponse(platforms=platforms)

    def _merged_activity_dates(
        self,
        leetcode_profile: LeetCodeProfile | None,
        codeforces_profile: CodeforcesProfile | None,
    ) -> list[date]:
        """
        Collects distinct activity dates across both platforms for
        streak computation. A day counts toward the streak if the
        user submitted on EITHER platform — a cross-platform streak,
        not two separate per-platform streaks, since the dashboard
        summary is a single unified metric.
        """
        dates: list[date] = []
        if leetcode_profile is not None:
            for submission in self._leetcode_repository.get_submissions(
                leetcode_profile.id, limit=1000
            ):
                dates.append(_submission_date(submission.timestamp))
        if codeforces_profile is not None:
            for cf_submission in self._codeforces_repository.get_submissions(
                codeforces_profile.id, limit=1000
            ):
                dates.append(_submission_date(cf_submission.creation_time_seconds))
        return dates
