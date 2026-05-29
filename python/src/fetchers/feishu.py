"""Feishu document fetcher — orchestrates auth, API, and parsing."""
from __future__ import annotations

import re

from pycore import logger

from fetchers._registry import fetcher_registry as fetchers, FetchResult
from fetchers._feishu_auth import FeishuAuth
from fetchers._feishu_api import FeishuApiClient
from fetchers._feishu_parser import FeishuBlockParser

log = logger("fetcher.feishu")


@fetchers.register
class FeishuFetcher:
    name = "feishu"

    def __init__(self) -> None:
        self._auth = FeishuAuth()
        self._api = FeishuApiClient()

    def can_handle(self, url: str) -> bool:
        return "feishu.cn" in url or "larksuite.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        token = self._auth.get_token()
        if not token:
            log.error("No valid feishu token available")
            return None

        doc_id, doc_type = self._parse_url(url)
        if not doc_id:
            log.error("Cannot parse feishu URL", url=url)
            return None

        if doc_type == "wiki":
            real_id = self._api.get_wiki_node(token, doc_id)
            if not real_id:
                log.error("Cannot resolve wiki node", doc_id=doc_id)
                return None
            doc_id = real_id

        title = self._api.get_doc_title(token, doc_id)
        blocks = self._api.get_blocks(token, doc_id)
        if blocks is None:
            log.error("Failed to get document blocks", doc_id=doc_id)
            return None

        def download_img(img_token: str) -> str | None:
            return self._api.download_image(token, img_token, "images", doc_id)

        parser = FeishuBlockParser(image_downloader=download_img)
        content = parser.parse(blocks)
        md = parser.format_markdown(title, doc_id, url, content)

        log.info("Feishu fetch success", title=title, length=len(md))
        return FetchResult(content=md, url=url)

    def _parse_url(self, url: str) -> tuple[str | None, str | None]:
        patterns = [
            (r"feishu\.cn/docx/([A-Za-z0-9]+)", "docx"),
            (r"feishu\.cn/docs/([A-Za-z0-9]+)", "doc"),
            (r"feishu\.cn/wiki/([A-Za-z0-9]+)", "wiki"),
            (r"larksuite\.com/docx/([A-Za-z0-9]+)", "docx"),
            (r"larksuite\.com/wiki/([A-Za-z0-9]+)", "wiki"),
        ]
        for pattern, doc_type in patterns:
            m = re.search(pattern, url)
            if m:
                return m.group(1), doc_type
        return None, None
