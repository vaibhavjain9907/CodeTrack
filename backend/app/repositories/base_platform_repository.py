"""
Base repository for coding-platform integrations.

Extracts the data-access operations that are structurally identical
across every platform integration: look up a profile by user, delete
a profile, get submissions in order, and bulk-insert submissions.
These are implemented as abstract-interface methods here — concrete
subclasses override `get_existing_submission_ids` and
`get_submissions` with the correct model/column references, avoiding
the SQLAlchemy InstrumentedAttribute descriptor interception that
happens when column class-attributes are stored on non-mapped classes.
"""

from typing import Generic, TypeVar

from sqlalchemy.orm import Session

ProfileT = TypeVar("ProfileT")
SubmissionT = TypeVar("SubmissionT")


class BasePlatformRepository(Generic[ProfileT, SubmissionT]):
    """
    Common data-access operations shared by LeetCode and Codeforces
    repositories. Each concrete subclass provides its own typed
    implementations of profile lookup and submission queries — the
    shared logic here is the session lifecycle (commit, add_all) and
    the delete-profile operation, which truly are identical.
    """

    profile_model: type[ProfileT]

    def __init__(self, db: Session) -> None:
        self._db = db

    def get_profile_by_user_id(self, user_id: int) -> ProfileT | None:
        return (
            self._db.query(self.profile_model)
            .filter(self.profile_model.user_id == user_id)  # type: ignore[attr-defined]
            .first()
        )

    def delete_profile(self, profile: ProfileT) -> None:
        self._db.delete(profile)
        self._db.commit()

    def bulk_create_submissions(self, submissions: list[SubmissionT]) -> None:
        if not submissions:
            return
        self._db.add_all(submissions)
        self._db.commit()
