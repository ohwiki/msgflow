"""Feishu block → Markdown converter."""
from __future__ import annotations

import re
import urllib.parse
from typing import Callable

from pycore import logger

log = logger("feishu.parser")

_LANG_MAP = {
    1: "plaintext", 7: "bash", 8: "c", 10: "cpp", 25: "go",
    31: "java", 32: "javascript", 33: "json", 40: "markdown",
    50: "python", 53: "rust", 58: "sql", 62: "typescript", 69: "yaml",
}


class FeishuBlockParser:
    """Convert feishu document blocks to Markdown string."""

    def __init__(self, image_downloader: Callable[[str], str | None] | None = None):
        self._download_image = image_downloader

    def parse(self, blocks: list) -> str:
        """Convert blocks to markdown content."""
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
            elif bt in (17, 27):  # Image
                img_token = block.get("image", {}).get("token", "")
                if img_token and self._download_image:
                    img_path = self._download_image(img_token)
                    if img_path:
                        lines.append(f"![image]({img_path})")
                    else:
                        lines.append(f"![image](feishu-image://{img_token})")
                else:
                    lines.append(f"![image](feishu-image://{img_token})")
            elif bt == 1:  # Page root
                pass
            else:
                for key in block:
                    if isinstance(block[key], dict) and "elements" in block[key]:
                        text = self._extract_text(block[key]["elements"])
                        if text.strip():
                            lines.append(text)
                        break

        return re.sub(r"\n{3,}", "\n\n", "\n\n".join(lines)).strip()

    def format_markdown(self, title: str, doc_id: str, url: str, content: str) -> str:
        """Wrap content with YAML frontmatter."""
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
