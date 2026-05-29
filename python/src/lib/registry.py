"""Typed registry for fetchers/writers/pipelines."""
from __future__ import annotations

from typing import TypeVar, Generic, Callable

T = TypeVar("T")


class Registry(Generic[T]):
    """A typed registry that stores instances by name."""

    def __init__(self, kind: str) -> None:
        self._kind = kind
        self._items: dict[str, T] = {}
        self._ordered: list[T] = []

    def register(self, cls: type) -> type:
        """Decorator to register a class."""
        instance = cls()
        name = getattr(instance, "name", cls.__name__)
        self._items[name] = instance
        self._ordered.append(instance)
        return cls

    def get(self, name: str) -> T | None:
        return self._items.get(name)

    def find(self, predicate: Callable[[T], bool]) -> T | None:
        for item in self._ordered:
            if predicate(item):
                return item
        return None
