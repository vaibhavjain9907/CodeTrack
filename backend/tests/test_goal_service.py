"""
Tests for GoalService and the Goal schemas' validation rules.

Repositories are mocked (MagicMock), matching the style of
test_analytics_service.py — these exercise the pure progress-computation
logic (per goal type), ownership scoping, and request validation, not
persistence.
"""

from datetime import UTC, date, datetime, timedelta
from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

from app.core.exceptions import GoalNotFoundError
from app.models.enums import GoalType
from app.schemas.goal import GoalCreate, GoalUpdate
from app.services.goal_service import GoalService


def _ts(d: date) -> int:
    return int(datetime(d.year, d.month, d.day, 12, tzinfo=UTC).timestamp())


def _make_goal(
    *,
    id: int = 1,
    user_id: int = 1,
    goal_type: GoalType = GoalType.LEETCODE_PROBLEMS,
    target_value: int = 100,
    deadline: date | None = None,
) -> MagicMock:
    goal = MagicMock(
        id=id,
        user_id=user_id,
        goal_type=goal_type,
        title="Test goal",
        target_value=target_value,
        deadline=deadline,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    return goal


def _make_service(
    goal_repo=None,
    lc_profile=None,
    cf_profile=None,
    lc_submissions=None,
    cf_submissions=None,
):
    goal_repo = goal_repo or MagicMock()
    lc_repo = MagicMock()
    cf_repo = MagicMock()
    lc_repo.get_profile_by_user_id.return_value = lc_profile
    cf_repo.get_profile_by_user_id.return_value = cf_profile
    lc_repo.get_submissions.return_value = lc_submissions or []
    cf_repo.get_submissions.return_value = cf_submissions or []
    return GoalService(goal_repo, lc_repo, cf_repo), goal_repo, lc_repo, cf_repo


# --- Schema validation ---


def test_goal_create_rejects_non_positive_target():
    with pytest.raises(ValidationError):
        GoalCreate(goal_type=GoalType.LEETCODE_PROBLEMS, title="x", target_value=0)


def test_goal_create_rejects_past_deadline():
    with pytest.raises(ValidationError):
        GoalCreate(
            goal_type=GoalType.LEETCODE_PROBLEMS,
            title="x",
            target_value=10,
            deadline=date.today() - timedelta(days=1),
        )


def test_goal_update_rejects_past_deadline():
    with pytest.raises(ValidationError):
        GoalUpdate(title="x", target_value=10, deadline=date.today() - timedelta(days=1))


def test_goal_create_accepts_future_deadline():
    goal = GoalCreate(
        goal_type=GoalType.CODEFORCES_RATING,
        title="Reach 1600",
        target_value=1600,
        deadline=date.today() + timedelta(days=30),
    )
    assert goal.target_value == 1600


# --- CRUD / ownership ---


def test_create_goal_delegates_to_repository():
    goal_repo = MagicMock()
    goal_repo.create.return_value = _make_goal(target_value=50)
    service, goal_repo, _, _ = _make_service(goal_repo=goal_repo)

    data = GoalCreate(goal_type=GoalType.LEETCODE_PROBLEMS, title="Solve 50", target_value=50)
    result = service.create_goal(user_id=1, data=data)

    goal_repo.create.assert_called_once_with(
        user_id=1, goal_type=GoalType.LEETCODE_PROBLEMS, title="Solve 50", target_value=50,
        deadline=None,
    )
    assert result.target_value == 50


def test_get_goal_raises_not_found_when_missing_or_not_owned():
    goal_repo = MagicMock()
    goal_repo.get_by_id_for_user.return_value = None
    service, _, _, _ = _make_service(goal_repo=goal_repo)

    with pytest.raises(GoalNotFoundError):
        service.get_goal(user_id=1, goal_id=999)


def test_update_goal_updates_mutable_fields():
    goal = _make_goal()
    goal_repo = MagicMock()
    goal_repo.get_by_id_for_user.return_value = goal
    goal_repo.update.return_value = _make_goal(target_value=200)
    service, _, _, _ = _make_service(goal_repo=goal_repo)

    update = GoalUpdate(title="New title", target_value=200, deadline=None)
    result = service.update_goal(user_id=1, goal_id=1, data=update)

    goal_repo.update.assert_called_once_with(
        goal, title="New title", target_value=200, deadline=None
    )
    assert result.target_value == 200


def test_delete_goal_raises_not_found_for_other_users_goal():
    goal_repo = MagicMock()
    goal_repo.get_by_id_for_user.return_value = None
    service, _, _, _ = _make_service(goal_repo=goal_repo)

    with pytest.raises(GoalNotFoundError):
        service.delete_goal(user_id=1, goal_id=1)


def test_delete_goal_deletes_owned_goal():
    goal = _make_goal()
    goal_repo = MagicMock()
    goal_repo.get_by_id_for_user.return_value = goal
    service, _, _, _ = _make_service(goal_repo=goal_repo)

    service.delete_goal(user_id=1, goal_id=1)

    goal_repo.delete.assert_called_once_with(goal)


# --- Progress computation ---


def test_leetcode_problems_progress_unconnected_is_zero():
    goal = _make_goal(goal_type=GoalType.LEETCODE_PROBLEMS, target_value=100)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    service, _, _, _ = _make_service(goal_repo=goal_repo)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 0
    assert result.progress_percentage == 0.0
    assert result.is_achieved is False


def test_leetcode_problems_progress_connected():
    goal = _make_goal(goal_type=GoalType.LEETCODE_PROBLEMS, target_value=100)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=50)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 50
    assert result.progress_percentage == 50.0
    assert result.is_achieved is False


def test_progress_caps_at_100_percent_when_exceeding_target():
    goal = _make_goal(goal_type=GoalType.LEETCODE_PROBLEMS, target_value=50)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=200)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 200
    assert result.progress_percentage == 100.0
    assert result.is_achieved is True


def test_codeforces_problems_progress():
    goal = _make_goal(goal_type=GoalType.CODEFORCES_PROBLEMS, target_value=30)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    cf_profile = MagicMock(total_solved=30, rating=None)
    service, _, _, _ = _make_service(goal_repo=goal_repo, cf_profile=cf_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 30
    assert result.is_achieved is True


def test_codeforces_rating_progress_with_unrated_profile_is_zero():
    goal = _make_goal(goal_type=GoalType.CODEFORCES_RATING, target_value=1600)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    cf_profile = MagicMock(total_solved=0, rating=None)
    service, _, _, _ = _make_service(goal_repo=goal_repo, cf_profile=cf_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 0


def test_codeforces_rating_progress_rated():
    goal = _make_goal(goal_type=GoalType.CODEFORCES_RATING, target_value=1600)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    cf_profile = MagicMock(total_solved=0, rating=1450)
    service, _, _, _ = _make_service(goal_repo=goal_repo, cf_profile=cf_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 1450
    assert result.progress_percentage == round(1450 / 1600 * 100, 1)


def test_leetcode_rating_is_always_zero_honest_limitation():
    goal = _make_goal(goal_type=GoalType.LEETCODE_RATING, target_value=2000)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=999)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 0
    assert result.is_achieved is False


def test_daily_streak_progress_merges_both_platforms():
    goal = _make_goal(goal_type=GoalType.DAILY_STREAK, target_value=3)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]

    today = date.today()
    lc_profile = MagicMock(id=1)
    cf_profile = MagicMock(id=1)
    lc_submissions = [MagicMock(timestamp=_ts(today))]
    cf_submissions = [
        MagicMock(creation_time_seconds=_ts(today - timedelta(days=1))),
        MagicMock(creation_time_seconds=_ts(today - timedelta(days=2))),
    ]

    service, _, _, _ = _make_service(
        goal_repo=goal_repo,
        lc_profile=lc_profile,
        cf_profile=cf_profile,
        lc_submissions=lc_submissions,
        cf_submissions=cf_submissions,
    )

    result = service.list_goals(user_id=1)[0]
    assert result.current_value == 3
    assert result.is_achieved is True


def test_is_expired_true_only_when_deadline_passed_and_not_achieved():
    past_deadline = date.today() - timedelta(days=1)
    goal = _make_goal(
        goal_type=GoalType.LEETCODE_PROBLEMS, target_value=100, deadline=past_deadline
    )
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=10)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.is_expired is True


def test_is_expired_false_when_achieved_even_past_deadline():
    past_deadline = date.today() - timedelta(days=1)
    goal = _make_goal(
        goal_type=GoalType.LEETCODE_PROBLEMS, target_value=100, deadline=past_deadline
    )
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=150)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    result = service.list_goals(user_id=1)[0]
    assert result.is_expired is False
    assert result.is_achieved is True


def test_refresh_progress_matches_list_goals():
    goal = _make_goal(goal_type=GoalType.LEETCODE_PROBLEMS, target_value=100)
    goal_repo = MagicMock()
    goal_repo.list_by_user.return_value = [goal]
    lc_profile = MagicMock(total_solved=10)
    service, _, _, _ = _make_service(goal_repo=goal_repo, lc_profile=lc_profile)

    listed = service.list_goals(user_id=1)
    refreshed = service.refresh_progress(user_id=1)
    assert [g.model_dump() for g in listed] == [g.model_dump() for g in refreshed]
