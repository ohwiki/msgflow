"""msgflow task runner — unified CLI entry point."""

from __future__ import annotations

import sys

import typer

from pycore import Result, output_result, logger

log = logger("main")

app = typer.Typer(name="msgflow", no_args_is_help=True)


@app.command()
def fetch(url: str) -> None:
    """抓取 URL 为 Markdown"""
    _run("fetch", url)


@app.command()
def rewrite(url: str, style: str = "lu-xun") -> None:
    """AI 改写文章"""
    _run("rewrite", url, style=style)


@app.command()
def query(question: str) -> None:
    """查询知识库"""
    _run("query", question)


@app.command()
def distill(name: str) -> None:
    """蒸馏人物为 writer skill"""
    _run("distill", name)


@app.command()
def publish(file: str, publisher: str = "mowen") -> None:
    """发布文件"""
    _run("publish", file, publisher=publisher)


@app.command()
def skill(message: str, skill_name: str = typer.Option(..., "--skill")) -> None:
    """执行任意 skill"""
    from lib.ai_runner import run_skill as _run_skill
    result_text = _run_skill(skill_name, message)
    output_result(Result.ok(result_text) if result_text else Result.fail("skill 执行失败"))
    if not result_text:
        raise SystemExit(1)


def _run(pipeline_name: str, target: str, **kwargs: object) -> None:
    """Dispatch to a registered pipeline."""
    import fetchers  # noqa: F401 — trigger registration
    import writers  # noqa: F401
    import pipelines as _pipelines  # noqa: F401
    from pipelines import pipelines as registry

    handler = registry.get(pipeline_name)
    if not handler:
        output_result(Result.fail(f"未知 pipeline: {pipeline_name}"))
        raise SystemExit(1)

    result = handler.execute(target, **kwargs)
    output_result(result)
    if not result.success:
        raise SystemExit(1)


if __name__ == "__main__":
    app()
