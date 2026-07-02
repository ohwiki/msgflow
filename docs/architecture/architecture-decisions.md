# 技术架构与决策记录

> 本文档记录 msgflow v2 的关键技术选型和架构决策，供后续开发参考。

## 定位

基于 Cloudflare 免费层的个人内容系统。核心流程：**采集 → 清洗 → 归档 → 展示**。

设计原则：
- 零服务器成本（Cloudflare Worker + GitHub Actions 均免费）
- 用户只付 AI 模型 API 费用
- 全 serverless，无状态

## 技术栈选型

| 层 | 选型 | 决策理由 |
|---|------|---------|
| 语言 | TypeScript (strict) | 类型安全、Worker 原生支持 |
| CSS | Tailwind CSS 4 (CDN) | 零构建、实用类优先 |
| 组件库 | daisyUI 5 (CDN) | 语义化 class，减少 class 堆叠 |
| 模板 | Mustache (.mustache 文件) | 逻辑与视图分离，auto-escape 防 XSS |
| 交互 | HTMX 2.0 (CDN) | 声明式，无需前端框架 |
| 构建 | wrangler (esbuild) | TS → 单文件 bundle |
| 重型任务 | GitHub/GitLab Actions | Prettier、AI 改写等超 30s 的任务 |

## 存储三层架构

| 存储 | 用途 | 特点 |
|------|------|------|
| **KV** | 配置、会话、token | 低延迟 key-value，无查询能力 |
| **D1** | 文章索引（标题、状态、标签、时间） | SQLite，支持 WHERE/ORDER/JOIN |
| **R2** | 原始 HTML、Markdown、图片 | 大文件对象存储，按 key 存取 |

数据流：
```
抓取 → R2（存原始 HTML）→ D1（存元数据索引）→ R2（存清洗后 Markdown）
```

## 内容来源路由

所有来源通过 URL 自动识别，路由到对应 Fetcher：

| URL 特征 | 来源 | 抓取方式 |
|----------|------|---------|
| `mp.weixin.qq.com` | 微信公众号 | HTTP + Referer 头 |
| `feishu.cn` / `larksuite.com` | 飞书文档 | 飞书 Open API |
| `twitter.com` / `x.com` | Twitter | r.jina.ai 代理 |
| `.xml` / `/feed` / `/rss` | RSS | XML 解析 |
| 其他 | 通用网页 | 级联：jina → defuddle → 直接 fetch |

## 文章状态机

```
raw → cleaned → rewritten → published
 │                              ↑
 └──── (Actions 回调) ──────────┘
```

- `raw`：刚抓取，存了原始 HTML
- `cleaned`：转为 Markdown（Worker 内 turndown 或 Actions Prettier）
- `rewritten`：AI 改写完成
- `published`：已发布到外部平台

## 认证方案

| 方式 | 场景 |
|------|------|
| 密码登录 | 默认方式，hash 存 KV |
| Google OAuth | 可选，限制 allowed_emails |
| Session Cookie | 登录后 7 天有效，存 KV |

Admin 路由通过 `authMiddleware` 统一保护，公开 API 路由不鉴权。

## Worker ↔ Actions 交互

```
用户操作 → Worker 触发 workflow_dispatch → Actions 执行重型任务
                                            ↓
Worker ← POST /api/callback (带 secret) ← Actions 完成
```

- `CALLBACK_SECRET` 验证回调来源
- Actions 从 Worker `/api/ci-config` 拉取运行时配置
- 失败不阻塞 Worker 主流程

## D1 Schema

```sql
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  source_type TEXT NOT NULL,    -- weixin | feishu | rss | twitter | web
  source_name TEXT DEFAULT '',
  status TEXT DEFAULT 'raw',    -- raw | cleaned | rewritten | published
  tags TEXT DEFAULT '[]',       -- JSON array
  summary TEXT DEFAULT '',
  r2_raw_key TEXT,
  r2_md_key TEXT,
  fetched_at TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## KV 键名约定

| Key | 用途 |
|-----|------|
| `auth_config` | 认证配置（mode、password_hash、allowed_emails） |
| `session:<id>` | 用户会话 |
| `feishu_user_token` | 飞书 OAuth token（定时刷新） |
| `github_token` / `github_repo` | Git 集成配置 |
| `tavily_api_key` / `exa_api_key` | 第三方抓取 API |
| `easyclaude_keys` | EasyClaude 余额查询 key 列表 |

## 关键决策备忘

1. **为什么不用框架（Hono/itty-router）**：路由简单（<30 条），原生 `if/match` 够用，减少依赖
2. **为什么 Mustache 不用 JSX**：Worker 环境无 React runtime，Mustache 是零依赖的纯模板
3. **为什么 HTMX 不用 SPA**：Admin 是内部工具，不需要离线/复杂状态，HTMX 开发速度最快
4. **为什么 R2 存文件不用 D1 BLOB**：D1 单行 1MB 限制，R2 无限制且有 CDN
5. **为什么 Actions 做重型任务**：Worker CPU 30s 限制，Prettier/AI 调用可能数分钟
6. **为什么 KV 存配置不用 D1**：配置是 key-value 模式，KV 读延迟 <1ms，无需 SQL 查询
