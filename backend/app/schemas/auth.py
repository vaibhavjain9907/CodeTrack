"""
Authentication schemas.

These describe the request/response bodies for the /auth/* endpoints.
They are intentionally separate from app/schemas/user.py — auth
payloads (tokens, login credentials) are a different concern from the
user resource itself.
"""

from pydantic import BaseModel, EmailStr

from app.schemas.user import UserPublic


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""

    email: EmailStr
    password: str


class TokenPair(BaseModel):
    """Returned by register, login, and refresh — the full credential set."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthResponse(BaseModel):
    """Returned by register/login: tokens plus the authenticated user's profile."""

    tokens: TokenPair
    user: UserPublic


class RefreshRequest(BaseModel):
    """Request body for POST /auth/refresh."""

    refresh_token: str


class LogoutRequest(BaseModel):
    """Request body for POST /auth/logout."""

    refresh_token: str
