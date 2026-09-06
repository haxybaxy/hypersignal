"""FastAPI dependencies that expose objects created in the app lifespan to route handlers."""

from typing import Annotated

import httpx
from fastapi import Depends, Request

from hypersignal_api.config import Settings
from hypersignal_api.services.cache import FeedCache


async def get_settings(request: Request) -> Settings:
    settings: Settings = request.app.state.settings
    return settings


async def get_http_client(request: Request) -> httpx.AsyncClient:
    client: httpx.AsyncClient = request.app.state.http_client
    return client


async def get_feed_cache(request: Request) -> FeedCache:
    cache: FeedCache = request.app.state.feed_cache
    return cache


SettingsDep = Annotated[Settings, Depends(get_settings)]
HttpClientDep = Annotated[httpx.AsyncClient, Depends(get_http_client)]
FeedCacheDep = Annotated[FeedCache, Depends(get_feed_cache)]
