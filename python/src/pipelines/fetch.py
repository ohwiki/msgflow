"""Pipeline: fetch URL → save as Markdown."""

from lib.interfaces import PipelineResult
from lib.registry import register_pipeline, dispatch_fetch
from lib.file_store import save
from lib.logger import get_logger

log = get_logger("pipeline.fetch")


@register_pipeline
class FetchPipeline:
    name = "fetch"

    def execute(self, target: str, **kwargs: object) -> PipelineResult:
        result = dispatch_fetch(target)
        if not result:
            return PipelineResult(output="错误：无法获取内容", success=False)

        path = save(result.content, directory="articles", prefix="fetched")
        log.info("Fetched and saved", extra={"data": {"url": target, "path": path}})
        return PipelineResult(output=result.content, artifacts=[path])
