"""Protocol definitions for fetchers, pipelines, publishers."""
from __future__ import annotations

from typing import Protocol

from pycore import Result


class Fetcher(Protocol):
    name: str

    def can_handle(self, url: str) -> bool: ...
    def fetch(self, url: str) -> str | None: ...


class Pipeline(Protocol):
    name: str

    def execute(self, target: str, **kwargs: object) -> Result: ...


class Publisher(Protocol):
    name: str

    def publish(self, title: str, content: str, metadata: dict | None = None) -> bool: ...
