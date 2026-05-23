"""Jina Reader fetcher — general-purpose web content extraction."""

import os
import urllib.request
import urllib.error
from lib.interfaces import FetchResult
from lib.registry import register_fetcher
from lib.logger import get_logger

log = get_logger("fetcher.jina")


@register_fetcher
class JinaFetcher:
    name = "jina"

    def can_handle(self, url: str) -> bool:
        return url.startswith("http")

    def fetch(self, url: str) -> FetchResult | None:
        api_url = f"https://r.jina.ai/{url}"
        headers = {"Accept": "text/markdown"}
        token = os.environ.get("JINA_API_KEY")
        if token:
            headers["Authorization"] = f"Bearer {token}"

        req = urllib.request.Request(api_url, headers=headers)
        log.info("Fetching via Jina", extra={"data": {"url": url}})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read().decode("utf-8")
                if len(content) < 100:
                    log.warning("Jina returned too little content", extra={"data": {"len": len(content)}})
                    return None
                return FetchResult(content=content, url=url)
        except (urllib.error.URLError, TimeoutError) as e:
            log.warning("Jina fetch failed", extra={"data": {"url": url, "error": str(e)}})
            return None
