from collections.abc import AsyncIterator
from pathlib import Path

import httpx
import pytest
import respx

from tests.conftest import make_client, make_settings

pytestmark = pytest.mark.anyio

FIXTURES = Path(__file__).parent / "fixtures"
FEED_URL = "https://feeds.example.test/rss.xml"
RSS_HEADERS = {"content-type": "application/rss+xml; charset=utf-8"}


def rss_response() -> httpx.Response:
    return httpx.Response(
        200, content=(FIXTURES / "rss_app_sample.xml").read_bytes(), headers=RSS_HEADERS
    )


async def test_rss_feed_is_normalized(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(return_value=rss_response())

    response = await client.get("/api/feed", params={"url": FEED_URL})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Paul Graham on X"
    assert body["link"] == "https://x.com/paulg"
    assert body["fetchedAt"].endswith("Z")
    assert [item["id"] for item in body["items"]] == [
        "rss-app-item-1",
        "rss-app-item-2",
        "https://x.com/paulg/status/3333",
    ]

    first, second, third = body["items"]
    assert set(first) == {"id", "title", "link", "summary", "published", "author", "imageUrl"}
    assert first["title"] == "The best startup ideas look like toys at first"
    assert first["summary"] == "The best startup ideas look like toys at first."
    assert first["published"] == "2026-09-06T12:30:00Z"
    assert first["author"] == "Paul Graham"
    assert first["imageUrl"] == "https://media.example.test/img1.jpg"

    assert second["title"] == "Second post & a link"
    assert second["imageUrl"] == "https://media.example.test/inline2.png"

    assert third["published"] is None
    assert third["imageUrl"] is None
    assert third["author"] is None


async def test_atom_feed_is_normalized(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    atom_url = "https://other.example.test/atom.xml"
    respx_mock.get(atom_url).mock(
        return_value=httpx.Response(
            200,
            content=(FIXTURES / "atom_sample.xml").read_bytes(),
            headers={"content-type": "application/atom+xml"},
        )
    )

    response = await client.get("/api/feed", params={"url": atom_url})

    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Hacker News: Front Page"
    assert body["link"] == "https://news.ycombinator.com/"
    first, second = body["items"]
    assert first["link"] == "https://example.test/hypersignal"
    assert first["published"] == "2026-09-06T14:00:00Z"
    assert first["author"] == "haxybaxy"
    assert first["summary"] == "Article URL: https://example.test/hypersignal Points: 120"
    assert second["summary"] == "Discussion thread."


async def test_second_request_is_served_from_cache(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    route = respx_mock.get(FEED_URL).mock(return_value=rss_response())

    first = await client.get("/api/feed", params={"url": FEED_URL})
    second = await client.get("/api/feed", params={"url": f"  {FEED_URL}  "})

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert route.call_count == 1


async def test_cache_is_bypassed_when_ttl_is_zero(respx_mock: respx.MockRouter) -> None:
    route = respx_mock.get(FEED_URL).mock(return_value=rss_response())
    async with make_client(make_settings(feed_cache_ttl_seconds=0)) as client:
        await client.get("/api/feed", params={"url": FEED_URL})
        await client.get("/api/feed", params={"url": FEED_URL})
    assert route.call_count == 2


@pytest.mark.parametrize(
    "url",
    [
        "http://private.test/feed.xml",
        "http://localhost:8000/api/health",
        "http://127.0.0.1/feed",
        "http://[::1]/feed",
        "http://mapped.test/feed",
        "http://169.254.169.254/latest/meta-data",
        "http://0.0.0.0/feed",
    ],
)
async def test_non_public_hosts_are_blocked(client: httpx.AsyncClient, url: str) -> None:
    response = await client.get("/api/feed", params={"url": url})
    assert response.status_code == 400
    assert "non-public" in response.json()["detail"]


@pytest.mark.parametrize(
    "url",
    [
        "ftp://feeds.example.test/rss.xml",
        "file:///etc/passwd",
        "not a url",
        "https://user:secret@feeds.example.test/rss.xml",
        "https://unknown.example.test/rss.xml",
        "https://feeds.example.test/" + "a" * 2100,
    ],
)
async def test_invalid_urls_are_rejected(client: httpx.AsyncClient, url: str) -> None:
    response = await client.get("/api/feed", params={"url": url})
    assert response.status_code == 400
    assert response.json()["detail"]


async def test_missing_url_param_is_a_validation_error(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/feed")
    assert response.status_code == 422


async def test_allowlist_limits_hosts(respx_mock: respx.MockRouter) -> None:
    respx_mock.get("https://rss.app/feeds/abc.xml").mock(return_value=rss_response())
    async with make_client(make_settings(feed_allowed_hosts=["rss.app"])) as client:
        blocked = await client.get("/api/feed", params={"url": FEED_URL})
        allowed = await client.get("/api/feed", params={"url": "https://rss.app/feeds/abc.xml"})
    assert blocked.status_code == 400
    assert "allowed hosts" in blocked.json()["detail"]
    assert allowed.status_code == 200


async def test_redirect_to_private_host_is_blocked(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(
        return_value=httpx.Response(302, headers={"location": "http://private.test/feed.xml"})
    )
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 400
    assert "non-public" in response.json()["detail"]


async def test_redirect_to_public_host_is_followed(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    target = "https://other.example.test/rss.xml"
    respx_mock.get(FEED_URL).mock(return_value=httpx.Response(301, headers={"location": target}))
    respx_mock.get(target).mock(return_value=rss_response())
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 200
    assert len(response.json()["items"]) == 3


async def test_upstream_error_maps_to_502(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(return_value=httpx.Response(500))
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 502
    assert "HTTP 500" in response.json()["detail"]


async def test_upstream_timeout_maps_to_504(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(side_effect=httpx.ReadTimeout("slow upstream"))
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 504


async def test_connection_error_maps_to_502(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(side_effect=httpx.ConnectError("refused"))
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 502


async def test_declared_oversize_body_is_rejected(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(
        return_value=httpx.Response(200, content=b"<rss>" + b"x" * (64 * 1024 + 1))
    )
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 502
    assert "larger" in response.json()["detail"]


class _EndlessStream(httpx.AsyncByteStream):
    async def __aiter__(self) -> AsyncIterator[bytes]:
        for _ in range(1000):
            yield b"<item>" + b"y" * 1024 + b"</item>"


async def test_streamed_oversize_body_is_rejected(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(return_value=httpx.Response(200, stream=_EndlessStream()))
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 502
    assert "larger" in response.json()["detail"]


async def test_unparseable_body_maps_to_502(
    client: httpx.AsyncClient, respx_mock: respx.MockRouter
) -> None:
    respx_mock.get(FEED_URL).mock(
        return_value=httpx.Response(200, text="<html><body>not a feed</body></html>")
    )
    response = await client.get("/api/feed", params={"url": FEED_URL})
    assert response.status_code == 502
    assert "readable" in response.json()["detail"]
