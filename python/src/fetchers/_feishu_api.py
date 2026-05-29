"""Feishu API client — document/wiki/block operations."""
from __future__ import annotations

import urllib.parse

from pycore import logger
from pycore.http import get as http_get, HttpError

log = logger("feishu.api")

FEISHU_API_BASE = "https://open.feishu.cn/open-apis"


class FeishuApiClient:
    """Stateless API client, receives token per call."""

    def get_wiki_node(self, token: str, wiki_token: str) -> str | None:
        try:
            resp = http_get(
                f"{FEISHU_API_BASE}/wiki/v2/spaces/get_node?token={wiki_token}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            data = resp.json()
            if data.get("code") == 0:
                return data.get("data", {}).get("node", {}).get("obj_token")
        except HttpError as e:
            log.warning("Wiki node lookup failed", wiki_token=wiki_token, status=e.status)
        return None

    def get_doc_title(self, token: str, doc_id: str) -> str:
        try:
            resp = http_get(
                f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}",
                headers={"Authorization": f"Bearer {token}"},
                timeout=10,
            )
            data = resp.json()
            if data.get("code") == 0:
                return data.get("data", {}).get("document", {}).get("title", "")
        except HttpError as e:
            log.warning("Get doc title failed", doc_id=doc_id, status=e.status)
        return ""

    def get_blocks(self, token: str, doc_id: str) -> list | None:
        all_blocks: list = []
        page_token = None
        while True:
            url = f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}/blocks?page_size=500"
            if page_token:
                url += f"&page_token={page_token}"
            try:
                resp = http_get(url, headers={"Authorization": f"Bearer {token}"}, timeout=30)
                data = resp.json()
                if data.get("code") != 0:
                    log.error("Get blocks failed", msg=data.get("msg"))
                    return None
                all_blocks.extend(data.get("data", {}).get("items", []))
                if not data.get("data", {}).get("has_more", False):
                    break
                page_token = data["data"].get("page_token")
            except HttpError as e:
                log.error("Get blocks error", status=e.status)
                return None
        return all_blocks

    def download_image(self, token: str, img_token: str, save_dir: str, doc_id: str | None = None) -> str | None:
        """Download image from feishu and save locally. Returns relative path."""
        import json as json_mod
        import urllib.request as urllib_req
        from pathlib import Path

        Path(save_dir).mkdir(parents=True, exist_ok=True)
        extra = json_mod.dumps({"drive_route_token": doc_id or ""})
        url = f"{FEISHU_API_BASE}/drive/v1/medias/{img_token}/download?extra={urllib.parse.quote(extra)}"
        try:
            req = urllib_req.Request(url, headers={"Authorization": f"Bearer {token}"})
            with urllib_req.urlopen(req, timeout=30) as resp:
                content_type = resp.headers.get("Content-Type", "image/png")
                ext = ".png"
                if "jpeg" in content_type or "jpg" in content_type:
                    ext = ".jpg"
                elif "gif" in content_type:
                    ext = ".gif"
                elif "webp" in content_type:
                    ext = ".webp"

                filename = f"{img_token}{ext}"
                filepath = Path(save_dir) / filename
                filepath.write_bytes(resp.read())
                log.info("Image downloaded", token=img_token, path=str(filepath))
                return f"./{save_dir}/{filename}"
        except Exception as e:
            log.warning("Image download failed", token=img_token, error=str(e))
            return None
