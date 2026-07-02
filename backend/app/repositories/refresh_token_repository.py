"""
Refresh token repository.

Pure data-access layer for the `refresh_tokens` table. See
app/models/refresh_token.py for why this table exists (it's what
makes logout/revocation possible for otherwise-stateless JWTs).
"""

from datetime import datetime

from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def create(
        self,
        *,
        user_id: int,
        token_hash: str,
        expires_at: datetime,
    ) -> RefreshToken:
        token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            revoked=False,
        )
        self._db.add(token)
        self._db.commit()
        self._db.refresh(token)
        return token

    def get_by_token_hash(self, token_hash: str) -> RefreshToken | None:
        return self._db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

    def revoke(self, token: RefreshToken) -> None:
        token.revoked = True
        self._db.add(token)
        self._db.commit()

    def revoke_all_for_user(self, user_id: int) -> None:
        """
        Revoke every active refresh token for a user. Not wired to an
        endpoint yet in this module, but kept here for future use —
        e.g. a "log out of all devices" or "password changed" flow.
        """
        self._db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
        ).update({"revoked": True})
        self._db.commit()
