#!/usr/bin/env python3
"""msgflow CLI — 统一任务入口。

所有功能通过子命令调用，入参通过 dataclass 约束。
不管从 CLI、Actions、还是 Worker 回调触发，最终都走同一套逻辑。

Usage:
    python -m scripts.cli fetch <url>
    python -m scripts.cli format <input.html> <output.md>
    python -m scripts.cli list [--limit N]
    python -m scripts.cli publish <article_id> --target feishu
    python -m scripts.cli rewrite <url> --style lu-xun
"""

import argparse
import sys
import logging

from lib.interfaces import Command, Context, FetchResult
from lib.registry import (
    dispatch_fetch,
    dispatch_command,
    dispatch_publish,
    FETCHERS,
    HANDLERS,
    PUBLISHERS,
)

# 确保所有实现被导入（触发 @register 装饰器）
import lib.fetchers  # noqa: F401
import lib.handlers  # noqa: F401

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("msgflow")


def cmd_fetch(args: argparse.Namespace) -> int:
    """抓取 URL 并输出 Markdown。"""
    log.info(f"Fetching: {args.url}")
    try:
        result = dispatch_fetch(args.url)
        print(f"✅ {result.title}")
        print(f"   来源: {result.source_name}")
        print(f"   代码块: {'有' if result.has_code_blocks else '无'}")
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(result.content)
            print(f"   输出: {args.output}")
        else:
            print(f"   长度: {len(result.content)} 字符")
        return 0
    except Exception as e:
        log.error(f"Fetch failed: {e}")
        return 1


def cmd_format(args: argparse.Namespace) -> int:
    """格式化 HTML 为 Markdown（含代码块 Prettier 处理）。"""
    from format_article import process
    try:
        process(args.input, args.output)
        return 0
    except Exception as e:
        log.error(f"Format failed: {e}")
        return 1


def cmd_list(args: argparse.Namespace) -> int:
    """列出最近的文章。"""
    ctx = Context(channel="cli", chat_id="local", env={})
    result = dispatch_command(Command(action="list"), ctx)
    if result.ok:
        print(result.message)
    else:
        print(f"❌ {result.error}")
    return 0 if result.ok else 1


def cmd_publish(args: argparse.Namespace) -> int:
    """发布文章到指定目标。"""
    result = dispatch_publish(
        name=args.target,
        title=args.title or "",
        content=args.content or "",
        metadata={"article_id": args.article_id},
    )
    if result.ok:
        print(f"✅ 发布成功: {result.url}")
    else:
        print(f"❌ 发布失败: {result.error}")
    return 0 if result.ok else 1


def cmd_rewrite(args: argparse.Namespace) -> int:
    """AI 改写文章。"""
    ctx = Context(channel="cli", chat_id="local", env={})
    command = Command(action="rewrite", target=args.url, style=args.style)
    result = dispatch_command(command, ctx)
    if result.ok:
        print(f"✅ {result.message}")
    else:
        print(f"❌ {result.error}")
    return 0 if result.ok else 1


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="msgflow",
        description="msgflow 内容系统 CLI",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # fetch
    p_fetch = sub.add_parser("fetch", help="抓取 URL 为 Markdown")
    p_fetch.add_argument("url", help="目标 URL")
    p_fetch.add_argument("-o", "--output", help="输出文件路径")
    p_fetch.set_defaults(func=cmd_fetch)

    # format
    p_format = sub.add_parser("format", help="格式化 HTML → Markdown")
    p_format.add_argument("input", help="输入 HTML 文件")
    p_format.add_argument("output", help="输出 Markdown 文件")
    p_format.set_defaults(func=cmd_format)

    # list
    p_list = sub.add_parser("list", help="列出最近文章")
    p_list.add_argument("--limit", type=int, default=10)
    p_list.set_defaults(func=cmd_list)

    # publish
    p_pub = sub.add_parser("publish", help="发布文章")
    p_pub.add_argument("article_id", help="文章 ID")
    p_pub.add_argument("--target", required=True, help="发布目标 (feishu/mowen)")
    p_pub.add_argument("--title", help="文章标题")
    p_pub.add_argument("--content", help="文章内容（或从 stdin 读取）")
    p_pub.set_defaults(func=cmd_publish)

    # rewrite
    p_rw = sub.add_parser("rewrite", help="AI 改写文章")
    p_rw.add_argument("url", help="文章 URL")
    p_rw.add_argument("--style", required=True, help="改写风格 (lu-xun/ma-sanli/xu-zhimo)")
    p_rw.set_defaults(func=cmd_rewrite)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
