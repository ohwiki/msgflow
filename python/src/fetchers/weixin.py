"""WeChat article fetcher — Playwright headless browser."""

from __future__ import annotations

import asyncio
import re
from dataclasses import dataclass

from pycore import logger

from fetchers._registry import fetcher_registry as fetchers, FetchResult

log = logger("fetcher.weixin")


@fetchers.register
class WeixinFetcher:
    name = "weixin"

    def can_handle(self, url: str) -> bool:
        return "mp.weixin.qq.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        log.info("Fetching weixin article", url=url)
        try:
            result = asyncio.run(self._fetch_with_playwright(url))
        except Exception as e:
            log.error("Weixin fetch failed", error=str(e))
            return None

        if not result:
            return None
        return FetchResult(content=result, url=url)

    async def _fetch_with_playwright(self, url: str) -> str | None:
        try:
            from playwright.async_api import async_playwright
        except ImportError:
            log.error("playwright not installed")
            return None

        try:
            from bs4 import BeautifulSoup
            from markdownify import markdownify as md
        except ImportError:
            log.error("beautifulsoup4 or markdownify not installed")
            return None

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
                await page.wait_for_selector("#js_content", timeout=15000)
                html = await page.content()
            except Exception as e:
                log.error("Page load failed", error=str(e))
                await browser.close()
                return None
            await browser.close()

        soup = BeautifulSoup(html, "lxml")

        # Extract metadata
        title_el = soup.select_one("#activity-name")
        title = title_el.get_text(strip=True) if title_el else ""
        author_el = soup.select_one("#js_author_name") or soup.select_one(".rich_media_meta_text")
        author = author_el.get_text(strip=True) if author_el else ""
        time_el = soup.select_one("#publish_time")
        publish_time = time_el.get_text(strip=True) if time_el else ""

        # Extract content
        content_el = soup.select_one("#js_content")
        if not content_el:
            log.warning("No #js_content found")
            return None

        for tag in content_el.find_all(["script", "style"]):
            tag.decompose()
        for img in content_el.find_all("img"):
            src = img.get("data-src") or img.get("src") or ""
            if src:
                img["src"] = src
            else:
                img.decompose()

        # Fix code blocks: strip all spans/sections inside <pre>, keep only text
        for pre in content_el.find_all("pre"):
            # Replace <br> with newline before extracting text
            for br in pre.find_all("br"):
                br.replace_with("\n")
            code_text = pre.get_text()
            # Remove leading/trailing whitespace per line, collapse excess blank lines
            lines = [line.rstrip() for line in code_text.split("\n")]
            code_text = "\n".join(lines)
            code_text = re.sub(r"\n{3,}", "\n\n", code_text).strip()
            pre.clear()
            code_tag = soup.new_tag("code")
            code_tag.string = code_text
            pre.append(code_tag)

        content = md(str(content_el), heading_style="ATX", code_language="")
        content = re.sub(r"\n{3,}", "\n\n", content).strip()
        # Clean WeChat decorative blockquote markers
        content = re.sub(r"> ❝\n>\s*\n>", ">", content)
        content = re.sub(r"> ❝\s*\n", "", content)

        # Format as markdown with frontmatter
        parts = ["---"]
        if title:
            parts.append(f'title: "{title}"')
        if author:
            parts.append(f'author: "{author}"')
        if publish_time:
            parts.append(f'date: "{publish_time}"')
        parts.append(f'url: "{url}"')
        parts.append("---\n")
        if title:
            parts.append(f"# {title}\n")
        parts.append(content)

        log.info("Weixin fetch success", title=title, length=len(content))
        return "\n".join(parts)
