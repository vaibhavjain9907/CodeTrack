"""
Authentication domain exceptions.

Services raise these instead of HTTPException directly. This keeps
app/services/auth_service.py free of HTTP-layer concerns (status
codes) and lets the global exception handlers (app/core/exception_handlers.py)
own the mapping from "what went wrong" to "what HTTP status to return".
"""


class AuthError(Exception):
    """Base class for all authentication-related errors."""


class EmailAlreadyRegisteredError(AuthError):
    def __init__(self, email: str) -> None:
        self.email = email
        super().__init__(f"An account with email '{email}' already exists.")


class InvalidCredentialsError(AuthError):
    def __init__(self) -> None:
        super().__init__("Incorrect email or password.")


class InactiveUserError(AuthError):
    def __init__(self) -> None:
        super().__init__("This account has been deactivated.")


class InvalidRefreshTokenError(AuthError):
    def __init__(self, reason: str = "Refresh token is invalid or expired.") -> None:
        super().__init__(reason)


class UserNotFoundError(AuthError):
    def __init__(self) -> None:
        super().__init__("User not found.")


class LeetCodeError(Exception):
    """Base class for all LeetCode-integration-related errors."""


class LeetCodeAlreadyConnectedError(LeetCodeError):
    def __init__(self) -> None:
        super().__init__(
            "A LeetCode account is already connected. Disconnect it first to link a different one."
        )


class LeetCodeProfileNotConnectedError(LeetCodeError):
    def __init__(self) -> None:
        super().__init__("No LeetCode account is connected for this user.")


class LeetCodeUsernameInvalidError(LeetCodeError):
    def __init__(self, username: str) -> None:
        self.username = username
        super().__init__(f"No LeetCode user found with username '{username}'.")


class LeetCodeSyncFailedError(LeetCodeError):
    def __init__(self, reason: str) -> None:
        super().__init__(f"Failed to sync with LeetCode: {reason}")


class CodeforcesError(Exception):
    """Base class for all Codeforces-integration-related errors."""


class CodeforcesAlreadyConnectedError(CodeforcesError):
    def __init__(self) -> None:
        super().__init__(
            "A Codeforces account is already connected. "
            "Disconnect it first to link a different one."
        )


class CodeforcesProfileNotConnectedError(CodeforcesError):
    def __init__(self) -> None:
        super().__init__("No Codeforces account is connected for this user.")


class CodeforcesHandleInvalidError(CodeforcesError):
    def __init__(self, handle: str) -> None:
        self.handle = handle
        super().__init__(f"No Codeforces user found with handle '{handle}'.")


class CodeforcesSyncFailedError(CodeforcesError):
    def __init__(self, reason: str) -> None:
        super().__init__(f"Failed to sync with Codeforces: {reason}")
