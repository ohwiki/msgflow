"""Pipeline: fetch URL → save as Markdown."""

from __future__ import annotations

from pycore import Result, logger

from fetchers import fetch
from lib.file_store import save
from pipelines import pipelines

log = logger("pipeline.fetch")


@pipelines.register
class FetchPipeline:
    name = "fetch"

    def execute(self, target: str, **kwargs: object) -> Result:
        content = fetch(target)
        if not content:
            return Result.fail("无法获取内容")

        path = save(content, directory="articles", prefix="fetched")
        log.info("Fetched and saved", url=target, path=path)
        return Result.ok(content, artifacts=[path])
