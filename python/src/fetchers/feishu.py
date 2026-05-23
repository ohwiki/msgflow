"""Feishu document fetcher."""

from __future__ import annotations

from pycore import logger, require_env
from pycore.http import post, get, HttpError

from fetchers import fetchers
from fetchers.jina import FetchResult

log = logger("fetcher.feishu")


@fetchers.register
class FeishuFetcher:
    name = "feishu"

    def can_handle(self, url: str) -> bool:
        return "feishu.cn" in url or "larksuite.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        try:
            app_id = require_env("FEISHU_APP_ID")
            app_secret = require_env("FEISHU_APP_SECRET")
        except Exception:
            log.error("FEISHU_APP_ID/SECRET not configured")
            return None

        token = self._get_token(app_id, app_secret)
        if not token:
            return None

        doc_token = url.rstrip("/").split("/")[-1]
        return self._fetch_doc(doc_token, token)

    def _get_token(self, app_id: str, app_secret: str) -> str | None:
        try:
            resp = post(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                json={"app_id": app_id, "app_secret": app_secret},
                timeout=10,
            )
            return resp.json().get("tenant_access_token")
        except HttpError as e:
            log.error("Failed to get feishu token", status=e.status)
            return None

    def _fetch_doc(self, doc_token: str, token: str) -> FetchResult | None:
        api = f"https://open.feishu.cn/open-apis/docx/v1/documents/{doc_token}/raw_content"
        log.info("Fetching feishu doc", doc_token=doc_token)
        try:
            resp = get(api, headers={"Authorization": f"Bearer {token}"}, timeout=30)
            content = resp.json().get("data", {}).get("content", "")
            if not content:
                return None
            return FetchResult(content=content, url=f"feishu://{doc_token}")
        except HttpError as e:
            log.error("Feishu fetch failed", status=e.status)
            return None
