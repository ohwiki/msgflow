# Feishu Fetcher 拆分设计文档

> 目标：将 `fetchers/feishu.py`（388 行 God Object）拆分为 3 个职责单一的模块。

## 现状问题

`FeishuFetcher` 同时负责：
1. OAuth token 管理（KV 读取、本地文件、refresh）
2. 飞书 API 调用（wiki 解析、获取 blocks、获取标题）
3. Block → Markdown 转换（20+ 种 block type 处理）
4. 图片下载

## 拆分方案

```
python/src/fetchers/
├── feishu.py              # FeishuFetcher（编排层，~50 行）
├── _feishu_auth.py        # FeishuAuth（token 管理，~80 行）
├── _feishu_api.py         # FeishuApiClient（API 调用，~80 行）
└── _feishu_parser.py      # FeishuBlockParser（block→markdown，~180 行）
```

用 `_` 前缀表示内部模块，不对外暴露。

---

## 模块设计

### `_feishu_auth.py` — Token 管理

```python
"""Feishu token management — KV / local file / refresh."""
from __future__ import annotations

from pycore import logger
from pycore.http import post as http_post, get as http_get, HttpError

log = logger("feishu.auth")

FEISHU_API_BASE = "https://open.feishu.cn/open-apis"


class FeishuAuth:
    """Resolve a valid access_token from multiple sources."""

    def get_token(self) -> str | None:
        """Try user token first, fallback to app token."""
        token = self._get_user_token()
        if token:
            return token
        return self._get_app_token()

    def _get_app_token(self) -> str | None:
        """Get tenant_access_token via app credentials."""
        # 从现有 _get_token(app_id, app_secret) 搬过来

    def _get_user_token(self) -> str | None:
        """Load user_access_token from KV or local file."""
        # 从现有 _get_user_token 搬过来

    def _get_token_from_kv(self) -> str | None:
        # 从现有搬过来

    def _refresh_user_token(self, refresh_token: str) -> dict | None:
        # 从现有搬过来
```

### `_feishu_api.py` — API 调用

```python
"""Feishu API client — document/wiki/block operations."""
from __future__ import annotations

from pycore import logger
from pycore.http import get as http_get, HttpError

log = logger("feishu.api")

FEISHU_API_BASE = "https://open.feishu.cn/open-apis"


class FeishuApiClient:
    """Stateless API client, receives token per call."""

    def get_wiki_node(self, token: str, wiki_token: str) -> str | None:
        # 从现有 _get_wiki_node 搬过来

    def get_doc_title(self, token: str, doc_id: str) -> str:
        # 从现有 _get_doc_title 搬过来

    def get_blocks(self, token: str, doc_id: str) -> list | None:
        # 从现有 _get_blocks 搬过来（含分页）

    def download_image(self, token: str, img_token: str, save_dir: str) -> str | None:
        # 从现有 _download_image 搬过来
```

### `_feishu_parser.py` — Block 转 Markdown

```python
"""Feishu block → Markdown converter."""
from __future__ import annotations

from pycore import logger

log = logger("feishu.parser")


class FeishuBlockParser:
    """Convert feishu document blocks to Markdown string."""

    def __init__(self, image_downloader=None):
        """image_downloader: callable(img_token) -> relative_path | None"""
        self._download_image = image_downloader

    def parse(self, blocks: list) -> str:
        # 从现有 _blocks_to_markdown 搬过来

    def _extract_text(self, elements: list) -> str:
        # 从现有搬过来

    def _format_markdown(self, title: str, doc_id: str, url: str, content: str) -> str:
        # 从现有搬过来
```

### `feishu.py` — 编排层（重写）

```python
"""Feishu document fetcher — orchestrates auth, API, and parsing."""
from __future__ import annotations

import re

from pycore import logger

from fetchers._registry import fetcher_registry as fetchers, FetchResult
from fetchers._feishu_auth import FeishuAuth
from fetchers._feishu_api import FeishuApiClient
from fetchers._feishu_parser import FeishuBlockParser

log = logger("fetcher.feishu")


@fetchers.register
class FeishuFetcher:
    name = "feishu"

    def __init__(self):
        self._auth = FeishuAuth()
        self._api = FeishuApiClient()

    def can_handle(self, url: str) -> bool:
        return "feishu.cn" in url or "larksuite.com" in url

    def fetch(self, url: str) -> FetchResult | None:
        token = self._auth.get_token()
        if not token:
            log.error("No valid feishu token available")
            return None

        doc_id, doc_type = self._parse_url(url)
        if not doc_id:
            log.error("Cannot parse feishu URL", url=url)
            return None

        if doc_type == "wiki":
            real_id = self._api.get_wiki_node(token, doc_id)
            if not real_id:
                log.error("Cannot resolve wiki node", doc_id=doc_id)
                return None
            doc_id = real_id

        title = self._api.get_doc_title(token, doc_id)
        blocks = self._api.get_blocks(token, doc_id)
        if blocks is None:
            log.error("Failed to get document blocks", doc_id=doc_id)
            return None

        # Image downloader closure
        def download_img(img_token: str) -> str | None:
            return self._api.download_image(token, img_token, "images")

        parser = FeishuBlockParser(image_downloader=download_img)
        content = parser.parse(blocks)
        md = parser.format_markdown(title, doc_id, url, content)

        log.info("Feishu fetch success", title=title, length=len(md))
        return FetchResult(content=md, url=url)

    def _parse_url(self, url: str) -> tuple[str | None, str | None]:
        patterns = [
            (r"feishu\.cn/docx/([A-Za-z0-9]+)", "docx"),
            (r"feishu\.cn/docs/([A-Za-z0-9]+)", "doc"),
            (r"feishu\.cn/wiki/([A-Za-z0-9]+)", "wiki"),
            (r"larksuite\.com/docx/([A-Za-z0-9]+)", "docx"),
            (r"larksuite\.com/wiki/([A-Za-z0-9]+)", "wiki"),
        ]
        for pattern, doc_type in patterns:
            m = re.search(pattern, url)
            if m:
                return m.group(1), doc_type
        return None, None
```

---

## 执行顺序

```
Step 1: 新建 _feishu_auth.py（从 feishu.py 剪切 token 相关方法）
Step 2: 新建 _feishu_api.py（从 feishu.py 剪切 API 调用方法）
Step 3: 新建 _feishu_parser.py（从 feishu.py 剪切 block 转换方法）
Step 4: 重写 feishu.py 为编排层（~50 行）
Step 5: 运行 pytest 验证
```

## 重要约束

1. **纯搬迁** — 不改变任何业务逻辑，只拆分文件
2. **保持注册** — `FeishuFetcher` 仍然用 `@fetchers.register` 注册
3. **保持接口** — `can_handle` + `fetch` 签名不变
4. **日志保留** — 刚补的日志全部保留在对应的新模块中
5. **内部模块** — `_` 前缀文件不对外暴露，只有 `feishu.py` 是公开的

## 文件变更清单

### 新建

- `python/src/fetchers/_feishu_auth.py`
- `python/src/fetchers/_feishu_api.py`
- `python/src/fetchers/_feishu_parser.py`

### 重写

- `python/src/fetchers/feishu.py`（388 行 → ~50 行）

---

## 方法归属表

从现有 `feishu.py` 的方法，按目标模块分配：

### → `_feishu_auth.py`

| 方法 | 说明 |
|------|------|
| `_get_user_token` | KV / 本地文件 / 过期判断 |
| `_get_token_from_kv` | 从 Worker KV 读 token |
| `_refresh_user_token` | 用 refresh_token 刷新 |
| `_get_token(app_id, app_secret)` | 获取 tenant_access_token |

对外暴露：`FeishuAuth.get_token() -> str | None`（内部先试 user token，再试 app token）

### → `_feishu_api.py`

| 方法 | 说明 |
|------|------|
| `_get_wiki_node` | wiki token → 真实 doc_id |
| `_get_doc_title` | 获取文档标题 |
| `_get_blocks` | 分页获取所有 blocks |
| `_download_image` | 下载图片到本地 |

对外暴露：`FeishuApiClient` 的 4 个公开方法（去掉 `_` 前缀）

### → `_feishu_parser.py`

| 方法 | 说明 |
|------|------|
| `_blocks_to_markdown` | 主转换逻辑（遍历 blocks） |
| `_extract_text` | 从 elements 提取纯文本 |
| `_format_markdown` | 拼接 frontmatter + content |

对外暴露：
- `FeishuBlockParser.parse(blocks) -> str`（对应 `_blocks_to_markdown`）
- `FeishuBlockParser.format_markdown(title, doc_id, url, content) -> str`（对应 `_format_markdown`，注意：公开方法不带 `_` 前缀）

### → `feishu.py`（保留）

| 方法 | 说明 |
|------|------|
| `can_handle` | URL 匹配 |
| `fetch` | 编排：auth → api → parser |
| `_parse_url` | URL 正则解析（简单，留在编排层） |

---

## 常量处理

`FEISHU_API_BASE = "https://open.feishu.cn/open-apis"` 只在 `_feishu_auth.py` 和 `_feishu_api.py` 中使用。

方案：在 `_feishu_api.py` 顶部定义，`_feishu_auth.py` 从它 import：
```python
from fetchers._feishu_api import FEISHU_API_BASE
```

---

## 类型签名

`FeishuBlockParser` 的 `image_downloader` 参数类型：
```python
from typing import Callable

class FeishuBlockParser:
    def __init__(self, image_downloader: Callable[[str], str | None] | None = None):
        self._download_image = image_downloader
```
