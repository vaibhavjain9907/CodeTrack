"""
JWT issuance and verification.

Two distinct token types are issued, each carrying a `type` claim
("access" or "refresh") so one cannot be replayed as the other even
though both are signed with the same SECRET_KEY:

- Access token: short-lived (settings.ACCESS_TOKEN_EXPIRE_MINUTES),
  stateless — verified by signature alone, no DB lookup. Sent on every
  authenticated request as `Authorization: Bearer <token>`.

- Refresh token: longer-lived (settings.REFRESH_TOKEN_EXPIRE_MINUTES).
  Its JTI (JWT ID) is also persisted, hashed, in the `refresh_tokens`
  table (see app/models/refresh_token.py) so it can be revoked on
  logout — something a purely stateless JWT cannot support.

Claims used:
- `sub`: subject — the user's id, as a string (JWT spec requires
  string subjects).
- `type`: "access" | "refresh".
- `jti`: unique token id (refresh tokens only) — used to look up /
  revoke the corresponding `refresh_tokens` row.
- `exp`: standard expiration claim, enforced by python-jose on decode.
"""

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum

from jose import JWTError, jwt

from app.core.config import settings


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


class InvalidTokenError(Exception):
    """Raised when a JWT is malformed, expired, or has the wrong type."""


@dataclass(frozen=True)
class DecodedToken:
    user_id: int
    token_type: TokenType
    jti: str | None  # only present on refresh tokens
    expires_at: datetime


def _create_token(
    *,
    user_id: int,
    token_type: TokenType,
    expires_delta: timedelta,
    jti: str | None = None,
) -> str:
    now = datetime.now(UTC)
    expire = now + expires_delta

    payload: dict[str, object] = {
        "sub": str(user_id),
        "type": token_type.value,
        "iat": now,
        "exp": expire,
    }
    if jti is not None:
        payload["jti"] = jti

    encoded: str = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded


def create_access_token(user_id: int) -> str:
    """Issue a short-lived access token for the given user id."""
    return _create_token(
        user_id=user_id,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )


def create_refresh_token(user_id: int) -> tuple[str, str, datetime]:
    """
    Issue a refresh token for the given user id.

    Returns a tuple of (raw_token, jti, expires_at) — the caller
    (AuthService) is responsible for persisting a hash of the raw
    token in the `refresh_tokens` table so it can later be revoked.
    """
    jti = uuid.uuid4().hex
    expires_delta = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    expires_at = datetime.now(UTC) + expires_delta

    token = _create_token(
        user_id=user_id,
        token_type=TokenType.REFRESH,
        expires_delta=expires_delta,
        jti=jti,
    )
    return token, jti, expires_at


def decode_token(token: str, *, expected_type: TokenType) -> DecodedToken:
    """
    Decode and validate a JWT, enforcing both signature/expiry and
    that the token's `type` claim matches what the caller expects.

    Raises InvalidTokenError for any failure — callers should catch
    this single exception type rather than python-jose's internals.
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as exc:
        raise InvalidTokenError("Token is invalid or expired.") from exc

    token_type_raw = payload.get("type")
    if token_type_raw != expected_type.value:
        raise InvalidTokenError(
            f"Expected a {expected_type.value} token but received {token_type_raw!r}."
        )

    subject = payload.get("sub")
    if subject is None:
        raise InvalidTokenError("Token is missing the 'sub' claim.")

    try:
        user_id = int(subject)
    except (TypeError, ValueError) as exc:
        raise InvalidTokenError("Token 'sub' claim is not a valid user id.") from exc

    exp = payload.get("exp")
    if exp is None:
        raise InvalidTokenError("Token is missing the 'exp' claim.")

    return DecodedToken(
        user_id=user_id,
        token_type=expected_type,
        jti=payload.get("jti"),
        expires_at=datetime.fromtimestamp(exp, tz=UTC),
    )
