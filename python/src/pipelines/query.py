"""Pipeline: query knowledge base via AI."""

from lib.interfaces import PipelineResult
from lib.registry import register_pipeline
from lib.ai_runner import run_skill
from lib.logger import get_logger

log = get_logger("pipeline.query")


@register_pipeline
class QueryPipeline:
    name = "query"

    def execute(self, target: str, **kwargs: object) -> PipelineResult:
        prompt = (
            f"请执行 Query 操作。问题：{target}。"
            f"先读 wiki/index.md 找相关页面，然后综合回答。"
        )
        result = run_skill("llmwiki-agent", prompt, timeout=300, workspace="llmwiki")
        if not result:
            return PipelineResult(output="错误：查询失败", success=False)

        log.info("Query complete", extra={"data": {"question": target[:50]}})
        return PipelineResult(output=result)
