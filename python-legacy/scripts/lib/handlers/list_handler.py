"""List 指令处理器 — 列出最近文章（需要 API 调用）。"""

from ..interfaces import Command, Context, Result
from ..registry import register_handler


@register_handler
class ListHandler:
    def can_handle(self, command: Command) -> bool:
        return command.action == "list"

    def execute(self, command: Command, ctx: Context) -> Result:
        # TODO: 调用 Worker API 获取文章列表
        # worker_url = ctx.env.get("WORKER_URL", "")
        # resp = requests.get(f"{worker_url}/api/articles?limit=5")
        return Result(ok=True, message="(list 功能待接入 Worker API)")
