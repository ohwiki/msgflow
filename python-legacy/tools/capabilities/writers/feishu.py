#!/usr/bin/env python3
"""Write Markdown content to Feishu as a new document or wiki page."""

import sys
import re
import json
import requests

from capabilities.feishu_auth import FEISHU_API_BASE, get_tenant_access_token as _get_token
from capabilities.logger import get_logger

log = get_logger("writer.feishu")


def get_tenant_access_token():
    token, err = _get_token()
    if err:
        log.error("feishu auth failed", extra={"error": err})
        return None
    return token


def md_to_blocks(markdown: str) -> list:
    """将 Markdown 转为飞书 document blocks"""
    blocks = []
    lines = markdown.split("\n")
    i = 0
    while i < len(lines):
        line = lines[i]

        if line.startswith("```"):
            lang = line[3:].strip()
            code_lines = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code_lines.append(lines[i])
                i += 1
            blocks.append({"block_type": 14, "code": {
                "elements": [{"text_run": {"content": "\n".join(code_lines)}}],
                "language": _lang_code(lang)
            }})
            i += 1
            continue

        if line.startswith("#"):
            level = min(len(line) - len(line.lstrip("#")), 9)
            text = line.lstrip("#").strip()
            blocks.append({"block_type": 3, "heading": {
                "level": level,
                "elements": [{"text_run": {"content": text}}]
            }})
            i += 1
            continue

        if line.startswith(">"):
            text = line.lstrip(">").strip()
            blocks.append({"block_type": 17, "quote": {
                "elements": [{"text_run": {"content": text}}]
            }})
            i += 1
            continue

        if re.match(r"^[-*]\s", line):
            text = line.lstrip("-* ").strip()
            blocks.append({"block_type": 15, "bullet": {
                "elements": [{"text_run": {"content": text}}]
            }})
            i += 1
            continue

        if re.match(r"^\d+\.\s", line):
            text = re.sub(r"^\d+\.\s", "", line).strip()
            blocks.append({"block_type": 16, "ordered": {
                "elements": [{"text_run": {"content": text}}]
            }})
            i += 1
            continue

        if line.strip():
            blocks.append({"block_type": 2, "text": {
                "elements": [{"text_run": {"content": line}}]
            }})
        i += 1

    return blocks


def _lang_code(lang: str) -> int:
    mapping = {"python": 49, "javascript": 33, "typescript": 67, "bash": 7,
               "shell": 7, "json": 34, "yaml": 74, "go": 29, "rust": 56,
               "java": 32, "c": 10, "cpp": 12, "sql": 61, "html": 30, "css": 14}
    return mapping.get(lang.lower(), 0)


def create_document(token: str, title: str, blocks: list, folder_token: str = None) -> str:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"title": title, "folder_token": folder_token or ""}
    resp = requests.post(f"{FEISHU_API_BASE}/docx/v1/documents", headers=headers, json=body)
    data = resp.json()
    if data.get("code") != 0:
        return f"错误：创建文档失败: {data.get('msg')}"

    doc_id = data["data"]["document"]["document_id"]
    resp = requests.get(f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}/blocks/{doc_id}", headers=headers)
    if resp.json().get("code") != 0:
        return f"文档已创建但写入失败: https://feishu.cn/docx/{doc_id}"

    if blocks:
        batch_body = {"requests": [{"block_type": b["block_type"],
                                     **{k: v for k, v in b.items() if k != "block_type"}}
                                    for b in blocks], "index": 0}
        requests.post(f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}/blocks/{doc_id}/children/batch_create",
                      headers=headers, json=batch_body)

    return f"https://feishu.cn/docx/{doc_id}"


def create_wiki_node(token: str, title: str, blocks: list, space_id: str, parent_node: str = None) -> str:
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"title": title}
    resp = requests.post(f"{FEISHU_API_BASE}/docx/v1/documents", headers=headers, json=body)
    data = resp.json()
    if data.get("code") != 0:
        return f"错误：创建文档失败: {data.get('msg')}"

    doc_id = data["data"]["document"]["document_id"]

    if blocks:
        batch_body = {"requests": [{"block_type": b["block_type"],
                                     **{k: v for k, v in b.items() if k != "block_type"}}
                                    for b in blocks], "index": 0}
        requests.post(f"{FEISHU_API_BASE}/docx/v1/documents/{doc_id}/blocks/{doc_id}/children/batch_create",
                      headers=headers, json=batch_body)

    wiki_body = {"space_id": space_id, "obj_type": "docx", "obj_token": doc_id}
    if parent_node:
        wiki_body["parent_node_token"] = parent_node
    resp = requests.post(f"{FEISHU_API_BASE}/wiki/v2/spaces/{space_id}/nodes", headers=headers, json=wiki_body)
    wiki_data = resp.json()
    if wiki_data.get("code") != 0:
        return f"文档已创建但挂载知识库失败: https://feishu.cn/docx/{doc_id} (错误: {wiki_data.get('msg')})"

    node_token = wiki_data["data"]["node"]["node_token"]
    return f"https://feishu.cn/wiki/{node_token}"


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Write Markdown to Feishu")
    parser.add_argument("--title", required=True)
    parser.add_argument("--wiki-space", help="知识库 space_id")
    parser.add_argument("--parent", help="父节点 node_token")
    parser.add_argument("--folder", help="文件夹 token")
    args = parser.parse_args()

    markdown = sys.stdin.read()
    if not markdown.strip():
        print("错误：没有输入内容（通过 stdin 传入 Markdown）", file=sys.stderr)
        sys.exit(1)

    token = get_tenant_access_token()
    if not token:
        sys.exit(1)

    blocks = md_to_blocks(markdown)

    if args.wiki_space:
        url = create_wiki_node(token, args.title, blocks, args.wiki_space, args.parent)
    else:
        url = create_document(token, args.title, blocks, args.folder)

    print(url)


if __name__ == "__main__":
    main()
