"""
Shared FastAPI dependencies.

This module is the dependency-injection wiring point: it builds
repositories and services from the request-scoped DB session, and
exposes `get_current_user` / `require_admin` for protecting routes.

Endpoints should only ever depend on things from this module (or
Depends(get_db) directly) — never instantiate a repository or service
themselves.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.repositories.codeforces_repository import CodeforcesRepository
from app.repositories.leetcode_repository import LeetCodeRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.security.jwt import InvalidTokenError, TokenType, decode_token
from app.services.auth_service import AuthService
from app.services.codeforces_service import CodeforcesService
from app.services.dashboard_service import DashboardService
from app.services.leetcode_service import LeetCodeService

# tokenUrl points at the login endpoint purely for the interactive
# OpenAPI docs "Authorize" button — FastAPI doesn't call it itself.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_refresh_token_repository(db: Session = Depends(get_db)) -> RefreshTokenRepository:
    return RefreshTokenRepository(db)


def get_auth_service(
    user_repository: UserRepository = Depends(get_user_repository),
    refresh_token_repository: RefreshTokenRepository = Depends(get_refresh_token_repository),
) -> AuthService:
    return AuthService(user_repository, refresh_token_repository)


def get_leetcode_repository(db: Session = Depends(get_db)) -> LeetCodeRepository:
    return LeetCodeRepository(db)


def get_codeforces_repository(db: Session = Depends(get_db)) -> CodeforcesRepository:
    return CodeforcesRepository(db)


def get_dashboard_service(
    leetcode_repository: LeetCodeRepository = Depends(get_leetcode_repository),
    codeforces_repository: CodeforcesRepository = Depends(get_codeforces_repository),
) -> DashboardService:
    return DashboardService(leetcode_repository, codeforces_repository)


def get_leetcode_service(
    leetcode_repository: LeetCodeRepository = Depends(get_leetcode_repository),
) -> LeetCodeService:
    return LeetCodeService(leetcode_repository)


def get_codeforces_service(
    codeforces_repository: CodeforcesRepository = Depends(get_codeforces_repository),
) -> CodeforcesService:
    return CodeforcesService(codeforces_repository)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    user_repository: UserRepository = Depends(get_user_repository),
) -> User:
    """
    Resolve the authenticated User from the Bearer access token.

    This is THE protected-route dependency: any endpoint that adds
    `current_user: User = Depends(get_current_user)` requires a valid,
    non-expired access token belonging to an active user, or the
    request is rejected with 401 before the endpoint body ever runs.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if token is None:
        raise credentials_exception

    try:
        decoded = decode_token(token, expected_type=TokenType.ACCESS)
    except InvalidTokenError as exc:
        raise credentials_exception from exc

    user = user_repository.get_by_id(decoded.user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(current_user: CurrentUser) -> User:
    """
    Protected-route dependency that additionally requires the ADMIN role.

    Usage: `current_user: User = Depends(require_admin)`.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires administrator privileges.",
        )
    return current_user
