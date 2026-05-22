"""Fetch 指令处理器 — 抓取 URL。"""

from ..interfaces import Command, Context, Result
from ..registry import register_handler, dispatch_fetch


@register_handler
class FetchHandler:
    def can_handle(self, command: Command) -> bool:
        return command.action == "fetch"

    def execute(self, command: Command, ctx: Context) -> Result:
        if not command.target:
            return Result(ok=False, error="Missing URL")
        try:
            result = dispatch_fetch(command.target)
            return Result(ok=True, message=f"抓取成功: {result.title} ({len(result.content)} 字符)")
        except Exception as e:
            return Result(ok=False, error=str(e))
