"""Content fetchers — auto-registered on import."""

from pycore import logger

from fetchers._registry import fetcher_registry as fetchers

log = logger("fetchers")

# Import order = registration order. Specific first, generic last.
from fetchers.weixin import WeixinFetcher  # noqa: E402, F401
from fetchers.feishu import FeishuFetcher  # noqa: E402, F401
from fetchers.jina import JinaFetcher  # noqa: E402, F401


def fetch(url: str) -> str | None:
    """Dispatch to the first fetcher that can handle the URL."""
    handler = fetchers.find(lambda f: f.can_handle(url))
    if not handler:
        log.warning("No fetcher matched", url=url[:80])
        return None
    log.info("Dispatching", fetcher=handler.name, url=url[:80])
    result = handler.fetch(url)
    return result.content if result else None
