"""
Analytics schemas.

All analytics data is computed from the existing platform tables
(leetcode_profiles, leetcode_submissions, codeforces_profiles,
codeforces_submissions, codeforces_contest_results) — no new tables
are required.
"""

from pydantic import BaseModel


class WeeklyActivity(BaseModel):
    """Submission counts per ISO week, merged across both platforms."""

    week_start: str
    leetcode_count: int
    codeforces_count: int
    total_count: int


class LeetCodeDifficultyBreakdown(BaseModel):
    easy_solved: int
    medium_solved: int
    hard_solved: int
    easy_total: int
    medium_total: int
    hard_total: int
    easy_percentage: float
    medium_percentage: float
    hard_percentage: float


class LeetCodeAnalytics(BaseModel):
    connected: bool
    difficulty_breakdown: LeetCodeDifficultyBreakdown | None
    acceptance_rate: float | None
    total_solved: int
    ranking: int | None


class VerdictCount(BaseModel):
    verdict: str
    count: int
    percentage: float


class RatingPoint(BaseModel):
    """Single data point for the rating progression line chart."""

    contest_name: str
    rating: int
    timestamp: int


class ProblemRatingBucket(BaseModel):
    """Count of accepted problems in a rating range bucket."""

    rating_range: str
    count: int


class CodeforcesAnalytics(BaseModel):
    connected: bool
    current_rating: int | None
    max_rating: int | None
    rank: str | None
    total_solved: int
    total_submissions: int
    verdict_breakdown: list[VerdictCount]
    rating_progression: list[RatingPoint]
    problem_rating_distribution: list[ProblemRatingBucket]


class AnalyticsOverview(BaseModel):
    total_solved_all_platforms: int
    leetcode_solved: int
    codeforces_solved: int
    current_streak_days: int
    longest_streak_days: int
    weekly_activity: list[WeeklyActivity]
