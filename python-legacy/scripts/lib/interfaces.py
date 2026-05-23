"""接口定义 — 所有扩展点的 Protocol 集中管理。"""

from __future__ import annotations
from typing import Protocol
from dataclasses import dataclass


# ─── 数据模型 ────────────────────────────────────────────

@dataclass
class Message:
    chat_id: str
    text: str
    channel: str


@dataclass
class Command:
    action: str
    target: str = ""
    style: str = ""
    skill: str = ""


@dataclass
class FetchResult:
    title: str
    author: str
    source_name: str
    content: str
    has_code_blocks: bool


@dataclass
class PublishResult:
    ok: bool
    url: str = ""
    error: str = ""


@dataclass
class Result:
    ok: bool
    message: str = ""
    error: str = ""


@dataclass
class Context:
    channel: str
    chat_id: str
    env: dict


# ─── 接口定义 ────────────────────────────────────────────

class Fetcher(Protocol):
    """内容抓取接口 — 新增来源只需实现 + @register_fetcher"""

    def can_handle(self, url: str) -> bool: ...
    def fetch(self, url: str) -> FetchResult: ...


class CommandHandler(Protocol):
    """指令处理接口 — 新增指令只需实现 + @register_handler"""

    def can_handle(self, command: Command) -> bool: ...
    def execute(self, command: Command, ctx: Context) -> Result: ...


class Publisher(Protocol):
    """发布目标接口 — 新增渠道只需实现 + @register_publisher"""

    name: str

    def publish(self, title: str, content: str, metadata: dict) -> PublishResult: ...


class MessageChannel(Protocol):
    """通讯渠道接口 — 新增平台只需实现 + @register_channel"""

    name: str

    def send(self, chat_id: str, text: str) -> None: ...
    def parse_webhook(self, payload: dict) -> Message | None: ...
