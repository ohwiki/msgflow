"""Jina Reader 代理抓取"""
import re
import urllib.request

from capabilities.logger import get_logger

log = get_logger("fetcher.jina")


def fetch(url: str) -> str | None:
    log.info("jina fetch start", extra={"url": url[:80]})
    try:
        req = urllib.request.Request(
            f"https://r.jina.ai/{url}",
            headers={"User-Agent": "msgflow/1.0"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8", errors="replace")
        if re.search(r"captcha|验证|环境异常", content, re.IGNORECASE):
            log.warning("jina blocked by captcha", extra={"url": url[:80]})
            return None
        if not content.strip():
            log.warning("jina returned empty", extra={"url": url[:80]})
            return None
        log.info("jina fetch ok", extra={"length": len(content)})
        return content
    except Exception as e:
        log.error("jina fetch failed", extra={"url": url[:80], "error": str(e)})
        return None
