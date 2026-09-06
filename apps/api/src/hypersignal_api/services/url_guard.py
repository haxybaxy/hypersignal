"""Server-side request forgery (SSRF) guard for user-supplied feed URLs.

The guard is applied twice: once as a cheap syntax check before any I/O, and again as an
httpx request hook so every redirect hop is validated against the same rules.

Known limitation: the host is resolved here and again by the transport when connecting, so a
DNS rebinding between the two lookups is not detected. Acceptable for a personal tool.
"""

import ipaddress
import socket
from collections.abc import Awaitable, Callable, Sequence
from urllib.parse import urlsplit

import anyio
import httpx

from hypersignal_api.errors import BlockedUrlError, InvalidFeedUrlError

IPAddress = ipaddress.IPv4Address | ipaddress.IPv6Address

MAX_URL_LENGTH = 2048
ALLOWED_SCHEMES = frozenset({"http", "https"})


def validate_url_syntax(url: str, allowed_hosts: Sequence[str] = ()) -> str:
    """Check scheme, length, credentials and allowlist. Returns the hostname."""
    if len(url) > MAX_URL_LENGTH:
        raise InvalidFeedUrlError(f"URL is longer than {MAX_URL_LENGTH} characters")
    parts = urlsplit(url)
    if parts.scheme.lower() not in ALLOWED_SCHEMES:
        raise InvalidFeedUrlError("Only http and https feed URLs are supported")
    host = parts.hostname
    if not host:
        raise InvalidFeedUrlError("Feed URL has no host")
    if parts.username or parts.password:
        raise InvalidFeedUrlError("Credentials in feed URLs are not supported")
    if allowed_hosts and not _host_allowed(host, allowed_hosts):
        raise BlockedUrlError(f"Host {host!r} is not in the allowed hosts list")
    return host


def _host_allowed(host: str, allowed_hosts: Sequence[str]) -> bool:
    host = host.lower().rstrip(".")
    for allowed in allowed_hosts:
        allowed = allowed.lower().rstrip(".")
        if host == allowed or host.endswith("." + allowed):
            return True
    return False


def is_public_address(ip: IPAddress) -> bool:
    """True when the address is globally routable and not a special-purpose range."""
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        ip = ip.ipv4_mapped
    return ip.is_global and not ip.is_multicast


async def resolve_host(host: str) -> list[IPAddress]:
    """Resolve a hostname (or IP literal) to the addresses a connection could use."""
    try:
        return [ipaddress.ip_address(host.strip("[]"))]
    except ValueError:
        pass
    try:
        infos = await anyio.getaddrinfo(host, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise InvalidFeedUrlError(f"Could not resolve host {host!r}") from exc
    addresses: list[IPAddress] = []
    for info in infos:
        raw = str(info[4][0]).split("%", 1)[0]  # drop IPv6 zone id
        addresses.append(ipaddress.ip_address(raw))
    if not addresses:
        raise InvalidFeedUrlError(f"Could not resolve host {host!r}")
    return addresses


async def assert_public_host(host: str) -> None:
    """Raise ``BlockedUrlError`` when any resolved address is non-public."""
    for ip in await resolve_host(host):
        if not is_public_address(ip):
            raise BlockedUrlError(f"Host {host!r} resolves to a non-public address")


def make_request_guard(
    allowed_hosts: Sequence[str],
) -> Callable[[httpx.Request], Awaitable[None]]:
    """Build an httpx request hook that validates every outgoing request (including redirects)."""

    async def guard(request: httpx.Request) -> None:
        host = validate_url_syntax(str(request.url), allowed_hosts)
        await assert_public_host(host)

    return guard
