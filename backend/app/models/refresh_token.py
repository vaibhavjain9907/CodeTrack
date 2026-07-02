"""
RefreshToken model.

Why this table exists:
Access tokens are short-lived, stateless JWTs validated by signature
alone (no DB lookup needed — that's the point of JWTs). But that same
statelessness means a stolen or "logged out" access token cannot be
revoked before it naturally expires.

Refresh tokens solve this differently: each issued refresh token is
recorded here. Logout (and refresh-token rotation on each use) marks
the row `revoked = True`. The /auth/refresh endpoint checks this table,
so a revoked refresh token is rejected immediately — giving us real
logout semantics instead of "wait for expiry".

We store a SHA-256 hash of the token, never the raw token, so a
database leak alone cannot be used to mint new sessions.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import TimestampMixin


class RefreshToken(Base, TimestampMixin):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # SHA-256 hex digest of the raw refresh token (64 chars). The raw
    # token itself is only ever returned to the client, never stored.
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<RefreshToken id={self.id} user_id={self.user_id} revoked={self.revoked}>"
