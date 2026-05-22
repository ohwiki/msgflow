"""微信公众号抓取器。"""

import re
import requests
from ..interfaces import FetchResult
from ..registry import register_fetcher

HEADERS = {
    "Referer": "https://mp.weixin.qq.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
}


@register_fetcher
class WeixinFetcher:
    def can_handle(self, url: str) -> bool:
        return "mp.weixin.qq.com" in url

    def fetch(self, url: str) -> FetchResult:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        html = resp.text

        title = self._extract(html, r'id="activity-name"[^>]*>([\s\S]*?)</')
        author = self._extract(html, r'id="js_author_name"[^>]*>([\s\S]*?)</')
        source_name = self._extract(html, r'id="js_name"[^>]*>([\s\S]*?)</')

        content_match = re.search(r'id="js_content"[^>]*>([\s\S]*?)</div>\s*<script', html)
        if not content_match:
            raise ValueError("Content not found (#js_content)")

        content_html = content_match.group(1)
        has_code_blocks = len(re.findall(r"<pre", content_html)) > 0

        return FetchResult(
            title=title,
            author=author,
            source_name=source_name,
            content=content_html,
            has_code_blocks=has_code_blocks,
        )

    def _extract(self, html: str, pattern: str) -> str:
        match = re.search(pattern, html)
        return re.sub(r"<[^>]+>", "", match.group(1)).strip() if match else ""
