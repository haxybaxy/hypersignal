"""Pydantic models for the public API. Serialized as camelCase JSON."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        serialize_by_alias=True,
    )


class FeedItem(ApiModel):
    id: str
    title: str
    link: str | None = None
    summary: str = ""
    published: datetime | None = None
    author: str | None = None
    image_url: str | None = None


class FeedResponse(ApiModel):
    title: str
    link: str | None = None
    fetched_at: datetime
    items: list[FeedItem]


class HealthResponse(ApiModel):
    status: str


class ErrorResponse(ApiModel):
    detail: str
