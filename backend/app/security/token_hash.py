"""
Refresh token hashing.

This is deliberately NOT bcrypt. Bcrypt is for passwords, where the
threat model is "attacker brute-forces a stolen hash" and slowness is
the whole point. Refresh tokens are already high-entropy random JWTs,
not human-guessable secrets — the threat model here is "don't store
the bearer token verbatim in case the DB leaks", and we need fast,
deterministic lookups (`WHERE token_hash = ?`) on every /refresh call.
SHA-256 is the correct tool for that job.
"""

import hashlib


def hash_token(raw_token: str) -> str:
    """Return the SHA-256 hex digest of a raw token string."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
