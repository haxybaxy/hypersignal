"""Normalize an RSS/Atom document into the API's ``FeedResponse`` shape."""

import calendar
import hashlib
import io
import time
from collections.abc import Mapping
from datetime import UTC, datetime
from typing import Any

import anyio
import feedparser

from hypersignal_api.errors import UnparseableFeedError
from hypersignal_api.schemas import FeedItem, FeedResponse
from hypersignal_api.services.html_text import extract_text, truncate

SUMMARY_LIMIT = 500
_IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif")


async def parse_feed(raw: bytes, content_type: str, feed_url: str) -> FeedResponse:
    """Parse in a worker thread; feedparser is synchronous and CPU-bound."""
    return await anyio.to_thread.run_sync(parse_feed_sync, raw, content_type, feed_url)


def parse_feed_sync(raw: bytes, content_type: str, feed_url: str) -> FeedResponse:
    headers = {"content-type": content_type} if content_type else {}
    # A file-like object keeps feedparser from treating the input as a path or URL.
    parsed = feedparser.parse(io.BytesIO(raw), response_headers=headers)
    entries: list[Mapping[str, Any]] = list(parsed.get("entries", []))
    if not entries and parsed.get("bozo"):
        raise UnparseableFeedError("The URL did not return a readable RSS or Atom feed")
    meta: Mapping[str, Any] = parsed.get("feed", {})
    title, _ = extract_text(str(meta.get("title") or ""))
    return FeedResponse(
        title=title or feed_url,
        link=_clean_str(meta.get("link")),
        fetched_at=datetime.now(UTC),
        items=[_to_item(entry) for entry in entries],
    )


def _to_item(entry: Mapping[str, Any]) -> FeedItem:
    title, _ = extract_text(str(entry.get("title") or ""))
    link = _clean_str(entry.get("link"))
    summary_html = str(entry.get("summary") or _first_content(entry) or "")
    summary, inline_image = extract_text(summary_html)
    published = _to_datetime(entry.get("published_parsed") or entry.get("updated_parsed"))
    image_url = _media_image(entry) or inline_image
    return FeedItem(
        id=_entry_id(entry, link=link, title=title, published=published),
        title=title or "(untitled)",
        link=link,
        summary=truncate(summary, SUMMARY_LIMIT),
        published=published,
        author=_clean_str(entry.get("author")),
        image_url=image_url,
    )


def _first_content(entry: Mapping[str, Any]) -> str | None:
    for block in entry.get("content") or []:
        value = block.get("value") if isinstance(block, Mapping) else None
        if value:
            return str(value)
    return None


def _to_datetime(value: Any) -> datetime | None:
    if not isinstance(value, time.struct_time):
        return None
    try:
        return datetime.fromtimestamp(calendar.timegm(value), tz=UTC)
    except (OverflowError, OSError, ValueError):
        return None


def _media_image(entry: Mapping[str, Any]) -> str | None:
    for thumb in entry.get("media_thumbnail") or []:
        url = _clean_str(thumb.get("url")) if isinstance(thumb, Mapping) else None
        if url:
            return url
    for media in entry.get("media_content") or []:
        if not isinstance(media, Mapping):
            continue
        url = _clean_str(media.get("url"))
        if url and _looks_like_image(url, media.get("type"), media.get("medium")):
            return url
    for enclosure in entry.get("enclosures") or []:
        if not isinstance(enclosure, Mapping):
            continue
        url = _clean_str(enclosure.get("href"))
        if url and _looks_like_image(url, enclosure.get("type"), None):
            return url
    return None


def _looks_like_image(url: str, mime: Any, medium: Any) -> bool:
    if isinstance(mime, str) and mime:
        return mime.lower().startswith("image/")
    if isinstance(medium, str) and medium:
        return medium.lower() == "image"
    return url.lower().split("?", 1)[0].endswith(_IMAGE_EXTENSIONS)


def _entry_id(
    entry: Mapping[str, Any], *, link: str | None, title: str, published: datetime | None
) -> str:
    explicit = _clean_str(entry.get("id"))
    if explicit:
        return explicit
    if link:
        return link
    digest = hashlib.sha1(f"{title}|{published}".encode(), usedforsecurity=False)
    return digest.hexdigest()


def _clean_str(value: Any) -> str | None:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or None
    return None
