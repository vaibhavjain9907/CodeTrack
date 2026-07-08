"""
User role enum.

Defined once here and reused by both the SQLAlchemy model
(app/models/user.py) and Pydantic schemas (app/schemas/user.py)
so the set of valid roles can never drift between the DB layer
and the API layer.
"""

from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class GoalType(str, Enum):
    """
    Kinds of goals a user can track. Each maps to a metric computed
    live from existing platform tables in GoalService — see
    app/services/goal_service.py for how current_value is derived per
    type. No goal type stores its own progress; that would violate
    the single-source-of-truth the platform sync tables already are.
    """

    LEETCODE_PROBLEMS = "leetcode_problems"
    LEETCODE_RATING = "leetcode_rating"
    CODEFORCES_PROBLEMS = "codeforces_problems"
    CODEFORCES_RATING = "codeforces_rating"
    DAILY_STREAK = "daily_streak"
