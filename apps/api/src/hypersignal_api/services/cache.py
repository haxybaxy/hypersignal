"""In-memory TTL cache with per-key single-flight so concurrent panels share one upstream fetch."""

import asyncio
import logging
import time
from collections.abc import Awaitable, Callable

from hypersignal_api.schemas import FeedResponse

logger = logging.getLogger(__name__)


class FeedCache:
    def __init__(self, ttl_seconds: float, *, clock: Callable[[], float] = time.monotonic) -> None:
        self._ttl = ttl_seconds
        self._clock = clock
        self._entries: dict[str, tuple[float, FeedResponse]] = {}
        self._locks: dict[str, asyncio.Lock] = {}

    def get(self, key: str) -> FeedResponse | None:
        entry = self._entries.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at <= self._clock():
            self._entries.pop(key, None)
            return None
        return value

    def set(self, key: str, value: FeedResponse) -> None:
        if self._ttl <= 0:
            return
        self._entries[key] = (self._clock() + self._ttl, value)

    def clear(self) -> None:
        self._entries.clear()

    def __len__(self) -> int:
        return len(self._entries)

    async def get_or_fetch(
        self, key: str, fetch: Callable[[], Awaitable[FeedResponse]]
    ) -> FeedResponse:
        cached = self.get(key)
        if cached is not None:
            logger.debug("cache hit for %s", key)
            return cached
        lock = self._locks.setdefault(key, asyncio.Lock())
        try:
            async with lock:
                cached = self.get(key)
                if cached is not None:
                    logger.debug("cache hit (after wait) for %s", key)
                    return cached
                logger.debug("cache miss for %s", key)
                value = await fetch()
                self.set(key, value)
                return value
        finally:
            if not lock.locked():
                self._locks.pop(key, None)
