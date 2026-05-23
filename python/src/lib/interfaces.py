"""Protocol interfaces for msgflow Python runtime."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

__all__ = ["FetchResult", "PublishResult", "PipelineResult", "Fetcher", "Publisher", "Pipeline"]


@dataclass
class FetchResult:
    content: str
    title: str = ""
    url: str = ""
    metadata: dict = field(default_factory=dict)


@dataclass
class PublishResult:
    success: bool
    url: str = ""
    error: str = ""


@dataclass
class PipelineResult:
    output: str
    success: bool = True
    artifacts: list[str] = field(default_factory=list)


class Fetcher(Protocol):
    """Content fetcher interface. Implement + register to add new sources."""

    name: str

    def can_handle(self, url: str) -> bool: ...
    def fetch(self, url: str) -> FetchResult | None: ...


class Publisher(Protocol):
    """Content publisher interface. Implement + register to add new targets."""

    name: str

    def publish(self, title: str, content: str, metadata: dict | None = None) -> PublishResult: ...


class Pipeline(Protocol):
    """Pipeline interface. Each pipeline orchestrates capabilities."""

    name: str

    def execute(self, target: str, **kwargs: object) -> PipelineResult: ...
