"""Fetch a feed body over HTTP with timeouts, redirects and a size cap."""

from dataclasses import dataclass

import httpx

from hypersignal_api.errors import FeedTooLargeError, UpstreamError, UpstreamTimeoutError


@dataclass(frozen=True, slots=True)
class FetchedFeed:
    body: bytes
    content_type: str
    final_url: str


async def fetch_feed(client: httpx.AsyncClient, url: str, *, max_bytes: int) -> FetchedFeed:
    """Download ``url`` using the shared client. Raises a ``FeedError`` subclass on failure."""
    try:
        async with client.stream("GET", url) as response:
            if response.status_code >= 400:
                raise UpstreamError(f"Upstream responded with HTTP {response.status_code}")
            declared = response.headers.get("content-length")
            if declared and declared.isdigit() and int(declared) > max_bytes:
                raise FeedTooLargeError(f"Feed is larger than {max_bytes} bytes")
            body = bytearray()
            async for chunk in response.aiter_bytes():
                body += chunk
                if len(body) > max_bytes:
                    raise FeedTooLargeError(f"Feed is larger than {max_bytes} bytes")
            return FetchedFeed(
                body=bytes(body),
                content_type=response.headers.get("content-type", ""),
                final_url=str(response.url),
            )
    except httpx.TimeoutException as exc:
        raise UpstreamTimeoutError("Timed out while fetching the feed") from exc
    except httpx.TooManyRedirects as exc:
        raise UpstreamError("Feed URL redirected too many times") from exc
    except httpx.HTTPError as exc:
        raise UpstreamError(f"Could not fetch the feed ({exc.__class__.__name__})") from exc
