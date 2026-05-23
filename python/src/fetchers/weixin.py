"""WeChat article fetcher — uses Worker proxy or Playwright."""

import os
import urllib.request
import urllib.parse
import urllib.error
from lib.interfaces import FetchResult
from lib.registry import register_fetcher
from lib.logger import get_logger

log = get_logger("fetcher.weixin")


@register_fetcher
class WeixinFetcher:
    name = "weixin"

    def can_handle(self, url: str) -> bool:
        return "mp.weixin.qq.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        # Try Worker proxy first (fast, no browser needed)
        proxy_url = os.environ.get("WEIXIN_PROXY_URL")
        if proxy_url:
            result = self._fetch_via_proxy(url, proxy_url)
            if result:
                return result

        # Fallback to Jina
        return self._fetch_via_jina(url)

    def _fetch_via_proxy(self, url: str, proxy_url: str) -> FetchResult | None:
        api = f"{proxy_url}?url={urllib.parse.quote(url)}"
        req = urllib.request.Request(api)
        log.info("Fetching weixin via proxy", extra={"data": {"url": url}})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read().decode("utf-8")
                if len(content) < 100:
                    return None
                return FetchResult(content=content, url=url)
        except (urllib.error.URLError, TimeoutError) as e:
            log.warning("Proxy fetch failed", extra={"data": {"error": str(e)}})
            return None

    def _fetch_via_jina(self, url: str) -> FetchResult | None:
        api_url = f"https://r.jina.ai/{url}"
        req = urllib.request.Request(api_url, headers={"Accept": "text/markdown"})
        log.info("Fetching weixin via Jina fallback", extra={"data": {"url": url}})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                content = resp.read().decode("utf-8")
                if len(content) < 100:
                    return None
                return FetchResult(content=content, url=url)
        except (urllib.error.URLError, TimeoutError) as e:
            log.warning("Jina fallback failed", extra={"data": {"error": str(e)}})
            return None
