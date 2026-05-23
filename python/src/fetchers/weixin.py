"""WeChat article fetcher."""

from __future__ import annotations

from pycore import logger, env
from pycore.http import get, HttpError

from fetchers import fetchers
from fetchers.jina import FetchResult

log = logger("fetcher.weixin")


@fetchers.register
class WeixinFetcher:
    name = "weixin"

    def can_handle(self, url: str) -> bool:
        return "mp.weixin.qq.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        proxy_url = env("WEIXIN_PROXY_URL")
        if proxy_url:
            result = self._fetch_via_proxy(url, proxy_url)
            if result:
                return result
        # Fallback to Jina
        return self._fetch_via_jina(url)

    def _fetch_via_proxy(self, url: str, proxy_url: str) -> FetchResult | None:
        import urllib.parse
        api = f"{proxy_url}?url={urllib.parse.quote(url)}"
        log.info("Fetching weixin via proxy", url=url)
        try:
            resp = get(api, timeout=30)
            if len(resp.body) < 100:
                return None
            return FetchResult(content=resp.body, url=url)
        except HttpError:
            return None

    def _fetch_via_jina(self, url: str) -> FetchResult | None:
        log.info("Fetching weixin via Jina fallback", url=url)
        try:
            resp = get(f"https://r.jina.ai/{url}", headers={"Accept": "text/markdown"}, timeout=30)
            if len(resp.body) < 100:
                return None
            return FetchResult(content=resp.body, url=url)
        except HttpError:
            return None
