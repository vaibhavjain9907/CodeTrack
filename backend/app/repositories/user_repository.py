"""
User repository.

Pure data-access layer: every method here is a thin wrapper around a
SQLAlchemy query. No password hashing, no token logic, no business
rules — that belongs in app/services/auth_service.py. Keeping this
separation means the service layer can be unit-tested against a fake
repository, and the persistence layer can change (e.g. to async
SQLAlchemy) without touching business logic.
"""

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self._db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self._db.query(User).filter(User.email == email).first()

    def create(self, *, user_in: UserCreate, hashed_password: str) -> User:
        user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password,
        )
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user
