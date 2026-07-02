"""
Tests for CodeforcesClient.

These use mocked HTTP responses, NOT live calls to codeforces.com.
Response fixtures are constructed from Codeforces's official public
API documentation (https://codeforces.com/apiHelp). Key behavior
under test: handle-not-found detection (string match in 'comment'),
WRONG_ANSWER submissions returned alongside OK ones (unlike LeetCode's
accepted-only public API), and unrated users returning empty rating
history without raising.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.integrations.codeforces_client import (
    CodeforcesAPIError,
    CodeforcesClient,
    CodeforcesHandleNotFoundError,
)

_VALID_USER_INFO = {
    "status": "OK",
    "result": [
        {
            "handle": "tourist",
            "avatar": "https://userpic.codeforces.com/422/title/50a270ed4a722867.jpg",
            "country": "Belarus",
            "organization": "",
            "contribution": 193,
            "rank": "legendary grandmaster",
            "rating": 3979,
            "maxRank": "legendary grandmaster",
            "maxRating": 4009,
        }
    ],
}

_NOT_FOUND = {
    "status": "FAILED",
    "comment": "handles: User with handle nonexistent-handle not found",
}

_RATE_LIMITED = {
    "status": "FAILED",
    "comment": "Call to API was rejected. Please try later.",
}

_VALID_SUBMISSIONS = {
    "status": "OK",
    "result": [
        {
            "id": 123456789,
            "contestId": 1900,
            "creationTimeSeconds": 1719500000,
            "relativeTimeSeconds": 2147483647,
            "problem": {"contestId": 1900, "index": "A", "name": "Cover in Water", "rating": 1200},
            "programmingLanguage": "GNU C++20 (64)",
            "verdict": "OK",
            "passedTestCount": 42,
            "timeConsumedMillis": 62,
            "memoryConsumedBytes": 3686400,
        },
        {
            "id": 123456700,
            "contestId": 1900,
            "creationTimeSeconds": 1719400000,
            "relativeTimeSeconds": 1000,
            "problem": {"contestId": 1900, "index": "B", "name": "M-divisible Array", "rating": 1800},
            "programmingLanguage": "GNU C++20 (64)",
            "verdict": "WRONG_ANSWER",
            "passedTestCount": 3,
            "timeConsumedMillis": 30,
            "memoryConsumedBytes": 2048000,
        },
    ],
}

_VALID_RATING = {
    "status": "OK",
    "result": [
        {
            "contestId": 1900,
            "contestName": "Codeforces Round 910 (Div. 1)",
            "handle": "tourist",
            "rank": 1,
            "ratingUpdateTimeSeconds": 1719500000,
            "oldRating": 3963,
            "newRating": 3979,
        }
    ],
}

_EMPTY_RATING = {"status": "OK", "result": []}


def _mock_resp(body: dict, status_code: int = 200) -> MagicMock:
    m = MagicMock()
    m.status_code = status_code
    m.json.return_value = body
    m.text = str(body)
    return m


@pytest.mark.asyncio
async def test_fetch_user_info_success() -> None:
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_VALID_USER_INFO))):
        info = await client.fetch_user_info("tourist")
    assert info["handle"] == "tourist"
    assert info["rating"] == 3979


@pytest.mark.asyncio
async def test_fetch_user_info_not_found() -> None:
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_NOT_FOUND))):
        with pytest.raises(CodeforcesHandleNotFoundError):
            await client.fetch_user_info("nonexistent-handle")


@pytest.mark.asyncio
async def test_fetch_user_info_rate_limited() -> None:
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_RATE_LIMITED))):
        with pytest.raises(CodeforcesAPIError):
            await client.fetch_user_info("tourist")


@pytest.mark.asyncio
async def test_fetch_user_info_http_error() -> None:
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp({}, 503))):
        with pytest.raises(CodeforcesAPIError):
            await client.fetch_user_info("tourist")


@pytest.mark.asyncio
async def test_fetch_submissions_returns_all_verdicts() -> None:
    """Codeforces returns all verdicts (WRONG_ANSWER, OK, etc.) unlike LeetCode."""
    client = CodeforcesClient()
    with patch(
        "httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_VALID_SUBMISSIONS))
    ):
        submissions = await client.fetch_submissions("tourist", count=50)
    assert len(submissions) == 2
    verdicts = [s["verdict"] for s in submissions]
    assert "OK" in verdicts
    assert "WRONG_ANSWER" in verdicts


@pytest.mark.asyncio
async def test_fetch_rating_history_success() -> None:
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_VALID_RATING))):
        history = await client.fetch_rating_history("tourist")
    assert len(history) == 1
    assert history[0]["contestName"] == "Codeforces Round 910 (Div. 1)"
    assert history[0]["newRating"] == 3979


@pytest.mark.asyncio
async def test_fetch_rating_history_unrated_user_returns_empty() -> None:
    """Unrated users return [] — not an error — which is verified explicitly here."""
    client = CodeforcesClient()
    with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=_mock_resp(_EMPTY_RATING))):
        history = await client.fetch_rating_history("unrated_user")
    assert history == []
