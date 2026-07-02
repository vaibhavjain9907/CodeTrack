"""
Tests for LeetCodeClient.

These use mocked HTTP responses, NOT live calls to leetcode.com — this
sandbox's network egress allowlist does not include leetcode.com, so
the actual live integration is unverified by automated tests here.
Response fixtures below are constructed from LeetCode's documented
public GraphQL schema (matchedUser / submitStatsGlobal /
recentAcSubmissionList), cross-checked against multiple third-party
LeetCode API wrapper projects' published response examples — but if
LeetCode changes its schema, these tests will not catch that until
someone runs this against the real endpoint.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.integrations.leetcode_client import (
    LeetCodeAPIError,
    LeetCodeClient,
    LeetCodeUserNotFoundError,
)

_VALID_PROFILE_RESPONSE = {
    "data": {
        "matchedUser": {
            "username": "testuser",
            "profile": {
                "realName": "Test User",
                "userAvatar": "https://example.com/avatar.png",
                "ranking": 12345,
            },
            "submitStats": {
                "acSubmissionNum": [
                    {"difficulty": "All", "count": 100},
                    {"difficulty": "Easy", "count": 50},
                    {"difficulty": "Medium", "count": 40},
                    {"difficulty": "Hard", "count": 10},
                ]
            },
            "contributions": {"points": 500},
        },
        "allQuestionsCount": [
            {"difficulty": "All", "count": 3000},
            {"difficulty": "Easy", "count": 800},
            {"difficulty": "Medium", "count": 1600},
            {"difficulty": "Hard", "count": 600},
        ],
    },
    "errors": None,
}

_USER_NOT_FOUND_RESPONSE = {"data": {"matchedUser": None}, "errors": None}

_RECENT_SUBMISSIONS_RESPONSE = {
    "data": {
        "recentAcSubmissionList": [
            {
                "id": "123456",
                "title": "Two Sum",
                "titleSlug": "two-sum",
                "timestamp": "1719500000",
                "statusDisplay": "Accepted",
                "lang": "python3",
            }
        ]
    },
    "errors": None,
}


def _mock_response(json_body: dict[str, object], status_code: int = 200) -> MagicMock:
    mock_resp = MagicMock()
    mock_resp.status_code = status_code
    mock_resp.json.return_value = json_body
    mock_resp.text = str(json_body)
    return mock_resp


@pytest.mark.asyncio
async def test_fetch_profile_success() -> None:
    client = LeetCodeClient()
    with patch(
        "httpx.AsyncClient.post", new=AsyncMock(return_value=_mock_response(_VALID_PROFILE_RESPONSE))
    ):
        data = await client.fetch_profile("testuser")

    matched_user = data["matchedUser"]
    assert matched_user["username"] == "testuser"
    assert matched_user["submitStats"]["acSubmissionNum"][0]["count"] == 100


@pytest.mark.asyncio
async def test_fetch_profile_user_not_found() -> None:
    client = LeetCodeClient()
    with patch(
        "httpx.AsyncClient.post",
        new=AsyncMock(return_value=_mock_response(_USER_NOT_FOUND_RESPONSE)),
    ):
        with pytest.raises(LeetCodeUserNotFoundError):
            await client.fetch_profile("does-not-exist")


@pytest.mark.asyncio
async def test_fetch_profile_http_error() -> None:
    client = LeetCodeClient()
    with patch(
        "httpx.AsyncClient.post",
        new=AsyncMock(return_value=_mock_response({}, status_code=500)),
    ):
        with pytest.raises(LeetCodeAPIError):
            await client.fetch_profile("testuser")


@pytest.mark.asyncio
async def test_fetch_profile_graphql_error() -> None:
    client = LeetCodeClient()
    error_response = {"data": None, "errors": [{"message": "Rate limited"}]}
    with patch(
        "httpx.AsyncClient.post", new=AsyncMock(return_value=_mock_response(error_response))
    ):
        with pytest.raises(LeetCodeAPIError):
            await client.fetch_profile("testuser")


@pytest.mark.asyncio
async def test_fetch_recent_submissions_success() -> None:
    client = LeetCodeClient()
    with patch(
        "httpx.AsyncClient.post",
        new=AsyncMock(return_value=_mock_response(_RECENT_SUBMISSIONS_RESPONSE)),
    ):
        submissions = await client.fetch_recent_submissions("testuser", limit=20)

    assert len(submissions) == 1
    assert submissions[0]["titleSlug"] == "two-sum"


@pytest.mark.asyncio
async def test_fetch_recent_submissions_empty() -> None:
    client = LeetCodeClient()
    empty_response = {"data": {"recentAcSubmissionList": None}, "errors": None}
    with patch(
        "httpx.AsyncClient.post", new=AsyncMock(return_value=_mock_response(empty_response))
    ):
        submissions = await client.fetch_recent_submissions("testuser")

    assert submissions == []
