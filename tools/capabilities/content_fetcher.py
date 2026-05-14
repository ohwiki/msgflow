"""统一内容抓取入口：按 URL 类型分发到 fetchers/"""
from capabilities.fetchers import feishu, weixin, jina, defuddle
from capabilities.logger import get_logger

log = get_logger("fetcher")


def fetch(url: str) -> str | None:
    """抓取 URL 内容为 Markdown，按 URL 类型分发"""
    log.info("fetch start", extra={"url": url})

    if "feishu.cn" in url or "larksuite.com" in url:
        content = feishu.fetch(url)
        if content:
            log.info("fetched via feishu", extra={"length": len(content)})
            return content
        log.warning("feishu failed, trying jina")

    if "mp.weixin.qq.com" in url:
        content = weixin.fetch(url)
        if content:
            log.info("fetched via weixin", extra={"length": len(content)})
            return content
        log.warning("weixin failed, trying jina")

    content = jina.fetch(url)
    if content:
        log.info("fetched via jina", extra={"length": len(content)})
        return content
    log.warning("jina failed, trying defuddle")

    content = defuddle.fetch(url)
    if content:
        log.info("fetched via defuddle", extra={"length": len(content)})
    else:
        log.error("all fetch methods failed", extra={"url": url})
    return content
