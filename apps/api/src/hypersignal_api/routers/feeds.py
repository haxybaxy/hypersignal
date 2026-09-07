from typing import Annotated, Any

from fastapi import APIRouter, Query

from hypersignal_api.dependencies import FeedCacheDep, HttpClientDep, SettingsDep
from hypersignal_api.schemas import ErrorResponse, FeedResponse
from hypersignal_api.services.feed_fetcher import fetch_feed
from hypersignal_api.services.feed_parser import parse_feed
from hypersignal_api.services.url_guard import validate_url_syntax

router = APIRouter(prefix="/api", tags=["feeds"])

_ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    400: {"model": ErrorResponse, "description": "Invalid or blocked feed URL"},
    502: {"model": ErrorResponse, "description": "Upstream feed could not be fetched or parsed"},
    504: {"model": ErrorResponse, "description": "Upstream feed timed out"},
}


@router.get("/feed", response_model=FeedResponse, responses=_ERROR_RESPONSES)
async def get_feed(
    url: Annotated[str, Query(min_length=1, description="Public RSS or Atom feed URL")],
    settings: SettingsDep,
    client: HttpClientDep,
    cache: FeedCacheDep,
) -> FeedResponse:
    """Fetch, parse and cache a feed. The host check runs inside the HTTP client on every hop."""
    feed_url = url.strip()
    validate_url_syntax(feed_url, settings.feed_allowed_hosts)

    async def load() -> FeedResponse:
        fetched = await fetch_feed(client, feed_url, max_bytes=settings.feed_max_bytes)
        return await parse_feed(fetched.body, fetched.content_type, feed_url)

    return await cache.get_or_fetch(feed_url, load)
