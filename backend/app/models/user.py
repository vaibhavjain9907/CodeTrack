"""
User model.

Represents a registered CodeTrack account. This module defines ONLY
the persistence layer (the SQLAlchemy model) — password hashing,
JWT issuance, and login/registration logic live in app/security
and app/services (Module 3: Authentication).

Design notes:
- `hashed_password` is nullable at the DB level to support future
  OAuth-only accounts (e.g. "Sign in with GitHub") without a schema
  migration, but the registration flow always populates it for
  email/password signups.
- `email` is unique and indexed — it's the natural login identifier.
- `is_active` supports account deactivation/soft-bans without
  deleting rows (preserves analytics history).
- `is_verified` is reserved for a future email-verification flow.
- `role` is a Postgres ENUM (not a free-text string) so invalid
  role values are rejected at the database level, not just the API
  layer. Defaults to USER; ADMIN must be granted explicitly.
"""

from sqlalchemy import Boolean, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.enums import UserRole
from app.models.mixins import TimestampMixin


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)

    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)

    role: Mapped[UserRole] = mapped_column(
        SAEnum(UserRole, name="user_role", native_enum=True),
        default=UserRole.USER,
        nullable=False,
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role.value}>"
