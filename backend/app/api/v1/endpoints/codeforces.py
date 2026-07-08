"""
Codeforces endpoints.

All routes require authentication. Domain exceptions raised by
CodeforcesService are translated to HTTP responses by the global
exception handlers — see app/core/exception_handlers.py.
"""

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, get_codeforces_service
from app.schemas.codeforces import (
    CodeforcesConnectRequest,
    CodeforcesContestResultResponse,
    CodeforcesProfileResponse,
    CodeforcesSubmissionResponse,
    CodeforcesSyncResponse,
)
from app.schemas.response import APIResponse
from app.services.codeforces_service import CodeforcesService

router = APIRouter()


@router.post(
    "/connect",
    response_model=APIResponse[CodeforcesProfileResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Connect a Codeforces account by handle",
)
async def connect(
    body: CodeforcesConnectRequest,
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
) -> APIResponse[CodeforcesProfileResponse]:
    profile = await codeforces_service.connect(user_id=current_user.id, handle=body.handle)
    return APIResponse(
        message="Codeforces account connected successfully.",
        data=CodeforcesProfileResponse.model_validate(profile),
    )


@router.post(
    "/sync",
    response_model=APIResponse[CodeforcesSyncResponse],
    summary="Re-sync stats, recent submissions, and contest history from Codeforces",
)
async def sync(
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
) -> APIResponse[CodeforcesSyncResponse]:
    result = await codeforces_service.sync(user_id=current_user.id)
    return APIResponse(message=result.message, data=result)


@router.get(
    "/profile",
    response_model=APIResponse[CodeforcesProfileResponse],
    summary="Get the connected Codeforces profile and cached statistics",
)
def get_profile(
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
) -> APIResponse[CodeforcesProfileResponse]:
    profile = codeforces_service.get_profile(user_id=current_user.id)
    return APIResponse(
        message="Codeforces profile retrieved successfully.",
        data=CodeforcesProfileResponse.model_validate(profile),
    )


@router.delete(
    "/profile",
    response_model=APIResponse[None],
    summary="Disconnect the linked Codeforces account",
)
def disconnect(
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
) -> APIResponse[None]:
    codeforces_service.disconnect(user_id=current_user.id)
    return APIResponse(message="Codeforces account disconnected successfully.", data=None)


@router.get(
    "/submissions",
    response_model=APIResponse[list[CodeforcesSubmissionResponse]],
    summary="Get recent submissions for the connected Codeforces profile",
)
def get_submissions(
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
    limit: int = Query(default=20, ge=1, le=100),
) -> APIResponse[list[CodeforcesSubmissionResponse]]:
    submissions = codeforces_service.get_submissions(user_id=current_user.id, limit=limit)
    return APIResponse(
        message="Recent submissions retrieved successfully.",
        data=[CodeforcesSubmissionResponse.model_validate(s) for s in submissions],
    )


@router.get(
    "/contests",
    response_model=APIResponse[list[CodeforcesContestResultResponse]],
    summary="Get contest rating history for the connected Codeforces profile",
)
def get_contest_history(
    current_user: CurrentUser,
    codeforces_service: CodeforcesService = Depends(get_codeforces_service),
    limit: int = Query(default=50, ge=1, le=200),
) -> APIResponse[list[CodeforcesContestResultResponse]]:
    results = codeforces_service.get_contest_history(user_id=current_user.id, limit=limit)
    return APIResponse(
        message="Contest history retrieved successfully.",
        data=[CodeforcesContestResultResponse.model_validate(r) for r in results],
    )
