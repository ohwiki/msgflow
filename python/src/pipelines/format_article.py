"""Pipeline: download raw HTML from R2 → format to Markdown → callback Worker."""
from __future__ import annotations

import re

import requests
from pycore import Result, logger

from pipelines import pipelines

log = logger("pipeline.format_article")


@pipelines.register
class FormatArticlePipeline:
    name = "format-article"

    def execute(self, target: str, **kwargs: object) -> Result:
        config_url = str(kwargs.get("config_url", ""))
        article_id = str(kwargs.get("article_id", ""))
        if not config_url or not article_id:
            return Result.fail("Missing --config-url or --article-id")

        # 1. 获取配置（one-time token）
        resp = requests.get(config_url, timeout=30)
        if resp.status_code != 200:
            return Result.fail(f"Config fetch failed: HTTP {resp.status_code}")
        config = resp.json()

        # 2. 下载 R2 原始 HTML
        log.info("Downloading raw HTML from R2", key=config.get("r2_raw_key", ""))
        r2_resp = requests.get(
            f"https://api.cloudflare.com/client/v4/accounts/{config['cf_account_id']}/r2/buckets/msgflow-files/objects/{config['r2_raw_key']}",
            headers={"Authorization": f"Bearer {config['cf_api_token']}"},
            timeout=60,
        )
        if r2_resp.status_code != 200:
            return Result.fail(f"R2 download failed: HTTP {r2_resp.status_code}")

        # 3. 格式化（markdownify）
        from bs4 import BeautifulSoup
        from markdownify import markdownify as md

        soup = BeautifulSoup(r2_resp.text, "lxml")
        content_el = soup.select_one("#js_content") or soup.select_one("body")
        if not content_el:
            return Result.fail("No content found in HTML")

        for tag in content_el.find_all(["script", "style"]):
            tag.decompose()
        markdown = md(str(content_el), heading_style="ATX", code_language="")
        markdown = re.sub(r"\n{3,}", "\n\n", markdown).strip()

        # 4. 回调 Worker
        log.info("Sending callback", article_id=article_id, length=len(markdown))
        callback_resp = requests.post(
            config["callback_url"],
            json={"article_id": article_id, "markdown": markdown, "secret": config["callback_secret"]},
            timeout=30,
        )
        if callback_resp.status_code != 200:
            return Result.fail(f"Callback failed: HTTP {callback_resp.status_code}")

        return Result.ok(f"✅ 格式化完成，已回调 ({len(markdown)} chars)")
