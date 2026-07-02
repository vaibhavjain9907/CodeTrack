"""
Standard API response envelope.

Every successful endpoint response in CodeTrack is wrapped in this
shape so frontend clients can rely on one consistent structure
regardless of endpoint:

    {
        "success": true,
        "message": "Login successful.",
        "data": { ... }
    }

Error responses use a parallel shape produced by the global exception
handlers in app/core/exception_handlers.py (success=false, data=null,
plus an `errors` field for validation details).
"""

from typing import Generic, TypeVar

from pydantic import BaseModel

DataT = TypeVar("DataT")


class APIResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str
    data: DataT | None = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: list[dict[str, str]] | None = None
