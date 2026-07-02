"""
Authentication endpoints.

Thin HTTP layer: every endpoint here does exactly two things —
(1) delegate to AuthService, (2) wrap the result in the standard
APIResponse envelope. Domain exceptions raised by the service
(EmailAlreadyRegisteredError, InvalidCredentialsError, etc.) are
caught and translated to HTTP responses by the global exception
handlers in app/core/exception_handlers.py — no try/except and no
business logic lives in this file.
"""

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, get_auth_service
from app.schemas.auth import AuthResponse, LoginRequest, LogoutRequest, RefreshRequest, TokenPair
from app.schemas.response import APIResponse
from app.schemas.user import UserCreate, UserPublic
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=APIResponse[AuthResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
def register(
    user_in: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
) -> APIResponse[AuthResponse]:
    user, tokens = auth_service.register(user_in)
    return APIResponse(
        message="Account created successfully.",
        data=AuthResponse(tokens=tokens, user=UserPublic.model_validate(user)),
    )


@router.post(
    "/login",
    response_model=APIResponse[AuthResponse],
    summary="Authenticate with email and password",
)
def login(
    credentials: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> APIResponse[AuthResponse]:
    user, tokens = auth_service.login(email=credentials.email, password=credentials.password)
    return APIResponse(
        message="Login successful.",
        data=AuthResponse(tokens=tokens, user=UserPublic.model_validate(user)),
    )


@router.post(
    "/refresh",
    response_model=APIResponse[TokenPair],
    summary="Exchange a refresh token for a new token pair",
)
def refresh(
    body: RefreshRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> APIResponse[TokenPair]:
    tokens = auth_service.refresh(body.refresh_token)
    return APIResponse(message="Token refreshed successfully.", data=tokens)


@router.post(
    "/logout",
    response_model=APIResponse[None],
    summary="Revoke a refresh token, ending that session",
)
def logout(
    body: LogoutRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> APIResponse[None]:
    auth_service.logout(body.refresh_token)
    return APIResponse(message="Logged out successfully.", data=None)


@router.get(
    "/me",
    response_model=APIResponse[UserPublic],
    summary="Get the currently authenticated user's profile",
)
def get_me(current_user: CurrentUser) -> APIResponse[UserPublic]:
    return APIResponse(
        message="Current user retrieved successfully.",
        data=UserPublic.model_validate(current_user),
    )
