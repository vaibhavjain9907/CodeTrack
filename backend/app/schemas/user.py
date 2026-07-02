"""
User schemas.

Naming convention used throughout CodeTrack:
- `*Create` / `*Update`: input schemas (request bodies).
- Plain name (e.g. `UserPublic`): output schema returned to clients —
  NEVER includes hashed_password or other sensitive fields.
- `*InDB`: internal-only representation used between repository and
  service layers, never returned directly from an endpoint.
"""

from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field

from app.models.enums import UserRole
from app.schemas.validators import validate_password_strength

StrongPassword = Annotated[str, AfterValidator(validate_password_strength)]


class UserCreate(BaseModel):
    """Request body for POST /auth/register."""

    email: EmailStr
    full_name: str = Field(min_length=1, max_length=255)
    password: StrongPassword


class UserPublic(BaseModel):
    """Public-facing user representation — safe to return from any endpoint."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime
