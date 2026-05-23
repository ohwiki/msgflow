"""Pipeline: distill a person into a writer skill."""

from __future__ import annotations

import re
from pathlib import Path

from pycore import Result, logger

from lib.ai_runner import run_skill
from pipelines import pipelines

log = logger("pipeline.distill")

_NAME_MAP = {
    "苏东坡": "su-dongpo", "马三立": "ma-sanli", "徐志摩": "xu-zhimo",
    "老舍": "lao-she", "李白": "li-bai", "鲁迅": "lu-xun",
}


@pipelines.register
class DistillPipeline:
    name = "distill"

    def execute(self, target: str, **kwargs: object) -> Result:
        name = target.strip().strip("<>")
        slug = self._get_slug(name)
        target_dir = Path(f"skills/writers/{slug}-writer")

        prompt = (
            f"请蒸馏：{name}。按女娲流程执行，"
            f"生成的 SKILL.md 保存到 skills/writers/{slug}-writer/ 目录下。"
        )
        result = run_skill("nuwa-skill", prompt, timeout=600)
        if not result:
            return Result.fail("蒸馏失败")

        log.info("Distill complete", name=name, slug=slug)
        artifacts = [str(target_dir / "SKILL.md")] if (target_dir / "SKILL.md").exists() else []
        return Result.ok(result, artifacts=artifacts)

    def _get_slug(self, name: str) -> str:
        if name in _NAME_MAP:
            return _NAME_MAP[name]
        try:
            from pypinyin import lazy_pinyin
            return "-".join(lazy_pinyin(name))
        except ImportError:
            return re.sub(r"[^a-z0-9-]", "", name.lower()) or "unknown"
