"""Feishu document publisher."""

from __future__ import annotations

from pycore import logger, env
from pycore.http import post, HttpError

from writers import publishers

log = logger("publisher.feishu")


@publishers.register
class FeishuPublisher:
    name = "feishu"

    def publish(self, title: str, content: str, metadata: dict | None = None) -> bool:
        app_id = env("FEISHU_APP_ID")
        app_secret = env("FEISHU_APP_SECRET")
        folder_token = env("FEISHU_FOLDER_TOKEN")
        if not all([app_id, app_secret, folder_token]):
            log.error("Feishu env vars not configured")
            return False

        token = self._get_token(app_id, app_secret)
        if not token:
            return False

        try:
            post(
                "https://open.feishu.cn/open-apis/docx/v1/documents",
                json={"title": title, "folder_token": folder_token},
                headers={"Authorization": f"Bearer {token}"},
                timeout=30,
            )
            log.info("Published to Feishu", title=title)
            return True
        except HttpError as e:
            log.error("Feishu publish failed", status=e.status)
            return False

    def _get_token(self, app_id: str, app_secret: str) -> str | None:
        try:
            resp = post(
                "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
                json={"app_id": app_id, "app_secret": app_secret},
                timeout=10,
            )
            return resp.json().get("tenant_access_token")
        except HttpError:
            return None
