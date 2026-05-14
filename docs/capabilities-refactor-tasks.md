# msgflow capabilities 重构 — 设计与任务

## 目标

将分散在 `skills/` 和 `tools/capabilities/` 的抓取/写入逻辑统一到 `tools/capabilities/` 下，消除冗余，skills 只保留 SKILL.md 指令描述。

## 当前结构（有冗余）

```
tools/capabilities/
├── content_fetcher.py      # 抓取入口（只有 Jina/Defuddle）
├── write_feishu.py         # 写入飞书
├── feishu_cli.py           # lark-cli 封装
├── publisher.py            # 写入墨问
└── ...

skills/markdown-proxy/scripts/
├── fetch_feishu.py         # 飞书 API 抓取（冗余！）
└── fetch_weixin.py         # 公众号 Playwright 抓取（冗余！）

tools/content-fetch/
└── fetch_weixin.py         # 又一份公众号抓取（冗余！）
```

## 目标结构

```
tools/capabilities/
├── content_fetcher.py      # 统一入口（按 URL 类型分发到 fetchers/）
├── fetchers/
│   ├── __init__.py
│   ├── jina.py             # Jina Reader（通用网页）
│   ├── defuddle.py         # Defuddle（兜底）
│   ├── feishu.py           # 飞书 API（从 skills/scripts/ 移入）
│   └── weixin.py           # 公众号 Playwright（从 tools/content-fetch/ 移入）
├── writers/
│   ├── __init__.py
│   ├── feishu.py           # 写入飞书（现有 write_feishu.py 移入）
│   └── mowen.py            # 写入墨问（现有 publisher.py 移入）
├── feishu_cli.py           # lark-cli 封装（保留）
├── ai_runner.py            # 保留
├── cover.py                # 保留
├── file_store.py           # 保留
└── logger.py               # 保留

skills/markdown-proxy/
├── SKILL.md                # 修改：脚本路径改为引用 tools/capabilities/fetchers/
└── scripts/                # 删除（逻辑已移到 capabilities/fetchers/）

tools/content-fetch/        # 删除（逻辑已移到 capabilities/fetchers/weixin.py）
```

## 关键改动

### content_fetcher.py 改为分发器

```python
from capabilities.fetchers import feishu, weixin, jina, defuddle

def fetch(url: str) -> str | None:
    if "feishu.cn" in url or "larksuite.com" in url:
        content = feishu.fetch(url)
        if content:
            return content
    if "mp.weixin.qq.com" in url:
        content = weixin.fetch(url)
        if content:
            return content
    content = jina.fetch(url)
    if content:
        return content
    return defuddle.fetch(url)
```

### SKILL.md 修改

```
# 原来
python "$HOME/.codex/skills/markdown-proxy/scripts/fetch_feishu.py" "URL"

# 改为
python tools/capabilities/fetchers/feishu.py "URL"
```

## Tasks

### T1: 创建 fetchers/ 目录结构

1. 创建 `tools/capabilities/fetchers/__init__.py`
2. 从 `content_fetcher.py` 提取 `_try_jina` → `fetchers/jina.py`
3. 从 `content_fetcher.py` 提取 `_try_defuddle` → `fetchers/defuddle.py`
4. 从 `skills/markdown-proxy/scripts/fetch_feishu.py` 移动 → `fetchers/feishu.py`
5. 从 `tools/content-fetch/fetch_weixin.py` 移动 → `fetchers/weixin.py`

每个 fetcher 统一接口：`def fetch(url: str) -> str | None`

**验证：** `python -c "from capabilities.fetchers import jina, defuddle, feishu, weixin"`
**通过标准：** 无 ImportError

### T2: 重写 content_fetcher.py 为分发器

按 URL 类型分发到对应 fetcher，保留 fallback 链。

**验证：** `cd tools && python -c "from capabilities.content_fetcher import fetch; print(fetch('https://my.feishu.cn/wiki/E9plw7LjhigyivkB4JmcHHcInie')[:50])"`
**通过标准：** 输出飞书文档内容前 50 字

### T3: 创建 writers/ 目录

1. `write_feishu.py` → `writers/feishu.py`
2. `publisher.py` 中的墨问逻辑 → `writers/mowen.py`
3. 更新 `pipelines/rewrite.py` 和 `pipelines/publish_feishu.py` 的 import

**验证：** `python -c "from capabilities.writers import feishu, mowen"`
**通过标准：** 无 ImportError

### T4: 更新 SKILL.md 路径引用

修改 `skills/markdown-proxy/SKILL.md` 中的脚本路径。

**验证：** `grep "fetchers/feishu" skills/markdown-proxy/SKILL.md`
**通过标准：** 有匹配

### T5: 删除冗余文件

1. 删除 `skills/markdown-proxy/scripts/`（已移到 fetchers/）
2. 删除 `tools/content-fetch/`（已移到 fetchers/）
3. 删除 `tools/capabilities/write_feishu.py`（已移到 writers/）

**验证：** `ls skills/markdown-proxy/scripts/ 2>&1` 应报 No such file
**通过标准：** 目录不存在

### T6: 端到端测试

**验证：**
```bash
cd tools
# 飞书抓取
python -c "from capabilities.content_fetcher import fetch; r=fetch('https://my.feishu.cn/wiki/E9plw7LjhigyivkB4JmcHHcInie'); print(len(r) if r else 'FAIL')"
# 普通 URL 抓取
python -c "from capabilities.content_fetcher import fetch; r=fetch('https://github.com/ohwiki/msgflow'); print(len(r) if r else 'FAIL')"
```
**通过标准：** 两个都输出数字（内容长度），不是 FAIL

## 注意事项

- `fetch_feishu.py` 既是模块又可以独立运行（`if __name__ == "__main__"`），移动后保留 CLI 入口
- `fetch_weixin.py` 依赖 Playwright，本地可能没装，fetcher 里要 try/except 处理
- 改完后 workflow 里的 `python3 tools/content-fetch/fetch_weixin.py` 路径也要更新
- `.env` 里的 FEISHU_APP_ID/SECRET 需要被 fetchers/feishu.py 读到
