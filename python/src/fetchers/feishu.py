"""Feishu/Lark document fetcher — uses Feishu Open API."""

import os
import json
import urllib.request
import urllib.error
from lib.interfaces import FetchResult
from lib.registry import register_fetcher
from lib.logger import get_logger

log = get_logger("fetcher.feishu")


@register_fetcher
class FeishuFetcher:
    name = "feishu"

    def can_handle(self, url: str) -> bool:
        return "feishu.cn" in url or "larksuite.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        app_id = os.environ.get("FEISHU_APP_ID")
        app_secret = os.environ.get("FEISHU_APP_SECRET")
        if not app_id or not app_secret:
            log.error("FEISHU_APP_ID/SECRET not configured")
            return None

        token = self._get_tenant_token(app_id, app_secret)
        if not token:
            return None

        doc_token = self._extract_doc_token(url)
        if not doc_token:
            log.error("Cannot extract doc token from URL", extra={"data": {"url": url}})
            return None

        return self._fetch_doc(doc_token, token)

    def _get_tenant_token(self, app_id: str, app_secret: str) -> str | None:
        body = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
        req = urllib.request.Request(
            "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
            data=body, headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read())
                return data.get("tenant_access_token")
        except (urllib.error.URLError, TimeoutError) as e:
            log.error("Failed to get feishu token", extra={"data": {"error": str(e)}})
            return None

    def _extract_doc_token(self, url: str) -> str | None:
        # URL format: https://xxx.feishu.cn/wiki/TOKEN or /docx/TOKEN
        parts = url.rstrip("/").split("/")
        return parts[-1] if parts else None

    def _fetch_doc(self, doc_token: str, token: str) -> FetchResult | None:
        api = f"https://open.feishu.cn/open-apis/docx/v1/documents/{doc_token}/raw_content"
        req = urllib.request.Request(api, headers={"Authorization": f"Bearer {token}"})
        log.info("Fetching feishu doc", extra={"data": {"doc_token": doc_token}})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                content = data.get("data", {}).get("content", "")
                if not content:
                    log.warning("Feishu doc empty", extra={"data": {"doc_token": doc_token}})
                    return None
                return FetchResult(content=content, url=f"feishu://{doc_token}")
        except (urllib.error.URLError, TimeoutError) as e:
            log.error("Feishu fetch failed", extra={"data": {"error": str(e)}})
            return None
