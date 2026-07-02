"""
LeetCode endpoints.

All routes require authentication (a LeetCode connection belongs to a
specific CodeTrack user). Domain exceptions raised by LeetCodeService
(LeetCodeAlreadyConnectedError, LeetCodeUsernameInvalidError, etc.)
are translated to HTTP responses by the global exception handlers —
see app/core/exception_handlers.py.
"""

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, get_leetcode_service
from app.schemas.leetcode import (
    LeetCodeConnectRequest,
    LeetCodeProfileResponse,
    LeetCodeSubmissionResponse,
    LeetCodeSyncResponse,
)
from app.schemas.response import APIResponse
from app.services.leetcode_service import LeetCodeService

router = APIRouter()


@router.post(
    "/connect",
    response_model=APIResponse[LeetCodeProfileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Connect a LeetCode account by username",
)
async def connect(
    body: LeetCodeConnectRequest,
    current_user: CurrentUser,
    leetcode_service: LeetCodeService = Depends(get_leetcode_service),
) -> APIResponse[LeetCodeProfileResponse]:
    profile = await leetcode_service.connect(user_id=current_user.id, username=body.username)
    return APIResponse(
        message="LeetCode account connected successfully.",
        data=LeetCodeProfileResponse.from_model(profile),
    )


@router.post(
    "/sync",
    response_model=APIResponse[LeetCodeSyncResponse],
    summary="Re-sync stats and recent submissions from LeetCode",
)
async def sync(
    current_user: CurrentUser,
    leetcode_service: LeetCodeService = Depends(get_leetcode_service),
) -> APIResponse[LeetCodeSyncResponse]:
    result = await leetcode_service.sync(user_id=current_user.id)
    return APIResponse(message=result.message, data=result)


@router.get(
    "/profile",
    response_model=APIResponse[LeetCodeProfileResponse],
    summary="Get the connected LeetCode profile and cached statistics",
)
def get_profile(
    current_user: CurrentUser,
    leetcode_service: LeetCodeService = Depends(get_leetcode_service),
) -> APIResponse[LeetCodeProfileResponse]:
    profile = leetcode_service.get_profile(user_id=current_user.id)
    return APIResponse(
        message="LeetCode profile retrieved successfully.",
        data=LeetCodeProfileResponse.from_model(profile),
    )


@router.get(
    "/submissions",
    response_model=APIResponse[list[LeetCodeSubmissionResponse]],
    summary="Get recent submissions for the connected LeetCode profile",
)
def get_submissions(
    current_user: CurrentUser,
    leetcode_service: LeetCodeService = Depends(get_leetcode_service),
    limit: int = Query(default=20, ge=1, le=100),
) -> APIResponse[list[LeetCodeSubmissionResponse]]:
    submissions = leetcode_service.get_submissions(user_id=current_user.id, limit=limit)
    return APIResponse(
        message="Recent submissions retrieved successfully.",
        data=[LeetCodeSubmissionResponse.model_validate(s) for s in submissions],
    )
