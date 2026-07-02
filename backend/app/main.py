"""
Application entry point.

Creates the FastAPI app instance, configures middleware (CORS),
wires startup/shutdown lifespan events, and mounts the versioned
API router. Run with:

    uvicorn app.main:app --reload
"""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.db.session import engine

logger = logging.getLogger("codetrack")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """
    Manages startup and shutdown behavior for the application.

    Startup: verifies the database is reachable before accepting
    traffic. This makes deployment failures (e.g. wrong DATABASE_URL,
    Postgres not ready yet) visible immediately in container logs
    instead of surfacing as confusing 500s on the first real request.

    Shutdown: disposes the SQLAlchemy connection pool cleanly so no
    connections are left dangling when the process exits.
    """
    logger.info("Starting %s (%s)", settings.PROJECT_NAME, settings.ENVIRONMENT)
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection verified.")
    except Exception:
        logger.exception(
            "Database connectivity check failed during startup. "
            "Verify DATABASE_URL and that the database is reachable."
        )
        raise

    yield

    logger.info("Shutting down %s — disposing DB connection pool.", settings.PROJECT_NAME)
    engine.dispose()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )

    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    register_exception_handlers(app)

    # NOTE on "authentication middleware": CodeTrack deliberately does
    # NOT use a blanket ASGI/HTTP middleware that inspects every
    # request for a JWT. A global middleware would need an explicit
    # allowlist of public paths (/health, /auth/register, /auth/login,
    # /auth/refresh, the OpenAPI docs) and that allowlist silently
    # rots as new public endpoints are added. Instead, route protection
    # is enforced per-endpoint via the `get_current_user` /
    # `require_admin` FastAPI dependencies (see app/api/deps.py),
    # which is the documented, idiomatic FastAPI pattern: a route is
    # protected if and only if it declares the dependency, which is
    # visible directly in its signature — there is no separate list to
    # keep in sync.

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.get("/health", tags=["health"])
    def health_check() -> dict[str, str]:
        """Liveness probe used by Docker/Kubernetes/load balancers."""
        return {"status": "ok", "service": settings.PROJECT_NAME}

    return app


app = create_application()
