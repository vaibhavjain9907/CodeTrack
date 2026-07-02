"""
LeetCode GraphQL client.

Calls LeetCode's public GraphQL endpoint directly. No API key exists
for this — LeetCode does not offer one — so this uses the same
unauthenticated public queries any browser can make, the same way
every third-party "LeetCode stats" tool works.

Known limitation, stated honestly rather than papered over: the
public recentAcSubmissionList query only returns title, titleSlug,
timestamp, statusDisplay, and lang. Per-submission runtime/memory
require LeetCode's authenticated submissionDetails query (a per-user
session cookie we do not have, since this is a public read of someone
else's profile, not the user's own LeetCode session). We therefore
store runtime/memory as None — the frontend already renders that
as "—" via its formatRuntime/formatMemory helpers (see
src/features/leetcode/RecentSubmissions.tsx), so this is a fully
supported, not a broken, state.
"""

import httpx

from app.core.config import settings

_PROFILE_QUERY = """
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      realName
      userAvatar
      ranking
    }
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    contributions {
      points
    }
  }
  allQuestionsCount {
    difficulty
    count
  }
}
"""

_RECENT_SUBMISSIONS_QUERY = """
query getRecentSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id
    title
    titleSlug
    timestamp
    statusDisplay
    lang
  }
}
"""


class LeetCodeUserNotFoundError(Exception):
    """Raised when the given LeetCode username does not exist."""


class LeetCodeAPIError(Exception):
    """Raised for other LeetCode API failures (network, rate limit, schema change)."""


class LeetCodeClient:
    def __init__(self) -> None:
        self._url = settings.LEETCODE_GRAPHQL_URL
        # LeetCode's edge rejects requests with no User-Agent / a generic
        # Python User-Agent on some routes — a normal browser-style UA
        # avoids that without impersonating a logged-in session.
        self._headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; CodeTrack/1.0; +https://github.com/codetrack)",
            "Referer": "https://leetcode.com",
        }

    async def _post(self, query: str, variables: dict[str, object]) -> dict[str, object]:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self._url,
                    json={"query": query, "variables": variables},
                    headers=self._headers,
                )
        except httpx.RequestError as exc:
            raise LeetCodeAPIError(f"Could not reach LeetCode: {exc}") from exc

        if response.status_code != 200:
            raise LeetCodeAPIError(
                f"LeetCode returned HTTP {response.status_code}: {response.text[:200]}"
            )

        body = response.json()
        if "errors" in body and body["errors"]:
            raise LeetCodeAPIError(f"LeetCode GraphQL error: {body['errors']}")

        data = body.get("data")
        if not isinstance(data, dict):
            raise LeetCodeAPIError("LeetCode response did not contain a 'data' field.")
        return data

    async def fetch_profile(self, username: str) -> dict[str, object]:
        """
        Fetch a user's public profile and aggregate submission stats.

        Raises LeetCodeUserNotFoundError if the username does not exist
        (LeetCode returns matchedUser: null rather than an HTTP error
        for unknown usernames).
        """
        data = await self._post(_PROFILE_QUERY, {"username": username})
        if data.get("matchedUser") is None:
            raise LeetCodeUserNotFoundError(f"No LeetCode user found with username '{username}'.")
        return data

    async def fetch_recent_submissions(
        self, username: str, *, limit: int = 20
    ) -> list[dict[str, object]]:
        """
        Fetch the user's most recent ACCEPTED submissions (LeetCode's
        public API only exposes accepted submissions for other users,
        not wrong-answer/TLE attempts — that history is private).
        """
        data = await self._post(_RECENT_SUBMISSIONS_QUERY, {"username": username, "limit": limit})
        submissions = data.get("recentAcSubmissionList")
        if submissions is None:
            return []
        return submissions  # type: ignore[return-value]
