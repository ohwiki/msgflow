"""注册表 — 装饰器自动注册 + 调度函数。

扩展方式：
    @register_fetcher
    class MyFetcher:
        def can_handle(self, url: str) -> bool: ...
        def fetch(self, url: str) -> FetchResult: ...

调度逻辑永远不改，新增功能只加实现类 + 装饰器。
"""

from __future__ import annotations
from typing import TypeVar, Callable
from .interfaces import Fetcher, CommandHandler, Publisher, MessageChannel, FetchResult, Command, Context, Result, PublishResult

T = TypeVar("T")

# ─── 注册表 ──────────────────────────────────────────────

FETCHERS: list[Fetcher] = []
HANDLERS: list[CommandHandler] = []
PUBLISHERS: list[Publisher] = []
CHANNELS: list[MessageChannel] = []


# ─── 装饰器 ──────────────────────────────────────────────

def register_fetcher(cls: type[T]) -> type[T]:
    """注册内容抓取器。顺序 = 注册顺序，先注册优先匹配。"""
    FETCHERS.append(cls())  # type: ignore
    return cls


def register_handler(cls: type[T]) -> type[T]:
    """注册指令处理器。"""
    HANDLERS.append(cls())  # type: ignore
    return cls


def register_publisher(cls: type[T]) -> type[T]:
    """注册发布目标。"""
    PUBLISHERS.append(cls())  # type: ignore
    return cls


def register_channel(cls: type[T]) -> type[T]:
    """注册通讯渠道。"""
    CHANNELS.append(cls())  # type: ignore
    return cls


# ─── 调度函数（永远不改）─────────────────────────────────

def dispatch_fetch(url: str) -> FetchResult:
    """按注册顺序找到第一个能处理的 fetcher 执行。"""
    for f in FETCHERS:
        if f.can_handle(url):
            return f.fetch(url)
    raise ValueError(f"No fetcher available for: {url}")


def dispatch_command(command: Command, ctx: Context) -> Result:
    """按注册顺序找到第一个能处理的 handler 执行。"""
    for h in HANDLERS:
        if h.can_handle(command):
            return h.execute(command, ctx)
    return Result(ok=False, error=f"Unknown command: {command.action}")


def dispatch_publish(name: str, title: str, content: str, metadata: dict | None = None) -> PublishResult:
    """按名称找到对应的 publisher 执行。"""
    for p in PUBLISHERS:
        if p.name == name:
            return p.publish(title, content, metadata or {})
    return PublishResult(ok=False, error=f"Unknown publisher: {name}")


def dispatch_message(channel_name: str, chat_id: str, text: str) -> None:
    """按名称找到对应的通讯渠道发送消息。"""
    for c in CHANNELS:
        if c.name == channel_name:
            c.send(chat_id, text)
            return
    raise ValueError(f"Unknown channel: {channel_name}")
