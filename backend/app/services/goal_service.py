"""
Goal service.

Orchestrates GoalRepository (goal CRUD) with LeetCodeRepository /
CodeforcesRepository (read-only) to compute live progress. A Goal row
only ever stores the target — current_value, progress_percentage,
is_achieved, and is_expired are recomputed on every read from
whatever the platform tables currently hold, the same way
AnalyticsService and DashboardService derive their numbers. This means
progress is always in sync with the latest platform sync, with no
separate "recompute" step required — POST /goals/refresh exists as an
explicit trigger for the frontend, but it does the same computation
GET /goals already does on every call.
"""

from datetime import date

from app.core.exceptions import GoalNotFoundError
from app.models.enums import GoalType
from app.models.goal import Goal
from app.repositories.codeforces_repository import CodeforcesRepository
from app.repositories.goal_repository import GoalRepository
from app.repositories.leetcode_repository import LeetCodeRepository
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate
from app.services.dashboard_service import _longest_and_current_streak, _submission_date


class GoalService:
    def __init__(
        self,
        goal_repository: GoalRepository,
        leetcode_repository: LeetCodeRepository,
        codeforces_repository: CodeforcesRepository,
    ) -> None:
        self._goals = goal_repository
        self._lc = leetcode_repository
        self._cf = codeforces_repository

    def create_goal(self, *, user_id: int, data: GoalCreate) -> GoalResponse:
        goal = self._goals.create(
            user_id=user_id,
            goal_type=data.goal_type,
            title=data.title,
            target_value=data.target_value,
            deadline=data.deadline,
        )
        return self._to_response(goal)

    def list_goals(self, *, user_id: int) -> list[GoalResponse]:
        goals = self._goals.list_by_user(user_id)
        return [self._to_response(goal) for goal in goals]

    def get_goal(self, *, user_id: int, goal_id: int) -> GoalResponse:
        goal = self._get_owned_goal(user_id=user_id, goal_id=goal_id)
        return self._to_response(goal)

    def update_goal(self, *, user_id: int, goal_id: int, data: GoalUpdate) -> GoalResponse:
        goal = self._get_owned_goal(user_id=user_id, goal_id=goal_id)
        updated = self._goals.update(
            goal,
            title=data.title,
            target_value=data.target_value,
            deadline=data.deadline,
        )
        return self._to_response(updated)

    def delete_goal(self, *, user_id: int, goal_id: int) -> None:
        goal = self._get_owned_goal(user_id=user_id, goal_id=goal_id)
        self._goals.delete(goal)

    def refresh_progress(self, *, user_id: int) -> list[GoalResponse]:
        """
        Recompute progress for every goal this user has. Since progress
        is never cached, this returns the exact same data as
        list_goals() — it exists as an explicit endpoint so the
        frontend has a "Refresh" action to call after a sync, rather
        than relying on the user knowing progress is always live.
        """
        return self.list_goals(user_id=user_id)

    def _get_owned_goal(self, *, user_id: int, goal_id: int) -> Goal:
        goal = self._goals.get_by_id_for_user(goal_id, user_id)
        if goal is None:
            raise GoalNotFoundError(goal_id)
        return goal

    def _to_response(self, goal: Goal) -> GoalResponse:
        current_value = self._current_value(goal)
        progress_percentage = (
            round(min(current_value / goal.target_value, 1.0) * 100, 1)
            if goal.target_value > 0
            else 0.0
        )
        is_achieved = current_value >= goal.target_value
        is_expired = (
            goal.deadline is not None and goal.deadline < date.today() and not is_achieved
        )
        return GoalResponse.build(
            goal,
            current_value=current_value,
            progress_percentage=progress_percentage,
            is_achieved=is_achieved,
            is_expired=is_expired,
        )

    def _current_value(self, goal: Goal) -> int:
        if goal.goal_type == GoalType.LEETCODE_PROBLEMS:
            lc_profile = self._lc.get_profile_by_user_id(goal.user_id)
            return lc_profile.total_solved if lc_profile else 0

        if goal.goal_type == GoalType.LEETCODE_RATING:
            # LeetCode's public API exposes no contest rating for
            # arbitrary users (see DashboardService.get_platforms,
            # which leaves `rating=None` for LeetCode for the same
            # reason) — there is no real value to report here, so this
            # honestly returns 0 rather than fabricating one.
            return 0

        if goal.goal_type == GoalType.CODEFORCES_PROBLEMS:
            cf_profile = self._cf.get_profile_by_user_id(goal.user_id)
            return cf_profile.total_solved if cf_profile else 0

        if goal.goal_type == GoalType.CODEFORCES_RATING:
            cf_profile = self._cf.get_profile_by_user_id(goal.user_id)
            return cf_profile.rating if cf_profile and cf_profile.rating is not None else 0

        return self._current_streak(goal.user_id)

    def _current_streak(self, user_id: int) -> int:
        # Mirrors DashboardService._merged_activity_dates exactly (same
        # cross-platform, either-platform-counts streak definition) —
        # reused via _submission_date rather than reimplementing the
        # date conversion here.
        dates: list[date] = []

        lc_profile = self._lc.get_profile_by_user_id(user_id)
        if lc_profile:
            for s in self._lc.get_submissions(lc_profile.id, limit=1000):
                dates.append(_submission_date(s.timestamp))

        cf_profile = self._cf.get_profile_by_user_id(user_id)
        if cf_profile:
            for cf_s in self._cf.get_submissions(cf_profile.id, limit=1000):
                dates.append(_submission_date(cf_s.creation_time_seconds))

        current_streak, _longest = _longest_and_current_streak(dates)
        return current_streak
