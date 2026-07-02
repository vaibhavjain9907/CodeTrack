"""
User role enum.

Defined once here and reused by both the SQLAlchemy model
(app/models/user.py) and Pydantic schemas (app/schemas/user.py)
so the set of valid roles can never drift between the DB layer
and the API layer.
"""

from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
