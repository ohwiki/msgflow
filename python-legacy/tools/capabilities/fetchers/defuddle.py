"""Defuddle 代理抓取（兜底）"""
import urllib.request

from capabilities.logger import get_logger

log = get_logger("fetcher.defuddle")


def fetch(url: str) -> str | None:
    log.info("defuddle fetch start", extra={"url": url[:80]})
    try:
        req = urllib.request.Request(
            f"https://defuddle.md/{url}",
            headers={"User-Agent": "msgflow/1.0"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            content = resp.read().decode("utf-8", errors="replace")
        if not content.strip():
            log.warning("defuddle returned empty", extra={"url": url[:80]})
            return None
        log.info("defuddle fetch ok", extra={"length": len(content)})
        return content
    except Exception as e:
        log.error("defuddle fetch failed", extra={"url": url[:80], "error": str(e)})
        return None
