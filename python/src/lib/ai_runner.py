"""AI runner capability — invokes LLM via NullClaw."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from pycore import logger

log = logger("ai_runner")


def run_skill(skill_name: str, prompt: str, timeout: int = 300, workspace: str | None = None) -> str | None:
    """Execute a skill via NullClaw agent."""
    cmd = ["nullclaw", "agent", "-m", prompt, "--skill", skill_name]
    cwd = workspace if workspace and Path(workspace).is_dir() else None

    log.info("Running skill", skill=skill_name, timeout=timeout)
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, cwd=cwd,
            env={**os.environ, "NO_COLOR": "1"},
        )
        if result.returncode != 0:
            log.error("Skill failed", skill=skill_name, stderr=result.stderr[:500])
            return None
        return result.stdout.strip() or None
    except subprocess.TimeoutExpired:
        log.error("Skill timed out", skill=skill_name, timeout=timeout)
        return None
    except FileNotFoundError:
        log.error("nullclaw binary not found")
        return None
