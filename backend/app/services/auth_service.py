"""
Authentication service.

Orchestrates the user and refresh-token repositories together with
the password/JWT primitives in app/security/. This is the only layer
that should know the *sequence* of steps for register/login/refresh/
logout — endpoints just call these methods and translate results to
HTTP responses; repositories just persist things.
"""

from app.core.exceptions import (
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
)
from app.models.user import User
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenPair
from app.schemas.user import UserCreate
from app.security.jwt import (
    DecodedToken,
    TokenType,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.security.password import hash_password, verify_password
from app.security.token_hash import hash_token


class AuthService:
    def __init__(
        self,
        user_repository: UserRepository,
        refresh_token_repository: RefreshTokenRepository,
    ) -> None:
        self._users = user_repository
        self._refresh_tokens = refresh_token_repository

    def register(self, user_in: UserCreate) -> tuple[User, TokenPair]:
        """Create a new user account and issue an initial token pair."""
        if self._users.get_by_email(user_in.email) is not None:
            raise EmailAlreadyRegisteredError(user_in.email)

        user = self._users.create(
            user_in=user_in,
            hashed_password=hash_password(user_in.password),
        )
        tokens = self._issue_token_pair(user.id)
        return user, tokens

    def login(self, *, email: str, password: str) -> tuple[User, TokenPair]:
        """Authenticate a user by email/password and issue a token pair."""
        user = self._users.get_by_email(email)

        # Deliberately identical error for "no such user" and "wrong
        # password" — distinguishing them lets an attacker enumerate
        # which emails are registered.
        if user is None or user.hashed_password is None:
            raise InvalidCredentialsError()
        if not verify_password(password, user.hashed_password):
            raise InvalidCredentialsError()
        if not user.is_active:
            raise InactiveUserError()

        tokens = self._issue_token_pair(user.id)
        return user, tokens

    def refresh(self, raw_refresh_token: str) -> TokenPair:
        """
        Validate a refresh token and issue a new token pair.

        Implements refresh-token rotation: the old refresh token is
        revoked as part of issuing the new one, so a single refresh
        token can only ever be used once. If a revoked token is
        presented again, it's a strong signal of token theft.
        """
        decoded = self._decode_and_validate_refresh_token(raw_refresh_token)

        token_hash = hash_token(raw_refresh_token)
        stored = self._refresh_tokens.get_by_token_hash(token_hash)
        if stored is None or stored.revoked:
            raise InvalidRefreshTokenError()

        user = self._users.get_by_id(decoded.user_id)
        if user is None:
            raise InvalidRefreshTokenError("User for this token no longer exists.")
        if not user.is_active:
            raise InactiveUserError()

        # Rotate: revoke the token just used, then issue a fresh pair.
        self._refresh_tokens.revoke(stored)
        return self._issue_token_pair(user.id)

    def logout(self, raw_refresh_token: str) -> None:
        """
        Revoke a refresh token, ending that session.

        Note: this does NOT invalidate the current access token (it's
        stateless and will simply expire on its own, per
        ACCESS_TOKEN_EXPIRE_MINUTES). What logout guarantees is that
        this refresh token can never be used to mint a new access
        token again.
        """
        token_hash = hash_token(raw_refresh_token)
        stored = self._refresh_tokens.get_by_token_hash(token_hash)
        if stored is None:
            # Already gone / never existed — logout is idempotent,
            # so this is not an error from the caller's perspective.
            return
        if not stored.revoked:
            self._refresh_tokens.revoke(stored)

    def _decode_and_validate_refresh_token(self, raw_refresh_token: str) -> DecodedToken:
        try:
            return decode_token(raw_refresh_token, expected_type=TokenType.REFRESH)
        except Exception as exc:
            raise InvalidRefreshTokenError() from exc

    def _issue_token_pair(self, user_id: int) -> TokenPair:
        access_token = create_access_token(user_id)
        refresh_token, _jti, expires_at = create_refresh_token(user_id)

        self._refresh_tokens.create(
            user_id=user_id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
        )

        return TokenPair(access_token=access_token, refresh_token=refresh_token)
