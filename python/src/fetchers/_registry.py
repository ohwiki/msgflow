"""Fetcher registry instance + shared types."""

from dataclasses import dataclass

from lib.registry import Registry

fetcher_registry: Registry = Registry("fetcher")


@dataclass
class FetchResult:
    content: str
    url: str = ""
