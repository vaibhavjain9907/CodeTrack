"""
Dashboard endpoints.

All three routes require authentication and now query real per-user
data (see app/services/dashboard_service.py for what is and isn't
real yet — LeetCode is live, Codeforces remains zero-state).
"""

from fastapi import APIRouter, Depends, Query

from app.api.deps import CurrentUser, get_dashboard_service
from app.schemas.dashboard import DashboardSummary, HeatmapResponse, PlatformsResponse
from app.schemas.response import APIResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()


@router.get(
    "/summary",
    response_model=APIResponse[DashboardSummary],
    summary="Get aggregate stats across all connected platforms",
)
def get_summary(
    current_user: CurrentUser,
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> APIResponse[DashboardSummary]:
    summary = dashboard_service.get_summary(user_id=current_user.id)
    return APIResponse(message="Dashboard summary retrieved successfully.", data=summary)


@router.get(
    "/heatmap",
    response_model=APIResponse[HeatmapResponse],
    summary="Get daily submission counts for the activity heatmap",
)
def get_heatmap(
    current_user: CurrentUser,
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    days: int = Query(default=365, ge=1, le=365, description="Number of days to include."),
) -> APIResponse[HeatmapResponse]:
    heatmap = dashboard_service.get_heatmap(user_id=current_user.id, days=days)
    return APIResponse(message="Heatmap data retrieved successfully.", data=heatmap)


@router.get(
    "/platforms",
    response_model=APIResponse[PlatformsResponse],
    summary="Get per-platform solved counts, ratings, and sync status",
)
def get_platforms(
    current_user: CurrentUser,
    dashboard_service: DashboardService = Depends(get_dashboard_service),
) -> APIResponse[PlatformsResponse]:
    platforms = dashboard_service.get_platforms(user_id=current_user.id)
    return APIResponse(message="Platform comparison retrieved successfully.", data=platforms)
