"""
Analytics service.

Computes all analytics data entirely from the existing platform tables.
No external API calls — analytics are derived from data already synced.
"""

from collections import Counter, defaultdict
from datetime import UTC, date, datetime, timedelta

from app.repositories.codeforces_repository import CodeforcesRepository
from app.repositories.leetcode_repository import LeetCodeRepository
from app.schemas.analytics import (
    AnalyticsOverview,
    CodeforcesAnalytics,
    LeetCodeAnalytics,
    LeetCodeDifficultyBreakdown,
    ProblemRatingBucket,
    RatingPoint,
    VerdictCount,
    WeeklyActivity,
)
from app.services.dashboard_service import _longest_and_current_streak

_RATING_BUCKET_SIZE = 200


def _submission_date(unix_ts: int) -> date:
    return datetime.fromtimestamp(unix_ts, tz=UTC).date()


def _week_start(d: date) -> date:
    """Return the Monday of the ISO week containing d."""
    return d - timedelta(days=d.weekday())


def _build_rating_bucket(rating: int) -> str:
    low = (rating // _RATING_BUCKET_SIZE) * _RATING_BUCKET_SIZE
    high = low + _RATING_BUCKET_SIZE - 1
    return f"{low}-{high}"


class AnalyticsService:
    def __init__(
        self,
        leetcode_repository: LeetCodeRepository,
        codeforces_repository: CodeforcesRepository,
    ) -> None:
        self._lc = leetcode_repository
        self._cf = codeforces_repository

    def get_overview(self, *, user_id: int) -> AnalyticsOverview:
        lc_profile = self._lc.get_profile_by_user_id(user_id)
        cf_profile = self._cf.get_profile_by_user_id(user_id)

        lc_solved = lc_profile.total_solved if lc_profile else 0
        cf_solved = cf_profile.total_solved if cf_profile else 0

        activity_dates: list[date] = []
        if lc_profile:
            for s in self._lc.get_submissions(lc_profile.id, limit=1000):
                activity_dates.append(_submission_date(s.timestamp))
        if cf_profile:
            for cf_s in self._cf.get_submissions(cf_profile.id, limit=1000):
                activity_dates.append(_submission_date(cf_s.creation_time_seconds))

        current_streak, longest_streak = _longest_and_current_streak(activity_dates)
        weekly_activity = self._build_weekly_activity(user_id, weeks=12)

        return AnalyticsOverview(
            total_solved_all_platforms=lc_solved + cf_solved,
            leetcode_solved=lc_solved,
            codeforces_solved=cf_solved,
            current_streak_days=current_streak,
            longest_streak_days=longest_streak,
            weekly_activity=weekly_activity,
        )

    def _build_weekly_activity(self, user_id: int, *, weeks: int = 12) -> list[WeeklyActivity]:
        # Anchor on the current week and count back (weeks - 1) full
        # weeks, rather than on today - weeks*7 days: the latter's
        # week-aligned start can land up to 6 days short of the
        # current week, silently dropping this week's activity.
        current_week = _week_start(date.today())
        first_week = current_week - timedelta(weeks=weeks - 1)

        lc_by_week: dict[date, int] = defaultdict(int)
        cf_by_week: dict[date, int] = defaultdict(int)

        lc_profile = self._lc.get_profile_by_user_id(user_id)
        if lc_profile:
            for s in self._lc.get_submissions(lc_profile.id, limit=1000):
                d = _submission_date(s.timestamp)
                if d >= first_week:
                    lc_by_week[_week_start(d)] += 1

        cf_profile = self._cf.get_profile_by_user_id(user_id)
        if cf_profile:
            for cf_s in self._cf.get_submissions(cf_profile.id, limit=1000):
                d = _submission_date(cf_s.creation_time_seconds)
                if d >= first_week:
                    cf_by_week[_week_start(d)] += 1

        result: list[WeeklyActivity] = []
        for i in range(weeks):
            week = first_week + timedelta(weeks=i)
            lc = lc_by_week.get(week, 0)
            cf = cf_by_week.get(week, 0)
            result.append(
                WeeklyActivity(
                    week_start=week.isoformat(),
                    leetcode_count=lc,
                    codeforces_count=cf,
                    total_count=lc + cf,
                )
            )
        return result

    def get_leetcode_analytics(self, *, user_id: int) -> LeetCodeAnalytics:
        profile = self._lc.get_profile_by_user_id(user_id)

        if profile is None or profile.synced_at is None:
            return LeetCodeAnalytics(
                connected=profile is not None,
                difficulty_breakdown=None,
                acceptance_rate=None,
                total_solved=0,
                ranking=None,
            )

        def pct(solved: int, total: int) -> float:
            return round((solved / total * 100) if total > 0 else 0.0, 1)

        breakdown = LeetCodeDifficultyBreakdown(
            easy_solved=profile.easy_solved,
            medium_solved=profile.medium_solved,
            hard_solved=profile.hard_solved,
            easy_total=profile.easy_total,
            medium_total=profile.medium_total,
            hard_total=profile.hard_total,
            easy_percentage=pct(profile.easy_solved, profile.easy_total),
            medium_percentage=pct(profile.medium_solved, profile.medium_total),
            hard_percentage=pct(profile.hard_solved, profile.hard_total),
        )

        return LeetCodeAnalytics(
            connected=True,
            difficulty_breakdown=breakdown,
            acceptance_rate=profile.acceptance_rate,
            total_solved=profile.total_solved,
            ranking=profile.ranking,
        )

    def get_codeforces_analytics(self, *, user_id: int) -> CodeforcesAnalytics:
        profile = self._cf.get_profile_by_user_id(user_id)

        if profile is None:
            return CodeforcesAnalytics(
                connected=False,
                current_rating=None,
                max_rating=None,
                rank=None,
                total_solved=0,
                total_submissions=0,
                verdict_breakdown=[],
                rating_progression=[],
                problem_rating_distribution=[],
            )

        submissions = self._cf.get_submissions(profile.id, limit=1000)
        total_submissions = len(submissions)

        return CodeforcesAnalytics(
            connected=True,
            current_rating=profile.rating,
            max_rating=profile.max_rating,
            rank=profile.rank,
            total_solved=profile.total_solved,
            total_submissions=total_submissions,
            verdict_breakdown=self._compute_verdict_breakdown(submissions),
            rating_progression=self._compute_rating_progression(profile.id),
            problem_rating_distribution=self._compute_problem_rating_distribution(submissions),
        )

    def _compute_verdict_breakdown(self, submissions: list) -> list[VerdictCount]:
        _KNOWN = {
            "OK",
            "WRONG_ANSWER",
            "TIME_LIMIT_EXCEEDED",
            "MEMORY_LIMIT_EXCEEDED",
            "RUNTIME_ERROR",
            "COMPILATION_ERROR",
        }
        counts: Counter[str] = Counter()
        for s in submissions:
            verdict = s.verdict or "UNKNOWN"
            if verdict not in _KNOWN:
                verdict = "OTHER"
            counts[verdict] += 1

        total = sum(counts.values())
        return [
            VerdictCount(
                verdict=verdict,
                count=count,
                percentage=round(count / total * 100, 1) if total > 0 else 0.0,
            )
            for verdict, count in counts.most_common()
        ]

    def _compute_rating_progression(self, profile_id: int) -> list[RatingPoint]:
        history = self._cf.get_contest_history(profile_id, limit=200)
        return [
            RatingPoint(
                contest_name=r.contest_name,
                rating=r.new_rating,
                timestamp=r.rating_update_time_seconds,
            )
            for r in reversed(history)
        ]

    def _compute_problem_rating_distribution(self, submissions: list) -> list[ProblemRatingBucket]:
        solved_problems: dict[tuple[int | None, str], int | None] = {}
        for s in submissions:
            if s.verdict != "OK" or s.problem_rating is None:
                continue
            key = (s.contest_id, s.problem_index)
            if key not in solved_problems:
                solved_problems[key] = s.problem_rating

        bucket_counts: Counter[str] = Counter()
        for rating in solved_problems.values():
            if rating is not None:
                bucket_counts[_build_rating_bucket(rating)] += 1

        if not bucket_counts:
            return []

        return [
            ProblemRatingBucket(rating_range=bucket, count=count)
            for bucket, count in sorted(
                bucket_counts.items(), key=lambda x: int(x[0].split("-")[0])
            )
        ]
