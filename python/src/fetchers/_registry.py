"""Fetcher registry instance + shared types."""

from dataclasses import dataclass

from lib.registry import Registry
from lib.protocols import Fetcher

fetcher_registry: Registry[Fetcher] = Registry("fetcher")


@dataclass
class FetchResult:
    content: str
    url: str = ""
