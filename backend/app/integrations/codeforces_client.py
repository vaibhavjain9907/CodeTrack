"""
Codeforces API client.

Calls Codeforces's public REST API directly (https://codeforces.com/api/{method}).
Unlike LeetCode, Codeforces's API is officially documented and
explicitly supports anonymous access to public data — see
https://codeforces.com/apiHelp. Every method returns
{"status": "OK"|"FAILED", "comment": str, "result": ...}.

Rate limit: Codeforces enforces at most ~1 request per 2 seconds per
the official docs (some sources cite up to 5/sec — we use the more
conservative 2-second figure to be a good API citizen, since this is
a shared, free, unauthenticated resource).
"""

import asyncio
import time

import httpx

_BASE_URL = "https://codeforces.com/api"
_MIN_REQUEST_INTERVAL_SECONDS = 2.0


class CodeforcesHandleNotFoundError(Exception):
    """Raised when the given Codeforces handle does not exist."""


class CodeforcesAPIError(Exception):
    """Raised for other Codeforces API failures (network, rate limit, schema change)."""


class CodeforcesClient:
    def __init__(self) -> None:
        self._headers = {
            "User-Agent": "Mozilla/5.0 (compatible; CodeTrack/1.0; +https://github.com/codetrack)",
        }
        self._last_request_at: float = 0.0
        self._rate_limit_lock = asyncio.Lock()

    async def _throttle(self) -> None:
        async with self._rate_limit_lock:
            elapsed = time.monotonic() - self._last_request_at
            if elapsed < _MIN_REQUEST_INTERVAL_SECONDS:
                await asyncio.sleep(_MIN_REQUEST_INTERVAL_SECONDS - elapsed)
            self._last_request_at = time.monotonic()

    async def _get(self, method: str, params: dict[str, str]) -> object:
        await self._throttle()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{_BASE_URL}/{method}", params=params, headers=self._headers
                )
        except httpx.RequestError as exc:
            raise CodeforcesAPIError(f"Could not reach Codeforces: {exc}") from exc

        if response.status_code != 200:
            raise CodeforcesAPIError(
                f"Codeforces returned HTTP {response.status_code}: {response.text[:200]}"
            )

        body = response.json()
        if body.get("status") != "OK":
            comment = body.get("comment", "Unknown error")
            if "not found" in str(comment).lower():
                raise CodeforcesHandleNotFoundError(str(comment))
            raise CodeforcesAPIError(f"Codeforces API error: {comment}")

        return body.get("result")

    async def fetch_user_info(self, handle: str) -> dict[str, object]:
        """
        Fetch a user's public profile via user.info.

        Raises CodeforcesHandleNotFoundError if the handle does not
        exist — Codeforces returns status=FAILED with a comment
        containing "not found" for unknown handles, rather than a
        distinct HTTP error.
        """
        result = await self._get("user.info", {"handles": handle})
        if not isinstance(result, list) or not result:
            raise CodeforcesHandleNotFoundError(f"No Codeforces user found with handle '{handle}'.")
        user_info = result[0]
        if not isinstance(user_info, dict):
            raise CodeforcesAPIError("Unexpected response shape from Codeforces (user.info).")
        return user_info

    async def fetch_submissions(self, handle: str, *, count: int = 50) -> list[dict[str, object]]:
        """Fetch the user's most recent submissions (any verdict, not just accepted)."""
        result = await self._get(
            "user.status", {"handle": handle, "from": "1", "count": str(count)}
        )
        if not isinstance(result, list):
            return []
        return result  # type: ignore[return-value]

    async def fetch_rating_history(self, handle: str) -> list[dict[str, object]]:
        """
        Fetch the user's full contest rating history.

        Unrated users (never participated in a rated contest) get an
        empty list back from Codeforces — not an error — so this
        returns [] rather than raising for that case.
        """
        result = await self._get("user.rating", {"handle": handle})
        if not isinstance(result, list):
            return []
        return result  # type: ignore[return-value]
