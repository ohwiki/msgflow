"""Pipeline: query knowledge base via AI."""

from __future__ import annotations

from pycore import Result, logger

from lib.ai_runner import run_skill
from pipelines import pipelines

log = logger("pipeline.query")


@pipelines.register
class QueryPipeline:
    name = "query"

    def execute(self, target: str, **kwargs: object) -> Result:
        prompt = f"请执行 Query 操作。问题：{target}。先读 wiki/index.md 找相关页面，然后综合回答。"
        result = run_skill("llmwiki-agent", prompt, timeout=300, workspace="llmwiki")
        if not result:
            return Result.fail("查询失败")

        log.info("Query complete", question=target[:50])
        return Result.ok(result)
