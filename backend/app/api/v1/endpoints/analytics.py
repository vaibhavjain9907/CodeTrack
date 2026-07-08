"""
Analytics endpoints.

All routes require authentication. Data is computed entirely from the
existing platform tables — no external API calls are made here.
Returns zeros/empty lists honestly for unconnected platforms.
"""

from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, get_analytics_service
from app.schemas.analytics import AnalyticsOverview, CodeforcesAnalytics, LeetCodeAnalytics
from app.schemas.response import APIResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()


@router.get(
    "/overview",
    response_model=APIResponse[AnalyticsOverview],
    summary="Combined totals, streaks, and 12-week activity across both platforms",
)
def get_overview(
    current_user: CurrentUser,
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[AnalyticsOverview]:
    data = analytics_service.get_overview(user_id=current_user.id)
    return APIResponse(message="Analytics overview retrieved successfully.", data=data)


@router.get(
    "/leetcode",
    response_model=APIResponse[LeetCodeAnalytics],
    summary="LeetCode difficulty breakdown, acceptance rate, and ranking",
)
def get_leetcode_analytics(
    current_user: CurrentUser,
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[LeetCodeAnalytics]:
    data = analytics_service.get_leetcode_analytics(user_id=current_user.id)
    return APIResponse(message="LeetCode analytics retrieved successfully.", data=data)


@router.get(
    "/codeforces",
    response_model=APIResponse[CodeforcesAnalytics],
    summary="Codeforces rating progression, verdict breakdown, and problem rating distribution",
)
def get_codeforces_analytics(
    current_user: CurrentUser,
    analytics_service: AnalyticsService = Depends(get_analytics_service),
) -> APIResponse[CodeforcesAnalytics]:
    data = analytics_service.get_codeforces_analytics(user_id=current_user.id)
    return APIResponse(message="Codeforces analytics retrieved successfully.", data=data)
