"""Feishu document publisher."""

import os
import json
import urllib.request
import urllib.error
from lib.interfaces import PublishResult
from lib.registry import register_publisher
from lib.logger import get_logger

log = get_logger("publisher.feishu")


@register_publisher
class FeishuPublisher:
    name = "feishu"

    def publish(self, title: str, content: str, metadata: dict | None = None) -> PublishResult:
        app_id = os.environ.get("FEISHU_APP_ID")
        app_secret = os.environ.get("FEISHU_APP_SECRET")
        folder_token = os.environ.get("FEISHU_FOLDER_TOKEN")

        if not all([app_id, app_secret, folder_token]):
            return PublishResult(success=False, error="FEISHU_APP_ID/SECRET/FOLDER_TOKEN not configured")

        token = self._get_token(app_id, app_secret)  # type: ignore[arg-type]
        if not token:
            return PublishResult(success=False, error="Failed to get feishu token")

        return self._create_doc(token, folder_token, title, content)  # type: ignore[arg-type]

    def _get_token(self, app_id: str, app_secret: str) -> str | None:
        body = json.dumps({"app_id": app_id, "app_secret": app_secret}).encode()
        req = urllib.request.Request(
            "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
            data=body, headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read()).get("tenant_access_token")
        except (urllib.error.URLError, TimeoutError):
            return None

    def _create_doc(self, token: str, folder: str, title: str, content: str) -> PublishResult:
        body = json.dumps({"title": title, "folder_token": folder}).encode()
        req = urllib.request.Request(
            "https://open.feishu.cn/open-apis/docx/v1/documents",
            data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        log.info("Creating feishu doc", extra={"data": {"title": title}})
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                doc_id = data.get("data", {}).get("document", {}).get("document_id", "")
                return PublishResult(success=True, url=f"https://feishu.cn/docx/{doc_id}")
        except (urllib.error.URLError, TimeoutError) as e:
            log.error("Feishu create doc failed", extra={"data": {"error": str(e)}})
            return PublishResult(success=False, error=str(e))
