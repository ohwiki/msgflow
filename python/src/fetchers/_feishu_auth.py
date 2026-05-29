"""Feishu token management — KV / local file / refresh."""
from __future__ import annotations

from pycore import logger, require_env
from pycore.http import get as http_get, post as http_post, HttpError

from fetchers._feishu_api import FEISHU_API_BASE

log = logger("feishu.auth")


class FeishuAuth:
    """Resolve a valid access_token from multiple sources."""

    def get_token(self) -> str | None:
        """Try user token first, fallback to app token."""
        token = self._get_user_token()
        if token:
            return token
        try:
            app_id = require_env("FEISHU_APP_ID")
            app_secret = require_env("FEISHU_APP_SECRET")
        except Exception:
            log.error("FEISHU_APP_ID/SECRET not configured and no user token")
            return None
        return self._get_app_token(app_id, app_secret)

    def _get_app_token(self, app_id: str, app_secret: str) -> str | None:
        """Get tenant_access_token via app credentials."""
        try:
            resp = http_post(
                f"{FEISHU_API_BASE}/auth/v3/tenant_access_token/internal",
                json={"app_id": app_id, "app_secret": app_secret},
                timeout=10,
            )
            data = resp.json()
            if data.get("code") != 0:
                log.error("Token request failed", msg=data.get("msg"))
                return None
            return data["tenant_access_token"]
        except HttpError as e:
            log.error("Token request error", status=e.status)
            return None

    def _get_user_token(self) -> str | None:
        """Load user_access_token from KV or local file, refresh if expired."""
        import json
        import time
        from pathlib import Path

        kv_token = self._get_token_from_kv()
        if kv_token:
            return kv_token

        token_file = Path.home() / ".feishu_token.json"
        if not token_file.exists():
            log.info("No feishu token file and no KV token")
            return None

        data = json.loads(token_file.read_text())
        access_token = data.get("access_token")
        refresh_token = data.get("refresh_token")
        saved_at = data.get("_saved_at", 0)
        expires_in = data.get("expires_in", 7200)

        if saved_at and time.time() - saved_at > expires_in - 300:
            if not refresh_token:
                log.warning("User token expired and no refresh_token")
                return None
            new_data = self._refresh_user_token(refresh_token)
            if new_data:
                new_data["_saved_at"] = time.time()
                token_file.write_text(json.dumps(new_data, indent=2))
                return new_data.get("access_token")
            log.warning("User token refresh failed")
            return None

        if not saved_at and access_token:
            data["_saved_at"] = time.time()
            token_file.write_text(json.dumps(data, indent=2))

        return access_token

    def _get_token_from_kv(self) -> str | None:
        """Fetch token from msgflow Worker KV via API."""
        import json
        import os
        import time

        worker_url = os.environ.get("MSGFLOW_WORKER_URL", "https://api.ouraihub.com")
        try:
            resp = http_get(f"{worker_url}/api/ci/config/feishu_user_token", timeout=5)
            data = json.loads(resp.body)
            token_data = json.loads(data.get("value", "{}")) if isinstance(data.get("value"), str) else data
            access_token = token_data.get("access_token")
            if not access_token:
                log.info("KV token has no access_token")
                return None
            saved_at = token_data.get("_saved_at", 0)
            expires_in = token_data.get("expires_in", 7200)
            if saved_at and time.time() - saved_at > expires_in - 300:
                log.info("KV token expired, waiting for cron refresh")
                return None
            return access_token
        except Exception:
            log.info("KV token fetch failed, will try local file")
            return None

    def _refresh_user_token(self, refresh_token: str) -> dict | None:
        """Refresh user_access_token using refresh_token."""
        import os
        app_id = os.environ.get("FEISHU_APP_ID", "")
        app_secret = os.environ.get("FEISHU_APP_SECRET", "")
        if not app_id or not app_secret:
            log.warning("Cannot refresh: FEISHU_APP_ID/SECRET not set")
            return None

        try:
            resp = http_post(
                f"{FEISHU_API_BASE}/auth/v3/app_access_token/internal",
                json={"app_id": app_id, "app_secret": app_secret},
                timeout=10,
            )
            app_token = resp.json().get("app_access_token")
            if not app_token:
                log.error("Cannot get app_access_token for refresh")
                return None

            resp = http_post(
                f"{FEISHU_API_BASE}/authen/v1/oidc/refresh_access_token",
                json={"grant_type": "refresh_token", "refresh_token": refresh_token},
                headers={"Authorization": f"Bearer {app_token}", "Content-Type": "application/json"},
                timeout=10,
            )
            data = resp.json()
            if data.get("code") == 0:
                log.info("User token refreshed")
                return data.get("data")
        except HttpError as e:
            log.error("Token refresh failed", status=e.status)
        return None
