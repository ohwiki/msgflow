"""Feishu document fetcher — full block-level parsing via Feishu Open API."""

from __future__ import annotations

import re
import urllib.parse

from pycore import logger, require_env
from pycore.http import get as http_get, post as http_post, HttpError

from fetchers._registry import fetcher_registry as fetchers, FetchResult

log = logger("fetcher.feishu")

FEISHU_API_BASE = "https://open.feishu.cn/open-apis"


@fetchers.register
class FeishuFetcher:
    name = "feishu"

    def can_handle(self, url: str) -> bool:
        return "feishu.cn" in url or "larksuite.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        # Try user token first (can access any doc the user can see)
        token = self._get_user_token()
        if not token:
            # Fallback to app token (only own tenant docs)
            try:
                app_id = require_env("FEISHU_APP_ID")
                app_secret = require_env("FEISHU_APP_SECRET")
            except Exception:
                log.error("FEISHU_APP_ID/SECRET not configured and no user token")
                return None
            token = self._get_token(app_id, app_secret)
            if not token:
                log.error("Failed to get app token")
                return None

        self._current_token = token
        self._images_dir: str | None = None
        self._doc_id: str | None = None

        doc_id, doc_type = self._parse_url(url)
        if not doc_id:
            log.error("Cannot parse feishu URL", url=url)
            return None

        # Wiki → resolve to real doc ID
        if doc_type == "wiki":
            real_id = self._get_wiki_node(token, doc_id)
            if real_id:
                doc_id = real_id
            else:
                log.error("Cannot resolve wiki node", doc_id=doc_id)
                return None

        # Get doc info + blocks
        title = self._get_doc_title(token, doc_id)
        blocks = self._get_blocks(token, doc_id)
        if blocks is None:
            log.error("Failed to get document blocks", doc_id=doc_id)
            return None

        self._doc_id = doc_id
        content = self._blocks_to_markdown(blocks)

        # Format with frontmatter
        md = self._format_markdown(title, doc_id, url, content)
        log.info("Feishu fetch success", title=title, length=len(md))
        return FetchResult(content=md, url=url)

    # --- Private methods ---

    def _download_image(self, img_token: str, auth_token: str) -> str | None:
        """Download image from feishu and save to images/ dir. Returns relative path."""
        import json as json_mod
        from pathlib import Path

        if not self._images_dir:
            self._images_dir = "images"
            Path(self._images_dir).mkdir(parents=True, exist_ok=True)

        extra = json_mod.dumps({"drive_route_token": self._doc_id or ""})
        url = f"{FEISHU_API_BASE}/drive/v1/medias/{img_token}/download?extra={urllib.parse.quote(extra)}"
        try:
            import urllib.request as urllib_req
            req = urllib_req.Request(url, headers={"Authorization": f"Bearer {auth_token}"})
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
                filepath = Path(self._images_dir) / filename
                filepath.write_bytes(resp.read())
                log.info("Image downloaded", token=img_token, path=str(filepath))
                return f"./images/{filename}"
        except Exception as e:
            log.warning("Image download failed", token=img_token, error=str(e))
            return None

    def _get_user_token(self) -> str | None:
        """Load user_access_token from KV (via Worker) or local file, refresh if expired."""
        import json
        import os
        import time
        from pathlib import Path

        # Try KV first (for GitHub Actions / remote environments)
        kv_token = self._get_token_from_kv()
        if kv_token:
            return kv_token

        # Fallback to local file
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
            # Check expiry
            saved_at = token_data.get("_saved_at", 0)
            expires_in = token_data.get("expires_in", 7200)
            if saved_at and time.time() - saved_at > expires_in - 300:
                log.info("KV token expired, waiting for cron refresh")
                return None  # Expired, let cron refresh it
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
            # Get app_access_token first
            resp = http_post(
                f"{FEISHU_API_BASE}/auth/v3/app_access_token/internal",
                json={"app_id": app_id, "app_secret": app_secret},
                timeout=10,
            )
            app_token = resp.json().get("app_access_token")
            if not app_token:
                log.error("Cannot get app_access_token for refresh")
                return None

            # Refresh user token
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

    def _get_token(self, app_id: str, app_secret: str) -> str | None:
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

    def _get_wiki_node(self, token: str, wiki_token: str) -> str | None:
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

    def _get_doc_title(self, token: str, doc_id: str) -> str:
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

    def _get_blocks(self, token: str, doc_id: str) -> list | None:
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

    def _blocks_to_markdown(self, blocks: list) -> str:
        lines: list[str] = []
        ordered_counter: dict[str, int] = {}

        for block in blocks:
            bt = block.get("block_type")
            parent_id = block.get("parent_id", "")

            if bt == 2:  # Text
                text = self._extract_text(block.get("text", {}).get("elements", []))
                lines.append(text if text.strip() else "")
            elif bt in (3, 4, 5, 6, 7, 8, 9):  # Heading 1-7
                level = bt - 2
                heading_data = block.get(f"heading{level}", block.get("heading", {}))
                text = self._extract_text(heading_data.get("elements", []))
                lines.append(f"{'#' * level} {text}")
            elif bt == 10:  # Bullet
                text = self._extract_text(block.get("bullet", {}).get("elements", []))
                lines.append(f"- {text}")
            elif bt == 11:  # Ordered
                text = self._extract_text(block.get("ordered", {}).get("elements", []))
                counter = ordered_counter.get(parent_id, 0) + 1
                ordered_counter[parent_id] = counter
                lines.append(f"{counter}. {text}")
            elif bt == 12:  # Code
                code_data = block.get("code", {})
                text = self._extract_text(code_data.get("elements", []))
                lang = code_data.get("style", {}).get("language", "")
                lang_str = _LANG_MAP.get(lang, "") if isinstance(lang, int) else str(lang)
                lines.append(f"```{lang_str}\n{text}\n```")
            elif bt == 13:  # Quote
                text = self._extract_text(block.get("quote", {}).get("elements", []))
                lines.append(f"> {text}")
            elif bt == 15:  # Todo
                todo = block.get("todo", {})
                text = self._extract_text(todo.get("elements", []))
                done = todo.get("style", {}).get("done", False)
                lines.append(f"- [{'x' if done else ' '}] {text}")
            elif bt == 16:  # Divider
                lines.append("---")
            elif bt in (17, 27):  # Image (17=old API, 27=new API)
                img_token = block.get("image", {}).get("token", "")
                if img_token and self._current_token:
                    img_path = self._download_image(img_token, self._current_token)
                    if img_path:
                        lines.append(f"![image]({img_path})")
                    else:
                        lines.append(f"![image](feishu-image://{img_token})")
                else:
                    lines.append(f"![image](feishu-image://{img_token})")
            elif bt == 1:  # Page root
                pass
            else:
                # Fallback: try to extract text from any sub-dict with elements
                for key in block:
                    if isinstance(block[key], dict) and "elements" in block[key]:
                        text = self._extract_text(block[key]["elements"])
                        if text.strip():
                            lines.append(text)
                        break

        return re.sub(r"\n{3,}", "\n\n", "\n\n".join(lines)).strip()

    def _extract_text(self, elements: list) -> str:
        parts: list[str] = []
        for el in elements:
            if "text_run" in el:
                tr = el["text_run"]
                text = tr.get("content", "")
                style = tr.get("text_element_style", {})
                if style.get("bold"):
                    text = f"**{text}**"
                if style.get("italic"):
                    text = f"*{text}*"
                if style.get("strikethrough"):
                    text = f"~~{text}~~"
                if style.get("inline_code"):
                    text = f"`{text}`"
                if style.get("link", {}).get("url"):
                    link_url = urllib.parse.unquote(style["link"]["url"])
                    text = f"[{text}]({link_url})"
                parts.append(text)
            elif "mention_user" in el:
                parts.append(f"@{el['mention_user'].get('user_id', 'user')}")
            elif "equation" in el:
                parts.append(f"${el['equation'].get('content', '')}$")
        return "".join(parts)

    def _format_markdown(self, title: str, doc_id: str, url: str, content: str) -> str:
        parts = ["---"]
        if title:
            parts.append(f'title: "{title}"')
        parts.append(f'document_id: "{doc_id}"')
        parts.append(f'url: "{url}"')
        parts.append("---\n")
        if title:
            parts.append(f"# {title}\n")
        parts.append(content)
        return "\n".join(parts)


_LANG_MAP = {
    1: "plaintext", 7: "bash", 8: "c", 10: "cpp", 25: "go",
    31: "java", 32: "javascript", 33: "json", 40: "markdown",
    50: "python", 53: "rust", 58: "sql", 62: "typescript", 69: "yaml",
}
