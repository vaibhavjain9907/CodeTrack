"""
Tests for AnalyticsService.

Repositories are mocked (MagicMock) rather than hitting a real
database — these tests exercise the pure computation logic (weekly
bucketing, rating buckets, verdict breakdown, streaks), not
persistence, matching the style of test_leetcode_client.py /
test_codeforces_client.py in this suite.
"""

from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock

from app.services.analytics_service import AnalyticsService, _build_rating_bucket, _week_start


def _ts(d: date) -> int:
    return int(datetime(d.year, d.month, d.day, 12, tzinfo=UTC).timestamp())


def _make_service(lc_profile=None, cf_profile=None, lc_submissions=None, cf_submissions=None):
    lc_repo = MagicMock()
    cf_repo = MagicMock()
    lc_repo.get_profile_by_user_id.return_value = lc_profile
    cf_repo.get_profile_by_user_id.return_value = cf_profile
    lc_repo.get_submissions.return_value = lc_submissions or []
    cf_repo.get_submissions.return_value = cf_submissions or []
    return AnalyticsService(lc_repo, cf_repo)


def test_week_start_returns_monday():
    wednesday = date(2026, 7, 8)
    assert _week_start(wednesday) == date(2026, 7, 6)
    monday = date(2026, 7, 6)
    assert _week_start(monday) == monday


def test_build_rating_bucket():
    assert _build_rating_bucket(1050) == "1000-1199"
    assert _build_rating_bucket(999) == "800-999"
    assert _build_rating_bucket(0) == "0-199"


def test_overview_with_no_connected_platforms_is_all_zero():
    service = _make_service()
    result = service.get_overview(user_id=1)

    assert result.total_solved_all_platforms == 0
    assert result.leetcode_solved == 0
    assert result.codeforces_solved == 0
    assert result.current_streak_days == 0
    assert result.longest_streak_days == 0
    assert len(result.weekly_activity) == 12
    assert all(w.total_count == 0 for w in result.weekly_activity)


def test_overview_merges_totals_and_activity_across_platforms():
    lc_profile = MagicMock(id=1, total_solved=50)
    cf_profile = MagicMock(id=1, total_solved=30)
    today = date.today()

    lc_submissions = [MagicMock(timestamp=_ts(today))]
    cf_submissions = [MagicMock(creation_time_seconds=_ts(today))]

    service = _make_service(lc_profile, cf_profile, lc_submissions, cf_submissions)
    result = service.get_overview(user_id=1)

    assert result.total_solved_all_platforms == 80
    assert result.leetcode_solved == 50
    assert result.codeforces_solved == 30
    assert result.current_streak_days == 1

    this_week = result.weekly_activity[-1]
    assert this_week.leetcode_count == 1
    assert this_week.codeforces_count == 1
    assert this_week.total_count == 2


def test_weekly_activity_drops_submissions_outside_window():
    lc_profile = MagicMock(id=1, total_solved=1)
    old_date = date.today() - timedelta(days=365)
    lc_submissions = [MagicMock(timestamp=_ts(old_date))]

    service = _make_service(lc_profile=lc_profile, lc_submissions=lc_submissions)
    result = service.get_overview(user_id=1)

    assert all(w.leetcode_count == 0 for w in result.weekly_activity)


def test_leetcode_analytics_unconnected():
    service = _make_service()
    result = service.get_leetcode_analytics(user_id=1)

    assert result.connected is False
    assert result.difficulty_breakdown is None
    assert result.total_solved == 0


def test_leetcode_analytics_connected_computes_percentages():
    profile = MagicMock(
        synced_at=datetime.now(UTC),
        easy_solved=10,
        medium_solved=5,
        hard_solved=0,
        easy_total=20,
        medium_total=20,
        hard_total=20,
        acceptance_rate=75.5,
        total_solved=15,
        ranking=1000,
    )
    service = _make_service(lc_profile=profile)
    result = service.get_leetcode_analytics(user_id=1)

    assert result.connected is True
    assert result.difficulty_breakdown.easy_percentage == 50.0
    assert result.difficulty_breakdown.hard_percentage == 0.0
    assert result.total_solved == 15


def test_codeforces_analytics_unconnected():
    service = _make_service()
    result = service.get_codeforces_analytics(user_id=1)

    assert result.connected is False
    assert result.verdict_breakdown == []
    assert result.rating_progression == []
    assert result.problem_rating_distribution == []


def test_codeforces_analytics_verdict_breakdown_and_rating_distribution():
    profile = MagicMock(id=1, rating=1500, max_rating=1600, rank="expert", total_solved=2)
    submissions = [
        MagicMock(
            verdict="OK", contest_id=1, problem_index="A", problem_rating=1000, problem_name="a"
        ),
        MagicMock(
            verdict="OK", contest_id=1, problem_index="A", problem_rating=1000, problem_name="a"
        ),  # duplicate solve of same problem, must not double count in distribution
        MagicMock(
            verdict="OK", contest_id=1, problem_index="B", problem_rating=1200, problem_name="b"
        ),
        MagicMock(
            verdict="OK", contest_id=1, problem_index="C", problem_rating=900, problem_name="c"
        ),
        MagicMock(
            verdict="WRONG_ANSWER",
            contest_id=1,
            problem_index="E",
            problem_rating=900,
            problem_name="e",
        ),
        MagicMock(
            verdict="SOME_UNKNOWN_VERDICT",
            contest_id=1,
            problem_index="D",
            problem_rating=900,
            problem_name="d",
        ),
    ]
    cf_repo = MagicMock()
    cf_repo.get_profile_by_user_id.return_value = profile
    cf_repo.get_submissions.return_value = submissions
    cf_repo.get_contest_history.return_value = []
    lc_repo = MagicMock()
    lc_repo.get_profile_by_user_id.return_value = None

    service = AnalyticsService(lc_repo, cf_repo)
    result = service.get_codeforces_analytics(user_id=1)

    assert result.total_submissions == 6
    verdicts = {v.verdict: v.count for v in result.verdict_breakdown}
    assert verdicts["OK"] == 4
    assert verdicts["WRONG_ANSWER"] == 1
    assert verdicts["OTHER"] == 1

    buckets = {b.rating_range: b.count for b in result.problem_rating_distribution}
    assert buckets["800-999"] == 1
    assert buckets["1000-1199"] == 1
    assert buckets["1200-1399"] == 1
