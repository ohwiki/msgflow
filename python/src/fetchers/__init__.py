"""Content fetchers — auto-registered on import."""

from pycore.registry import Registry

fetchers: Registry = Registry("fetcher")

from fetchers.jina import JinaFetcher  # noqa: E402, F401
from fetchers.weixin import WeixinFetcher  # noqa: E402, F401
from fetchers.feishu import FeishuFetcher  # noqa: E402, F401


def fetch(url: str) -> str | None:
    """Dispatch to the first fetcher that can handle the URL."""
    handler = fetchers.find(lambda f: f.can_handle(url))
    if handler:
        result = handler.fetch(url)
        return result.content if result else None
    return None
