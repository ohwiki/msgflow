"""Pipeline: distill a person into a writer skill."""

import re
from pathlib import Path
from lib.interfaces import PipelineResult
from lib.registry import register_pipeline
from lib.ai_runner import run_skill
from lib.logger import get_logger

log = get_logger("pipeline.distill")

_NAME_MAP = {
    "苏东坡": "su-dongpo", "苏轼": "su-shi", "马三立": "ma-sanli",
    "徐志摩": "xu-zhimo", "老舍": "lao-she", "李白": "li-bai",
    "鲁迅": "lu-xun",
}


@register_pipeline
class DistillPipeline:
    name = "distill"

    def execute(self, target: str, **kwargs: object) -> PipelineResult:
        name = target.strip().strip("<>")
        slug = self._get_slug(name)
        target_dir = Path(f"skills/writers/{slug}-writer")

        prompt = (
            f"请蒸馏：{name}。按女娲流程执行，"
            f"生成的 SKILL.md 保存到 skills/writers/{slug}-writer/ 目录下。"
            f"注意：生成的是一个 writer skill，name 字段必须是 {slug}-writer。"
        )
        result = run_skill("nuwa-skill", prompt, timeout=600)
        if not result:
            return PipelineResult(output="错误：蒸馏失败", success=False)

        log.info("Distill complete", extra={"data": {"name": name, "slug": slug}})
        artifacts = [str(target_dir / "SKILL.md")] if (target_dir / "SKILL.md").exists() else []
        return PipelineResult(output=result, artifacts=artifacts)

    def _get_slug(self, name: str) -> str:
        if name in _NAME_MAP:
            return _NAME_MAP[name]
        try:
            from pypinyin import lazy_pinyin
            return "-".join(lazy_pinyin(name))
        except ImportError:
            return re.sub(r"[^a-z0-9-]", "", name.lower().replace(" ", "-")) or "unknown"
