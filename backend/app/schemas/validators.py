"""
Password strength validation.

A single, reusable validator function so the rules can never drift
between registration, password-reset, and any future "change password"
endpoint — they all call `validate_password_strength`.

Rules enforced (deliberately readable, not regex-golf):
- At least 8 characters.
- At least one uppercase letter.
- At least one lowercase letter.
- At least one digit.
- At least one special character.
"""

import re

MIN_PASSWORD_LENGTH = 8

_SPECIAL_CHAR_PATTERN = re.compile(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\/;'~`]")


def validate_password_strength(password: str) -> str:
    """
    Validate password strength, returning the password unchanged on
    success or raising ValueError on failure. Designed to be used
    directly as a Pydantic field_validator / model_validator body.
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.")
    if not any(char.isupper() for char in password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not any(char.islower() for char in password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        raise ValueError("Password must contain at least one digit.")
    if not _SPECIAL_CHAR_PATTERN.search(password):
        raise ValueError("Password must contain at least one special character.")
    return password
