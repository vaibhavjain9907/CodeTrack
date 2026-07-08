"""
Imports all ORM models so that `Base.metadata` is fully populated
before Alembic's autogenerate (or `Base.metadata.create_all`) runs.

Every new model module created in future tasks (e.g. user.py,
leetcode_profile.py, goal.py) MUST be imported here, or Alembic
will not detect it when generating migrations.
"""

from app.db.session import Base  # noqa: F401
from app.models.codeforces_contest_result import CodeforcesContestResult  # noqa: F401
from app.models.codeforces_profile import CodeforcesProfile  # noqa: F401
from app.models.codeforces_submission import CodeforcesSubmission  # noqa: F401
from app.models.goal import Goal  # noqa: F401
from app.models.leetcode_profile import LeetCodeProfile  # noqa: F401
from app.models.leetcode_submission import LeetCodeSubmission  # noqa: F401
from app.models.refresh_token import RefreshToken  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = [
    "Base",
    "User",
    "RefreshToken",
    "LeetCodeProfile",
    "LeetCodeSubmission",
    "CodeforcesProfile",
    "CodeforcesSubmission",
    "CodeforcesContestResult",
    "Goal",
]
