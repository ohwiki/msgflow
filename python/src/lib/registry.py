"""Decorator-based registry for fetchers, publishers, and pipelines."""

from __future__ import annotations

from typing import TypeVar

from lib.interfaces import Fetcher, FetchResult, Publisher, PublishResult, Pipeline

T = TypeVar("T")

FETCHERS: list[Fetcher] = []
PUBLISHERS: list[Publisher] = []
PIPELINES: dict[str, Pipeline] = {}


def register_fetcher(cls: type[T]) -> type[T]:
    """Register a Fetcher implementation."""
    FETCHERS.append(cls())  # type: ignore[arg-type]
    return cls


def register_publisher(cls: type[T]) -> type[T]:
    """Register a Publisher implementation."""
    PUBLISHERS.append(cls())  # type: ignore[arg-type]
    return cls


def register_pipeline(cls: type[T]) -> type[T]:
    """Register a Pipeline implementation."""
    instance = cls()
    PIPELINES[instance.name] = instance  # type: ignore[attr-defined]
    return cls


def dispatch_fetch(url: str) -> FetchResult | None:
    """Find the first fetcher that can handle the URL and fetch."""
    for f in FETCHERS:
        if f.can_handle(url):
            return f.fetch(url)
    return None


def dispatch_publish(
    publisher_name: str, title: str, content: str, metadata: dict | None = None
) -> PublishResult:
    """Publish to a named publisher."""
    for p in PUBLISHERS:
        if p.name == publisher_name:
            return p.publish(title, content, metadata)
    return PublishResult(success=False, error=f"Unknown publisher: {publisher_name}")
