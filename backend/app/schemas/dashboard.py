"""
Dashboard schemas.

These describe the response bodies for GET /dashboard/*. Field shapes
are designed around what they will mean once LeetCode/Codeforces
integrations exist (future modules) — but today, with no platform
data connected yet, every endpoint returns honest zero/empty values
rather than fabricated numbers. See app/services/dashboard_service.py
for exactly what is and isn't computed yet.
"""

from datetime import date

from pydantic import BaseModel


class PlatformSummary(BaseModel):
    """Per-platform solved counts and connection status."""

    platform: str
    connected: bool
    total_solved: int
    rating: int | None = None
    last_synced_at: str | None = None


class DashboardSummary(BaseModel):
    """Top-level aggregate stats shown on the dashboard overview cards."""

    total_problems_solved: int
    current_streak_days: int
    longest_streak_days: int
    active_platform_count: int
    connected_platform_count: int


class HeatmapDay(BaseModel):
    """One day's submission count, for the GitHub-style calendar heatmap."""

    date: date
    count: int


class HeatmapResponse(BaseModel):
    """Daily activity for the past `days` days."""

    days: list[HeatmapDay]
    total_submissions: int


class PlatformsResponse(BaseModel):
    """Per-platform comparison, one entry per supported platform."""

    platforms: list[PlatformSummary]
