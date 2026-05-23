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
        try:
            app_id = require_env("FEISHU_APP_ID")
            app_secret = require_env("FEISHU_APP_SECRET")
        except Exception:
            log.error("FEISHU_APP_ID/SECRET not configured")
            return None

        token = self._get_token(app_id, app_secret)
        if not token:
            return None

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
            return None

        content = self._blocks_to_markdown(blocks)

        # Format with frontmatter
        md = self._format_markdown(title, doc_id, url, content)
        log.info("Feishu fetch success", title=title, length=len(md))
        return FetchResult(content=md, url=url)

    # --- Private methods ---

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
        except HttpError:
            pass
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
        except HttpError:
            pass
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
            elif bt == 17:  # Image
                img_token = block.get("image", {}).get("token", "")
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

        return "\n\n".join(lines)

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
