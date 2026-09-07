"""Domain errors raised by the feed pipeline. Each maps to an HTTP status."""


class FeedError(Exception):
    """Base class for feed pipeline failures."""

    status_code = 502

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class InvalidFeedUrlError(FeedError):
    """The URL is malformed or uses an unsupported scheme."""

    status_code = 400


class BlockedUrlError(FeedError):
    """The URL points at a host the proxy refuses to contact."""

    status_code = 400


class UpstreamError(FeedError):
    """The upstream server could not be reached or answered with an error."""

    status_code = 502


class UpstreamTimeoutError(FeedError):
    """The upstream server did not answer in time."""

    status_code = 504


class FeedTooLargeError(FeedError):
    """The upstream body exceeded the configured size limit."""

    status_code = 502


class UnparseableFeedError(FeedError):
    """The upstream body is not a recognizable RSS/Atom document."""

    status_code = 502
