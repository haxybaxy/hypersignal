import time
from datetime import UTC, datetime
from pathlib import Path

import pytest

from hypersignal_api.errors import UnparseableFeedError
from hypersignal_api.services import feed_parser
from hypersignal_api.services.html_text import extract_text, truncate

FIXTURES = Path(__file__).parent / "fixtures"


def test_extract_text_strips_tags_scripts_and_entities() -> None:
    html = (
        "<div><p>Hello &amp; <b>world</b></p>"
        '<script>alert("x")</script><style>p{}</style>tail</div>'
    )
    text, image = extract_text(html)
    assert text == "Hello & world tail"
    assert image is None


def test_extract_text_returns_first_image() -> None:
    html = '<p>a</p><img src=" https://img.test/1.png "><img src="https://img.test/2.png">'
    text, image = extract_text(html)
    assert text == "a"
    assert image == "https://img.test/1.png"


def test_truncate_prefers_word_boundary() -> None:
    text = "word " * 200
    result = truncate(text.strip(), 50)
    assert len(result) <= 51
    assert result.endswith("…")
    assert not result[:-1].endswith(" ")


def test_truncate_leaves_short_text_alone() -> None:
    assert truncate("short", 50) == "short"


def test_to_datetime_converts_struct_time_to_utc() -> None:
    value = time.struct_time((2026, 9, 6, 12, 30, 0, 6, 249, 0))
    assert feed_parser._to_datetime(value) == datetime(2026, 9, 6, 12, 30, tzinfo=UTC)


@pytest.mark.parametrize("value", [None, "2026-09-06", 1234])
def test_to_datetime_rejects_non_struct_time(value: object) -> None:
    assert feed_parser._to_datetime(value) is None


def test_summary_falls_back_to_content_when_summary_missing() -> None:
    entry = {"title": "t", "content": [{"value": "<p>from <i>content</i></p>"}]}
    item = feed_parser._to_item(entry)
    assert item.summary == "from content"


def test_media_thumbnail_wins_over_media_content_and_inline_image() -> None:
    entry = {
        "title": "t",
        "summary": '<img src="https://img.test/inline.png">',
        "media_content": [{"url": "https://img.test/content.jpg", "medium": "image"}],
        "media_thumbnail": [{"url": "https://img.test/thumb.jpg"}],
    }
    assert feed_parser._to_item(entry).image_url == "https://img.test/thumb.jpg"


def test_non_image_enclosures_are_ignored() -> None:
    entry = {
        "title": "t",
        "enclosures": [{"href": "https://cdn.test/episode.mp3", "type": "audio/mpeg"}],
    }
    assert feed_parser._to_item(entry).image_url is None


def test_entry_id_falls_back_to_link_then_hash() -> None:
    assert feed_parser._to_item({"title": "t", "link": "https://x.test/1"}).id == "https://x.test/1"
    hashed = feed_parser._to_item({"title": "t"}).id
    assert len(hashed) == 40
    assert feed_parser._to_item({"title": "t"}).id == hashed


def test_untitled_entries_get_a_placeholder_title() -> None:
    assert feed_parser._to_item({}).title == "(untitled)"


def test_parse_feed_sync_reads_rss_bytes() -> None:
    raw = (FIXTURES / "rss_app_sample.xml").read_bytes()
    feed = feed_parser.parse_feed_sync(
        raw, "application/rss+xml", "https://feeds.example.test/rss.xml"
    )
    assert feed.title == "Paul Graham on X"
    assert len(feed.items) == 3


def test_parse_feed_sync_rejects_non_feed_content() -> None:
    with pytest.raises(UnparseableFeedError):
        feed_parser.parse_feed_sync(b"plain text, not xml", "text/plain", "https://x.test")


def test_parse_feed_sync_uses_url_as_title_fallback() -> None:
    raw = (
        b'<?xml version="1.0"?><rss version="2.0"><channel>'
        b"<item><title>x</title></item></channel></rss>"
    )
    feed = feed_parser.parse_feed_sync(raw, "", "https://x.test/feed")
    assert feed.title == "https://x.test/feed"
