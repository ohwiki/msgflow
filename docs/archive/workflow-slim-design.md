# Workflow 瘦身设计文档

> 目标：将 workflow 中的业务逻辑收进 Python CLI，workflow 只做参数传入和环境 setup。

## 现状问题

| Workflow | 问题 |
|----------|------|
| `fetch-article.yml` | curl 下载 R2 + curl 回调写在 shell 里，`scripts/cli.py format` 已被删 |
| `rewrite-article.yml` | 调 `tools/run-task.sh`（不存在）+ NullClaw 配置重复 |
| `feishu-task.yml` | 配置加载逻辑 50 行 shell，但核心调用已走 `tools/run_task.py`（老路径） |

## 原则

- Workflow 只做：checkout → 安装环境 → 调 Python CLI → commit/push
- 业务逻辑（下载、格式化、回调、配置解析）全部在 Python CLI 中
- NullClaw 环境配置是 CI 特有的（安装二进制、设置 config），保留在 workflow 中可接受

---

## Phase A: 修复 `fetch-article.yml`

### 问题分析

1. `ref: feat/worker-content-system-v2` — 引用了老分支，应改为 `main`
2. `python scripts/cli.py format` — `scripts/cli.py` 已被删（在 python-legacy 中）
3. curl 下载 R2 + curl 回调 — 应收进 Pipeline

### 方案

新建 `python/src/pipelines/format_article.py` 作为 Pipeline，在 `run_task.py` 中新增 `format-article` 命令。

**新建** `python/src/pipelines/format_article.py`：

```python
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
```

**修改** `python/src/pipelines/__init__.py`，新增 import：

```python
from pipelines.format_article import FormatArticlePipeline  # noqa: E402, F401
```

**修改** `python/src/run_task.py`，新增命令：

```python
@app.command(name="format-article")
def format_article(
    config_url: str = typer.Option(..., "--config-url"),
    article_id: str = typer.Option(..., "--article-id"),
) -> None:
    """下载 R2 原始 HTML → 格式化为 Markdown → 回调 Worker"""
    _run("format-article", "", config_url=config_url, article_id=article_id)
```

### Workflow 改为

```yaml
name: Fetch & Format Article

on:
  workflow_dispatch:
    inputs:
      article_id:
        description: 'Article ID'
        required: true
        type: string
      config_url:
        description: 'Worker config URL (one-time token)'
        required: true
        type: string

jobs:
  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -e python/ requests beautifulsoup4 lxml markdownify

      - name: Format and callback
        run: |
          python python/src/run_task.py format-article \
            --config-url "${{ inputs.config_url }}" \
            --article-id "${{ inputs.article_id }}"
```

从 66 行 → 28 行，零 curl，零 jq，统一走 `run_task.py`。

---

## Phase B: 修复 `rewrite-article.yml`

### 问题分析

1. 调 `bash tools/run-task.sh rewrite` — 这个文件不存在
2. NullClaw 配置和 `feishu-task.yml` 重复
3. 应该调 `python/src/run_task.py rewrite`

### Workflow 改为

```yaml
name: Rewrite Article

on:
  workflow_dispatch:
    inputs:
      source_file:
        description: 'Markdown file path'
        required: true
        type: string
      style:
        description: 'Writing style'
        required: true
        type: choice
        options:
          - lu-xun
          - ma-sanli
          - xu-zhimo

permissions:
  contents: write

jobs:
  rewrite-article:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4

      - name: Validate source file
        run: test -f "${{ github.event.inputs.source_file }}"

      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install NullClaw
        run: |
          curl -sL -o /usr/local/bin/nullclaw https://github.com/nullclaw/nullclaw/releases/download/v2026.5.4/nullclaw-linux-x86_64.bin
          chmod +x /usr/local/bin/nullclaw

      - name: Configure NullClaw
        run: |
          nullclaw onboard --api-key "${{ secrets.NULLCLAW_API_KEY }}" --provider "custom:${{ secrets.NULLCLAW_BASE_URL }}" --model "${{ vars.NULLCLAW_MODEL || 'mimo-v2.5-pro' }}"
          nullclaw config set agent.message_timeout_secs 600
          nullclaw config set autonomy.level autonomous
          nullclaw config set autonomy.allowed_commands '["*"]'

      - name: Install writer skill
        run: |
          mkdir -p ~/.nullclaw/workspace/skills
          cp -r "skills/writers/${{ github.event.inputs.style }}-writer" ~/.nullclaw/workspace/skills/

      - name: Install Python dependencies
        run: pip install -e python/

      - name: Rewrite article
        run: python python/src/run_task.py rewrite "${{ github.event.inputs.source_file }}" --style "${{ github.event.inputs.style }}"

      - name: Commit and push
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add rewritten/
          git diff --cached --quiet || (git commit -m "Rewrite ${{ github.event.inputs.source_file }} in ${{ github.event.inputs.style }} style" && git push)
```

核心改动：`bash tools/run-task.sh rewrite` → `python src/run_task.py rewrite`

---

## Phase C: 修复 `feishu-task.yml`

### 问题分析

1. `python3 tools/run_task.py` — 老路径，应改为 `python/src/run_task.py`
2. 配置加载逻辑（50 行 shell）是必要的（从 Worker 拉 secrets + fallback 到 GitHub Secrets），不适合收进 Python（因为需要设置 `$GITHUB_ENV`）
3. NullClaw 安装/配置是 CI 环境 setup，保留在 workflow 可接受

### 方案：只修路径

在 `Install dependencies` 步骤的 `run:` block 末尾追加一行（和现有的 `pip install playwright ...` 放在一起）：
```bash
pip install -e python/
```

即该步骤变为：
```yaml
      - name: Install dependencies
        run: |
          pip install playwright beautifulsoup4 lxml requests markdownify pypinyin
          pip install -e python/
          playwright install chromium
```

将 `Execute task` 步骤中的：
```bash
python3 tools/run_task.py rewrite "$TARGET" --style "$STYLE"
python3 tools/run_task.py skill "$TARGET" --skill "$SKILL"
python3 tools/run_task.py "$ACTION" "$TARGET"
```

改为：
```bash
python python/src/run_task.py rewrite "$TARGET" --style "$STYLE"
python python/src/run_task.py skill "$TARGET" --skill "$SKILL"
python python/src/run_task.py "$ACTION" "$TARGET"
```

---

## 执行顺序

```
Step 1: 新建 python/src/scripts/format_article.py
Step 2: 重写 fetch-article.yml
Step 3: 重写 rewrite-article.yml
Step 4: 修复 feishu-task.yml 的路径
Step 5: 验证（tsc + pytest）
```

---

## 重要约束

1. **NullClaw 安装/配置保留在 workflow** — 这是 CI 环境 setup，不是业务逻辑
2. **feishu-task.yml 的配置加载保留在 shell** — 需要设置 `$GITHUB_ENV`，Python 做不到
3. **不改变业务逻辑** — 只改调用路径和封装方式

---

## 文件变更清单

### 新建

- `python/src/pipelines/format_article.py`（FormatArticlePipeline：R2 下载 + 格式化 + 回调）

### 修改

- `python/src/pipelines/__init__.py`（新增 FormatArticlePipeline import）
- `python/src/run_task.py`（新增 `format-article` 命令）
- `.github/workflows/fetch-article.yml`（重写，调 `run_task.py format-article`）
- `.github/workflows/rewrite-article.yml`（重写，调 `run_task.py rewrite`）
- `.github/workflows/feishu-task.yml`（只改 `tools/run_task.py` → `python/src/run_task.py` 路径）
