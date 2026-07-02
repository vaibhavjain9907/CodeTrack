"""
Global exception handlers.

Registered onto the FastAPI app in app/main.py. This is the single
place that translates "what went wrong" into "what HTTP status and
JSON body to send back" — endpoints and services never construct
HTTPException themselves for these cases; they raise domain
exceptions (app/core/exceptions.py) or let Pydantic validation fail
naturally, and this module does the rest.

Every error response follows the same shape (ErrorResponse):
    {"success": false, "message": "...", "errors": [...] | null}
"""

import logging
from collections.abc import Callable, Coroutine
from typing import Any, cast

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.exceptions import (
    AuthError,
    CodeforcesAlreadyConnectedError,
    CodeforcesError,
    CodeforcesHandleInvalidError,
    CodeforcesProfileNotConnectedError,
    CodeforcesSyncFailedError,
    EmailAlreadyRegisteredError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    LeetCodeAlreadyConnectedError,
    LeetCodeError,
    LeetCodeProfileNotConnectedError,
    LeetCodeSyncFailedError,
    LeetCodeUsernameInvalidError,
    UserNotFoundError,
)
from app.schemas.response import ErrorResponse

logger = logging.getLogger("codetrack")

# Starlette's add_exception_handler is typed to accept only handlers of
# exactly `Exception`, even though it dispatches by the *registered*
# exception type at runtime (i.e. registering a handler for AuthError
# is correct and exactly what Starlette expects you to do — the stub
# is just narrower than the actual contract). This alias documents that
# gap at the one place we need to cross it, instead of scattering
# `# type: ignore` across every registration call below.
ExceptionHandler = Callable[[Request, Any], Coroutine[Any, Any, JSONResponse]]

# Maps each domain exception type to the HTTP status it should produce.
# Order matters only in that more-specific exceptions must be listed
# if they ever subclass one another with a different desired status;
# currently all AuthError subclasses are flat siblings.
_AUTH_ERROR_STATUS_MAP: dict[type[AuthError], int] = {
    EmailAlreadyRegisteredError: status.HTTP_409_CONFLICT,
    InvalidCredentialsError: status.HTTP_401_UNAUTHORIZED,
    InactiveUserError: status.HTTP_403_FORBIDDEN,
    InvalidRefreshTokenError: status.HTTP_401_UNAUTHORIZED,
    UserNotFoundError: status.HTTP_404_NOT_FOUND,
}

_LEETCODE_ERROR_STATUS_MAP: dict[type[LeetCodeError], int] = {
    LeetCodeAlreadyConnectedError: status.HTTP_409_CONFLICT,
    LeetCodeProfileNotConnectedError: status.HTTP_404_NOT_FOUND,
    LeetCodeUsernameInvalidError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    LeetCodeSyncFailedError: status.HTTP_502_BAD_GATEWAY,
}

_CODEFORCES_ERROR_STATUS_MAP: dict[type[CodeforcesError], int] = {
    CodeforcesAlreadyConnectedError: status.HTTP_409_CONFLICT,
    CodeforcesProfileNotConnectedError: status.HTTP_404_NOT_FOUND,
    CodeforcesHandleInvalidError: status.HTTP_422_UNPROCESSABLE_ENTITY,
    CodeforcesSyncFailedError: status.HTTP_502_BAD_GATEWAY,
}


def _status_for(exc: AuthError) -> int:
    return _AUTH_ERROR_STATUS_MAP.get(type(exc), status.HTTP_400_BAD_REQUEST)


def _status_for_leetcode(exc: LeetCodeError) -> int:
    return _LEETCODE_ERROR_STATUS_MAP.get(type(exc), status.HTTP_400_BAD_REQUEST)


def _status_for_codeforces(exc: CodeforcesError) -> int:
    return _CODEFORCES_ERROR_STATUS_MAP.get(type(exc), status.HTTP_400_BAD_REQUEST)


async def auth_error_handler(request: Request, exc: AuthError) -> JSONResponse:
    return JSONResponse(
        status_code=_status_for(exc),
        content=ErrorResponse(message=str(exc)).model_dump(),
    )


async def leetcode_error_handler(request: Request, exc: LeetCodeError) -> JSONResponse:
    return JSONResponse(
        status_code=_status_for_leetcode(exc),
        content=ErrorResponse(message=str(exc)).model_dump(),
    )


async def codeforces_error_handler(request: Request, exc: CodeforcesError) -> JSONResponse:
    return JSONResponse(
        status_code=_status_for_codeforces(exc),
        content=ErrorResponse(message=str(exc)).model_dump(),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handles FastAPI's own HTTPException — raised directly by
    app/api/deps.py (get_current_user, require_admin) for 401/403
    cases that happen before any service/domain logic runs. Re-wraps
    it in the same ErrorResponse envelope every other error uses, and
    preserves headers (critically: WWW-Authenticate: Bearer on 401s,
    which is required by the OAuth2 Bearer Token spec, RFC 6750).
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(message=str(exc.detail)).model_dump(),
        headers=exc.headers,
    )


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handles Pydantic/FastAPI request validation failures — malformed
    JSON, missing required fields, weak passwords (our custom
    validator raises ValueError, which FastAPI surfaces here too).
    """
    errors = [
        {"field": ".".join(str(loc) for loc in error["loc"]), "message": error["msg"]}
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            message="Request validation failed.",
            errors=errors,
        ).model_dump(),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Last-resort safety net. Logs the full exception server-side but
    never leaks internal details (stack traces, exception messages
    that might contain DB connection strings, etc.) to the client.
    """
    logger.exception("Unhandled exception while processing %s %s", request.method, request.url)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(message="An unexpected error occurred.").model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Called once from app/main.py's create_application()."""
    app.add_exception_handler(AuthError, cast(ExceptionHandler, auth_error_handler))
    app.add_exception_handler(LeetCodeError, cast(ExceptionHandler, leetcode_error_handler))
    app.add_exception_handler(CodeforcesError, cast(ExceptionHandler, codeforces_error_handler))
    app.add_exception_handler(HTTPException, cast(ExceptionHandler, http_exception_handler))
    app.add_exception_handler(
        RequestValidationError, cast(ExceptionHandler, validation_error_handler)
    )
    app.add_exception_handler(Exception, cast(ExceptionHandler, unhandled_exception_handler))
