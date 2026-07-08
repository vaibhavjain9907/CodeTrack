"""
Goal endpoints.

All routes require authentication and are scoped to the current user —
GoalService/_get_owned_goal raises GoalNotFoundError (404) for goals
that either don't exist or belong to another user, so ownership never
leaks via a 403. Domain exceptions are translated to HTTP responses by
the global exception handlers — see app/core/exception_handlers.py.
"""

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, get_goal_service
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.schemas.response import APIResponse
from app.services.goal_service import GoalService

router = APIRouter()


@router.post(
    "",
    response_model=APIResponse[GoalResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Create a new goal",
)
def create_goal(
    body: GoalCreate,
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[GoalResponse]:
    goal = goal_service.create_goal(user_id=current_user.id, data=body)
    return APIResponse(message="Goal created successfully.", data=goal)


@router.get(
    "",
    response_model=APIResponse[list[GoalResponse]],
    summary="List all goals for the current user, with live progress",
)
def list_goals(
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[list[GoalResponse]]:
    goals = goal_service.list_goals(user_id=current_user.id)
    return APIResponse(message="Goals retrieved successfully.", data=goals)


@router.post(
    "/refresh",
    response_model=APIResponse[list[GoalResponse]],
    summary="Recompute live progress for all goals",
)
def refresh_goals(
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[list[GoalResponse]]:
    goals = goal_service.refresh_progress(user_id=current_user.id)
    return APIResponse(message="Goal progress refreshed successfully.", data=goals)


@router.get(
    "/{goal_id}",
    response_model=APIResponse[GoalResponse],
    summary="Get a single goal with live progress",
)
def get_goal(
    goal_id: int,
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[GoalResponse]:
    goal = goal_service.get_goal(user_id=current_user.id, goal_id=goal_id)
    return APIResponse(message="Goal retrieved successfully.", data=goal)


@router.put(
    "/{goal_id}",
    response_model=APIResponse[GoalResponse],
    summary="Update a goal's title, target, or deadline",
)
def update_goal(
    goal_id: int,
    body: GoalUpdate,
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[GoalResponse]:
    goal = goal_service.update_goal(user_id=current_user.id, goal_id=goal_id, data=body)
    return APIResponse(message="Goal updated successfully.", data=goal)


@router.delete(
    "/{goal_id}",
    response_model=APIResponse[None],
    summary="Delete a goal",
)
def delete_goal(
    goal_id: int,
    current_user: CurrentUser,
    goal_service: GoalService = Depends(get_goal_service),
) -> APIResponse[None]:
    goal_service.delete_goal(user_id=current_user.id, goal_id=goal_id)
    return APIResponse(message="Goal deleted successfully.", data=None)
