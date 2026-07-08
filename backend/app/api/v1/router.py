"""
Aggregates all v1 endpoint routers into a single APIRouter.

Each feature module (auth, users, leetcode, codeforces, etc.) registers
its own router here as it is built.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import analytics, auth, codeforces, dashboard, goals, leetcode

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(leetcode.router, prefix="/leetcode", tags=["leetcode"])
api_router.include_router(codeforces.router, prefix="/codeforces", tags=["codeforces"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
