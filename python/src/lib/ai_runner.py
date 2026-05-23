"""AI runner capability — invokes LLM via NullClaw or direct API."""

import subprocess
import os
from pathlib import Path
from lib.logger import get_logger

log = get_logger("ai_runner")


def run_skill(skill_name: str, prompt: str, timeout: int = 300, workspace: str | None = None) -> str | None:
    """Execute a skill via NullClaw agent. Returns output text or None on failure."""
    cmd = ["nullclaw", "agent", "-m", prompt, "--skill", skill_name]
    cwd = workspace if workspace and Path(workspace).is_dir() else None

    log.info("Running skill", extra={"data": {"skill": skill_name, "timeout": timeout}})
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout, cwd=cwd,
            env={**os.environ, "NO_COLOR": "1"},
        )
        if result.returncode != 0:
            log.error("Skill failed", extra={"data": {"skill": skill_name, "stderr": result.stderr[:500]}})
            return None
        return result.stdout.strip() or None
    except subprocess.TimeoutExpired:
        log.error("Skill timed out", extra={"data": {"skill": skill_name, "timeout": timeout}})
        return None
    except FileNotFoundError:
        log.error("nullclaw binary not found")
        return None


def run_prompt(prompt: str, timeout: int = 300) -> str | None:
    """Run a bare prompt without a skill context."""
    cmd = ["nullclaw", "agent", "-m", prompt]

    log.info("Running prompt", extra={"data": {"prompt_len": len(prompt), "timeout": timeout}})
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            env={**os.environ, "NO_COLOR": "1"},
        )
        if result.returncode != 0:
            log.error("Prompt failed", extra={"data": {"stderr": result.stderr[:500]}})
            return None
        return result.stdout.strip() or None
    except subprocess.TimeoutExpired:
        log.error("Prompt timed out", extra={"data": {"timeout": timeout}})
        return None
    except FileNotFoundError:
        log.error("nullclaw binary not found")
        return None
