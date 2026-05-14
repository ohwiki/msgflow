#!/usr/bin/env python3
"""Fetch Feishu/Lark document as Markdown via Feishu Open API."""

import sys
import json
import re
import urllib.parse
import requests

from capabilities.feishu_auth import FEISHU_API_BASE, get_tenant_access_token
from capabilities.logger import get_logger

log = get_logger("fetcher.feishu")


def parse_feishu_url(url):
    patterns = [
        (r"feishu\.cn/docx/([A-Za-z0-9]+)", "docx"),
        (r"feishu\.cn/docs/([A-Za-z0-9]+)", "doc"),
        (r"feishu\.cn/wiki/([A-Za-z0-9]+)", "wiki"),
        (r"larksuite\.com/docx/([A-Za-z0-9]+)", "docx"),
        (r"larksuite\.com/docs/([A-Za-z0-9]+)", "doc"),
        (r"larksuite\.com/wiki/([A-Za-z0-9]+)", "wiki"),
    ]
    for pattern, doc_type in patterns:
        m = re.search(pattern, url)
        if m:
            return m.group(1), doc_type
    return None, None


def get_document_info(token, doc_id):
    url = f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"})
    data = resp.json()
    if data.get("code") == 0:
        return data.get("data", {}).get("document", {})
    return {}


def get_document_blocks(token, doc_id):
    url = f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}/blocks"
    headers = {"Authorization": f"Bearer {token}"}
    all_blocks = []
    page_token = None
    while True:
        params = {"page_size": 500}
        if page_token:
            params["page_token"] = page_token
        resp = requests.get(url, headers=headers, params=params)
        data = resp.json()
        if data.get("code") != 0:
            return None, f"获取 blocks 失败: {data.get('msg', resp.text)}"
        all_blocks.extend(data.get("data", {}).get("items", []))
        if not data.get("data", {}).get("has_more", False):
            break
        page_token = data["data"].get("page_token")
    return all_blocks, None


def get_wiki_node(token, wiki_token):
    url = f"{FEISHU_API_BASE}/wiki/v2/spaces/get_node"
    resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, params={"token": wiki_token})
    data = resp.json()
    if data.get("code") == 0:
        node = data.get("data", {}).get("node", {})
        return node.get("obj_token"), node.get("obj_type")
    return None, None


def extract_text_from_elements(elements):
    if not elements:
        return ""
    parts = []
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


def blocks_to_markdown(blocks):
    lines = []
    ordered_list_counter = {}

    for block in blocks:
        block_type = block.get("block_type")
        parent_id = block.get("parent_id", "")

        if block_type == 2:  # Text
            text = extract_text_from_elements(block.get("text", {}).get("elements", []))
            lines.append(text if text.strip() else "")
        elif block_type in (3, 4, 5, 6, 7, 8, 9):  # Heading 1-7
            level = block_type - 2
            heading_data = {}
            for key in [f"heading{level}", "heading"]:
                if key in block:
                    heading_data = block[key]
                    break
            text = extract_text_from_elements(heading_data.get("elements", []))
            lines.append(f"{'#' * level} {text}")
        elif block_type == 10:  # Bullet list
            text = extract_text_from_elements(block.get("bullet", {}).get("elements", []))
            lines.append(f"- {text}")
        elif block_type == 11:  # Ordered list
            text = extract_text_from_elements(block.get("ordered", {}).get("elements", []))
            counter = ordered_list_counter.get(parent_id, 0) + 1
            ordered_list_counter[parent_id] = counter
            lines.append(f"{counter}. {text}")
        elif block_type == 12:  # Code block
            code_data = block.get("code", {})
            text = extract_text_from_elements(code_data.get("elements", []))
            lang = code_data.get("style", {}).get("language", "")
            lang_map = {1: "plaintext", 7: "bash", 8: "c", 10: "cpp", 25: "go",
                        31: "java", 32: "javascript", 33: "json", 40: "markdown",
                        50: "python", 53: "rust", 58: "sql", 62: "typescript", 69: "yaml"}
            lang_str = lang_map.get(lang, "") if isinstance(lang, int) else str(lang)
            lines.append(f"```{lang_str}\n{text}\n```")
        elif block_type == 13:  # Quote
            text = extract_text_from_elements(block.get("quote", {}).get("elements", []))
            lines.append(f"> {text}")
        elif block_type == 15:  # Todo
            todo_data = block.get("todo", {})
            text = extract_text_from_elements(todo_data.get("elements", []))
            done = todo_data.get("style", {}).get("done", False)
            lines.append(f"- [{'x' if done else ' '}] {text}")
        elif block_type == 16:  # Divider
            lines.append("---")
        elif block_type == 17:  # Image
            token_val = block.get("image", {}).get("token", "")
            lines.append(f"![image](feishu-image://{token_val})")
        elif block_type == 1:  # Page root
            pass
        else:
            for key in block:
                if isinstance(block[key], dict) and "elements" in block[key]:
                    text = extract_text_from_elements(block[key]["elements"])
                    if text.strip():
                        lines.append(text)
                    break

    return "\n\n".join(lines)


def fetch_feishu_doc(url_or_id):
    doc_id, doc_type = parse_feishu_url(url_or_id)
    if not doc_id:
        doc_id = url_or_id
        doc_type = "docx"

    token, err = get_tenant_access_token()
    if err:
        return {"error": err}

    if doc_type == "wiki":
        real_id, real_type = get_wiki_node(token, doc_id)
        if real_id:
            doc_id = real_id
            doc_type = real_type or "docx"
        else:
            return {"error": f"无法获取知识库节点信息: {doc_id}"}

    doc_info = get_document_info(token, doc_id)
    title = doc_info.get("title", "")

    blocks, err = get_document_blocks(token, doc_id)
    if err:
        return {"error": err}

    content = blocks_to_markdown(blocks)
    return {"title": title, "document_id": doc_id, "url": url_or_id, "content": content}


def format_as_markdown(result):
    if "error" in result:
        return f"Error: {result['error']}"
    parts = ["---"]
    if result.get("title"):
        parts.append(f'title: "{result["title"]}"')
    parts.append(f'document_id: "{result["document_id"]}"')
    if result.get("url"):
        parts.append(f'url: "{result["url"]}"')
    parts.append("---\n")
    if result.get("title"):
        parts.append(f"# {result['title']}\n")
    parts.append(result.get("content", ""))
    return "\n".join(parts)


def fetch(url: str) -> str | None:
    """统一接口：返回 Markdown 字符串或 None"""
    log.info("feishu fetch start", extra={"url": url[:80]})
    result = fetch_feishu_doc(url)
    if "error" in result:
        log.error("feishu fetch failed", extra={"error": result["error"]})
        return None
    content = format_as_markdown(result)
    log.info("feishu fetch ok", extra={"length": len(content), "title": result.get("title", "")[:50]})
    return content


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: feishu.py <feishu_url_or_doc_token> [--json]", file=sys.stderr)
        sys.exit(1)
    url = sys.argv[1]
    use_json = "--json" in sys.argv
    result = fetch_feishu_doc(url)
    if use_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(format_as_markdown(result))
