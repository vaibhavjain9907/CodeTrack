"""
Password hashing.

Uses the `bcrypt` library directly. We deliberately do NOT use
passlib's CryptContext here: passlib is unmaintained (no release
since 2020) and its bcrypt backend probes `bcrypt.__about__`, an
attribute removed in modern bcrypt (>=4.1) — this breaks
hash_password() with an AttributeError/ValueError on any current
bcrypt install. Calling `bcrypt` directly avoids that entirely and is
the approach most current FastAPI codebases have migrated to.

Bcrypt is deliberately slow (adaptive work factor) — this is a
feature, not a bug: it makes brute-forcing stolen hashes
computationally expensive. Never replace this with a fast hash like
SHA-256 for passwords.

Plain passwords are NEVER stored or logged anywhere in this codebase.
"""

import bcrypt

# Bcrypt's algorithm silently truncates input beyond 72 bytes. Rather
# than allow silent truncation (where "MyPassword123!" + 200 garbage
# characters would hash identically to the first 72 bytes), we reject
# passwords that exceed this length explicitly. In practice this is
# moot for real users since our strength validator requires a
# reasonable max length, but it is enforced here as the source of
# truth for the hashing layer itself.
_BCRYPT_MAX_BYTES = 72

_BCRYPT_ROUNDS = 12  # adaptive work factor; 12 is a solid 2026 default


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password for storage. Never store the input itself."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > _BCRYPT_MAX_BYTES:
        raise ValueError(f"Password must not exceed {_BCRYPT_MAX_BYTES} bytes.")
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plain-text password against a stored bcrypt hash."""
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > _BCRYPT_MAX_BYTES:
        return False
    return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
