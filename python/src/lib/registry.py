"""Simple typed registry for fetchers/writers/pipelines."""

from __future__ import annotations

from typing import Any


class Registry:
    """A registry that stores instances by name."""

    def __init__(self, kind: str) -> None:
        self._kind = kind
        self._items: dict[str, Any] = {}
        self._ordered: list[Any] = []

    def register(self, cls: type) -> type:
        """Decorator to register a class."""
        instance = cls()
        name = getattr(instance, "name", cls.__name__)
        self._items[name] = instance
        self._ordered.append(instance)
        return cls

    def get(self, name: str) -> Any | None:
        return self._items.get(name)

    def find(self, predicate: Any) -> Any | None:
        for item in self._ordered:
            if predicate(item):
                return item
        return None
