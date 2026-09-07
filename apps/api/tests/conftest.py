import ipaddress
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
import pytest
from asgi_lifespan import LifespanManager
from pydantic_settings import SettingsConfigDict

from hypersignal_api.config import Settings
from hypersignal_api.errors import InvalidFeedUrlError
from hypersignal_api.main import create_app
from hypersignal_api.services import url_guard

FAKE_DNS: dict[str, list[str]] = {
    "feeds.example.test": ["93.184.216.34"],
    "other.example.test": ["93.184.216.35"],
    "rss.app": ["104.18.0.1"],
    "private.test": ["10.0.0.5"],
    "localhost": ["127.0.0.1"],
    "mapped.test": ["::ffff:127.0.0.1"],
}


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture(autouse=True)
def fake_dns(monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace DNS resolution so tests never touch the network."""

    async def resolve(host: str) -> list[url_guard.IPAddress]:
        try:
            return [ipaddress.ip_address(host.strip("[]"))]
        except ValueError:
            pass
        if host in FAKE_DNS:
            return [ipaddress.ip_address(addr) for addr in FAKE_DNS[host]]
        raise InvalidFeedUrlError(f"Could not resolve host {host!r}")

    monkeypatch.setattr(url_guard, "resolve_host", resolve)


class TestSettings(Settings):
    """Settings that ignore any .env file so tests are hermetic."""

    __test__ = False
    model_config = SettingsConfigDict(env_file=None)


def make_settings(**overrides: object) -> Settings:
    values: dict[str, object] = {
        "cors_origins": ["http://testserver"],
        "feed_cache_ttl_seconds": 240,
        "feed_timeout_seconds": 2,
        "feed_max_bytes": 64 * 1024,
    }
    values.update(overrides)
    return TestSettings.model_validate(values)


@asynccontextmanager
async def make_client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app(settings)
    async with LifespanManager(app):
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
            yield client


@pytest.fixture
def settings() -> Settings:
    return make_settings()


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    async with make_client(settings) as client:
        yield client
