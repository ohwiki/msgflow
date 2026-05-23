"""通用网页抓取器 — 通过 r.jina.ai 代理。"""

import requests
from ..interfaces import FetchResult
from ..registry import register_fetcher

JINA_URL = "https://r.jina.ai"


@register_fetcher
class JinaFetcher:
    """Fallback fetcher — 任何 URL 都尝试通过 Jina 代理抓取。"""

    def can_handle(self, url: str) -> bool:
        return True  # 兜底，永远返回 True

    def fetch(self, url: str) -> FetchResult:
        resp = requests.get(
            f"{JINA_URL}/{url}",
            headers={"Accept": "text/markdown"},
            timeout=15,
        )
        resp.raise_for_status()
        markdown = resp.text

        if len(markdown) < 100:
            raise ValueError("Jina returned insufficient content")

        # Extract title from first heading
        lines = markdown.split("\n")
        title = ""
        for line in lines:
            if line.startswith("# "):
                title = line[2:].strip()
                break
        if not title:
            title = lines[0][:100] if lines else "Untitled"

        return FetchResult(
            title=title,
            author="",
            source_name="Web",
            content=markdown,
            has_code_blocks=False,
        )
