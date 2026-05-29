"""Pipeline: publish a file to a target platform."""

from __future__ import annotations

from pathlib import Path

from pycore import Result, logger

from writers import publish
from pipelines import pipelines

log = logger("pipeline.publish")


@pipelines.register
class PublishPipeline:
    name = "publish"

    def execute(self, target: str, **kwargs: object) -> Result:
        path = Path(target)
        if not path.is_file():
            return Result.fail(f"文件不存在: {target}")

        content = path.read_text(encoding="utf-8")
        title = path.stem.replace("-", " ").replace("_", " ")
        publisher_name = str(kwargs.get("publisher", "mowen"))

        success = publish(publisher_name, title=title, content=content)
        if success:
            log.info("Published", file=target, publisher=publisher_name)
            return Result.ok(f"✅ 已发布到 {publisher_name}：{target}")
        log.warning("Publish failed", file=target, publisher=publisher_name)
        return Result.fail(f"发布失败: {publisher_name}")
