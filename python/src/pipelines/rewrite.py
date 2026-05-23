"""Pipeline: fetch → AI rewrite → save → publish."""

from pathlib import Path
from lib.interfaces import PipelineResult
from lib.registry import register_pipeline, dispatch_fetch, dispatch_publish
from lib.ai_runner import run_skill
from lib.file_store import save
from lib.logger import get_logger

log = get_logger("pipeline.rewrite")


@register_pipeline
class RewritePipeline:
    name = "rewrite"

    def execute(self, target: str, **kwargs: object) -> PipelineResult:
        style = str(kwargs.get("style", "lu-xun"))

        # 1. Get content
        if target.startswith("http"):
            result = dispatch_fetch(target)
            article = result.content if result else None
        else:
            path = Path(target)
            article = path.read_text(encoding="utf-8") if path.exists() else None

        if not article:
            return PipelineResult(output="错误：无法获取文章内容", success=False)

        # 2. AI rewrite
        prompt = f"请用你的风格改写以下文章。只输出改写后的完整文章正文。\n\n{article}"
        rewritten = run_skill(f"{style}-writer", prompt, timeout=300)
        if not rewritten:
            return PipelineResult(output="错误：改写失败", success=False)

        # 3. Save
        path_str = save(rewritten, directory="rewritten", prefix=style)

        # 4. Publish (optional)
        publish_result = dispatch_publish("mowen", title=f"{style} 改写", content=rewritten, metadata={"tags": [style, "改写"]})

        output = rewritten
        if publish_result.success:
            output += "\n\n---\n✅ 已发布到墨问"

        log.info("Rewrite complete", extra={"data": {"style": style, "path": path_str}})
        return PipelineResult(output=output, artifacts=[path_str])
