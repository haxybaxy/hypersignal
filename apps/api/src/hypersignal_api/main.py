"""Application factory. ``app`` is the ASGI entry point used by uvicorn."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from hypersignal_api import __version__
from hypersignal_api.config import Settings
from hypersignal_api.errors import FeedError
from hypersignal_api.routers import feeds, health
from hypersignal_api.services.cache import FeedCache
from hypersignal_api.services.url_guard import make_request_guard

logger = logging.getLogger(__name__)

_ACCEPT = (
    "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, */*;q=0.8"
)


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings if settings is not None else Settings()
    logging.basicConfig(
        level=resolved.log_level.upper(),
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        # Objects live on app.state so they are reachable from any request, including
        # requests issued through test transports that do not forward lifespan state.
        async with httpx.AsyncClient(
            follow_redirects=True,
            max_redirects=3,
            timeout=httpx.Timeout(resolved.feed_timeout_seconds, connect=5.0),
            headers={"User-Agent": resolved.user_agent, "Accept": _ACCEPT},
            event_hooks={"request": [make_request_guard(resolved.feed_allowed_hosts)]},
        ) as client:
            app.state.settings = resolved
            app.state.http_client = client
            app.state.feed_cache = FeedCache(resolved.feed_cache_ttl_seconds)
            yield

    app = FastAPI(
        title="Hypersignal API",
        version=__version__,
        lifespan=lifespan,
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        redoc_url=None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=resolved.cors_origins,
        allow_methods=["GET"],
        allow_headers=["*"],
    )
    app.add_exception_handler(FeedError, _feed_error_handler)
    app.include_router(health.router)
    app.include_router(feeds.router)
    return app


async def _feed_error_handler(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, FeedError)
    logger.info("feed error %s for %s: %s", exc.status_code, request.url, exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


app = create_app()
