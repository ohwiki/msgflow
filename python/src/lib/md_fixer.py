"""Markdown format fixer — uses LLM to restore broken formatting."""

from __future__ import annotations

from pycore import logger, env
from pycore.http import post, HttpError

log = logger("md_fixer")


def fix_markdown(content: str, api_url: str | None = None, api_key: str | None = None) -> str:
    """Fix broken Markdown formatting via LLM. Returns fixed content or original on failure."""
    url = api_url or env("AI_API_URL", default="https://us.wucur.com/v1/chat/completions")
    key = api_key or env("AI_API_KEY")
    if not key:
        log.warning("AI_API_KEY not set, skipping format fix")
        return content

    prompt = (
        "以下Markdown格式错乱（换行丢失挤在一起）。"
        "请恢复正确的Markdown格式，只修复换行和缩进，不改内容。直接输出修复后的内容。\n\n"
        + content
    )

    log.info("Fixing markdown format", length=len(content))
    try:
        resp = post(
            url,
            json={
                "model": env("AI_MODEL", default="gpt-5.4"),
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max(len(content) * 2, 4096),
            },
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            timeout=60,
        )
        data = resp.json()
        fixed = data["choices"][0]["message"]["content"]
        log.info("Markdown fixed", original_len=len(content), fixed_len=len(fixed))
        return fixed
    except (HttpError, KeyError, IndexError) as e:
        log.error("Format fix failed, returning original", error=str(e))
        return content
