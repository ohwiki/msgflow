"""Pipeline: publish a file to a target platform."""

from pathlib import Path
from lib.interfaces import PipelineResult
from lib.registry import register_pipeline, dispatch_publish
from lib.logger import get_logger

log = get_logger("pipeline.publish")


@register_pipeline
class PublishPipeline:
    name = "publish"

    def execute(self, target: str, **kwargs: object) -> PipelineResult:
        path = Path(target)
        if not path.is_file():
            return PipelineResult(output=f"错误：文件不存在 {target}", success=False)

        content = path.read_text(encoding="utf-8")
        title = path.stem.replace("-", " ").replace("_", " ")
        publisher_name = str(kwargs.get("publisher", "mowen"))

        result = dispatch_publish(publisher_name, title=title, content=content, metadata={"tags": ["msgflow"]})
        if result.success:
            log.info("Published", extra={"data": {"file": target, "publisher": publisher_name}})
            return PipelineResult(output=f"✅ 已发布到 {publisher_name}：{target}")
        return PipelineResult(output=f"❌ 发布失败：{result.error}", success=False)
