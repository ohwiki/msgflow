"""Pipeline: fetch → AI rewrite → save → publish."""

from __future__ import annotations

from pathlib import Path

from pycore import Result, logger

from fetchers import fetch
from lib.ai_runner import run_skill
from lib.file_store import save
from writers import publish
from pipelines import pipelines

log = logger("pipeline.rewrite")


@pipelines.register
class RewritePipeline:
    name = "rewrite"

    def execute(self, target: str, **kwargs: object) -> Result:
        style = str(kwargs.get("style", "lu-xun"))

        # 1. Get content
        if target.startswith("http"):
            article = fetch(target)
        else:
            path = Path(target)
            article = path.read_text(encoding="utf-8") if path.exists() else None

        if not article:
            return Result.fail("无法获取文章内容")

        # 2. AI rewrite
        prompt = f"请用你的风格改写以下文章。只输出改写后的完整文章正文。\n\n{article}"
        rewritten = run_skill(f"{style}-writer", prompt, timeout=300)
        if not rewritten:
            return Result.fail("改写失败")

        # 3. Save
        path_str = save(rewritten, directory="rewritten", prefix=style)

        # 4. Publish
        published = publish("mowen", title=f"{style} 改写", content=rewritten, tags=[style, "改写"])

        output = rewritten
        if published:
            output += "\n\n---\n✅ 已发布到墨问"

        log.info("Rewrite complete", style=style, path=path_str)
        return Result.ok(output, artifacts=[path_str])
