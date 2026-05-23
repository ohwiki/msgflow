"""Jina Reader fetcher — general-purpose web content extraction."""

from __future__ import annotations

from pycore import logger, env
from pycore.http import get, HttpError

from fetchers._registry import fetcher_registry as fetchers, FetchResult

log = logger("fetcher.jina")


@fetchers.register
class JinaFetcher:
    name = "jina"

    def can_handle(self, url: str) -> bool:
        return url.startswith("http")

    def fetch(self, url: str) -> FetchResult | None:
        api_url = f"https://r.jina.ai/{url}"
        headers = {"Accept": "text/markdown"}
        token = env("JINA_API_KEY")
        if token:
            headers["Authorization"] = f"Bearer {token}"

        log.info("Fetching via Jina", url=url)
        try:
            resp = get(api_url, headers=headers, timeout=30)
            if len(resp.body) < 100:
                log.warning("Jina returned too little content", length=len(resp.body))
                return None
            return FetchResult(content=resp.body, url=url)
        except HttpError as e:
            log.warning("Jina fetch failed", url=url, status=e.status)
            return None
