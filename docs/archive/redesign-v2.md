# msgflow 重构设计文档

## 定位

一个基于 Cloudflare 的个人内容系统。核心能力：采集 → 清洗 → 归档 → 展示。

## 技术栈

与 wucurcheck 对齐：

| 层 | 技术 | 说明 |
|---|------|------|
| 语言 | TypeScript (strict) | 零 any，Repository 模式 |
| CSS | Tailwind CSS 4 (CDN) | 实用类优先 |
| 组件库 | daisyUI 5 (CDN) | 语义化 class |
| 模板 | Mustache | 服务端渲染，HTML 与逻辑分离 |
| 交互 | HTMX 2.0 (CDN) | 声明式，无需写前端框架 |
| 客户端 | Islands 架构 | 按需加载的小 JS |
| 构建 | wrangler (esbuild) | TS → 单文件 bundle |
| 重型任务 | GitHub/GitLab Actions | Prettier、AI 改写等 |

## 存储方案

三层存储，各司其职：

| 存储 | 用途 | 数据示例 |
|------|------|---------|
| KV | 配置、会话、快速查找 | 用户 session、系统设置、抓取任务状态 |
| D1 | 结构化数据，支持查询/排序/筛选 | 文章索引（标题、标签、时间、来源、状态） |
| R2 | 大文件存储 | 原始 HTML 快照、转换后的 Markdown、图片缓存 |

**数据流：**

```
抓取 → R2（存原始 HTML）
     → D1（存元数据索引）
     → R2（存清洗后的 Markdown）
```

## 内容来源

### 统一入口

所有来源通过一个 URL 入口进入系统，系统自动识别类型并路由到对应的 fetcher：

| URL 特征 | 来源类型 | 抓取方式 |
|----------|---------|---------|
| `mp.weixin.qq.com` | 微信公众号 | HTTP fetch + Referer 头 |
| `feishu.cn` / `larksuite.com` | 飞书文档 | 飞书 Open API |
| `twitter.com` / `x.com` | Twitter/X | r.jina.ai 代理 |
| RSS URL（.xml / /feed） | RSS | 标准 XML 解析 |
| 其他 | 普通网页 | r.jina.ai → defuddle.md → 直接 fetch |

### 各来源获取方式说明

**微信公众号：** 纯 HTTP GET + `Referer: https://mp.weixin.qq.com`，服务端渲染，直接拿到正文。

**飞书文档：** 需要飞书应用的 App ID + Secret，通过 Open API 获取文档 blocks，转为 Markdown。Worker 里可以直接调（纯 HTTP）。

**Twitter/X：** 推文有反爬，直接 fetch 拿不到内容。方案：
- `https://r.jina.ai/https://x.com/user/status/123` — 免费代理，返回 Markdown
- 或用 Nitter 实例（开源 Twitter 前端，可自建）

**RSS：** 标准 XML，Worker 里 `fetch(rss_url)` + XML 解析即可。可用 `fast-xml-parser`（纯 JS，能在 Worker 跑）。

**普通网页：** 级联策略：r.jina.ai → defuddle.md → Worker 直接 fetch + 正则提取。

## 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ 管理后台  │  │ 公开展示  │  │ API 层   │  │ Cron   │  │
│  │ /admin/* │  │ /        │  │ /api/*   │  │ 定时抓取│  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │
│       │              │              │             │       │
│       └──────────────┴──────────────┴─────────────┘       │
│                          │                                │
│  ┌───────────────────────┴───────────────────────────┐   │
│  │              Services 层（业务逻辑）                │   │
│  │  fetch-service │ clean-service │ article-service   │   │
│  └───────────────────────┬───────────────────────────┘   │
│                          │                                │
│  ┌───────────────────────┴───────────────────────────┐   │
│  │            Repositories 层（数据访问）              │   │
│  │  article-repo(D1) │ file-repo(R2) │ config-repo(KV)│  │
│  └───────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────┬───────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
           ┌──┴──┐     ┌──┴──┐     ┌──┴──┐
           │ KV  │     │ D1  │     │ R2  │
           └─────┘     └─────┘     └─────┘

┌─────────────────────────────────────────────────────────┐
│              GitHub/GitLab Actions（重型任务）            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 代码块格式化  │  │ AI 改写      │  │ 批量抓取     │  │
│  │ Prettier     │  │ Skills       │  │ 大规模采集   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  完成后通过 callback URL 回写 Worker → 存入 D1/R2        │
└─────────────────────────────────────────────────────────┘
```

## 目录结构

```
msgflow/
├── worker/                          ← Cloudflare Worker（核心）
│   ├── src/
│   │   ├── index.ts                 ← 入口：fetch + scheduled
│   │   ├── router.ts               ← 路由表
│   │   ├── handlers/               ← 请求处理（薄层）
│   │   │   ├── admin.ts            ← 管理后台页面
│   │   │   ├── public.ts           ← 公开展示页面
│   │   │   ├── api-fetch.ts        ← 抓取 API
│   │   │   ├── api-articles.ts     ← 文章 CRUD API
│   │   │   ├── api-callback.ts     ← Actions 回调
│   │   │   └── api-settings.ts     ← 设置 API
│   │   ├── services/               ← 业务逻辑
│   │   │   ├── fetch-service.ts    ← 抓取调度（URL 路由 → fetcher）
│   │   │   ├── clean-service.ts    ← 内容清洗（HTML → Markdown）
│   │   │   ├── article-service.ts  ← 文章管理（CRUD + 状态流转）
│   │   │   ├── auth-service.ts     ← 认证
│   │   │   └── github.ts           ← 触发 Actions
│   │   ├── fetchers/               ← 各来源的抓取实现
│   │   │   ├── weixin.ts           ← 微信公众号
│   │   │   ├── feishu.ts           ← 飞书文档
│   │   │   ├── rss.ts              ← RSS 解析
│   │   │   ├── twitter.ts          ← Twitter/X（via jina）
│   │   │   └── generic.ts          ← 通用网页
│   │   ├── repositories/           ← 数据访问
│   │   │   ├── article-repository.ts   ← D1 文章表
│   │   │   ├── file-repository.ts      ← R2 文件存取
│   │   │   └── config-repository.ts    ← KV 配置
│   │   ├── lib/                    ← 工具
│   │   │   ├── log.ts
│   │   │   ├── response.ts
│   │   │   ├── constants.ts
│   │   │   ├── turndown.ts         ← HTML→Markdown（轻量版）
│   │   │   └── static.ts
│   │   ├── types/                  ← 类型定义
│   │   │   ├── article.ts
│   │   │   ├── fetch-task.ts
│   │   │   └── index.ts
│   │   ├── views/                  ← 视图渲染
│   │   │   ├── article-list.ts
│   │   │   ├── article-detail.ts
│   │   │   └── helpers.ts
│   │   ├── templates/              ← Mustache 模板
│   │   │   ├── layout.mustache
│   │   │   └── partials/
│   │   │       ├── admin-table.mustache
│   │   │       ├── public-list.mustache
│   │   │       ├── article-card.mustache
│   │   │       └── fetch-form.mustache
│   │   └── islands/                ← 客户端交互
│   │       ├── fetch-form.island.js
│   │       └── article-actions.island.js
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── actions/                         ← GitHub/GitLab Actions 脚本
│   ├── fetch-heavy.py              ← 重型抓取（Prettier + sql-formatter）
│   ├── rewrite.py                  ← AI 改写（调用 skills）
│   └── batch-fetch.py              ← 批量抓取
├── .github/workflows/
│   ├── fetch-article.yml           ← 手动触发抓取
│   ├── rewrite-article.yml         ← 手动触发改写
│   └── scheduled-fetch.yml         ← 定时批量抓取
├── docs/                            ← 设计文档
│   ├── architecture.md
│   └── api-reference.md
├── skills/                          ← AI 改写 skills（未来）
│   └── ...
└── README.md
```

## D1 数据模型

```sql
CREATE TABLE articles (
  id TEXT PRIMARY KEY,              -- UUID
  url TEXT NOT NULL UNIQUE,         -- 原始 URL
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  source_type TEXT NOT NULL,        -- weixin | feishu | rss | twitter | web
  source_name TEXT DEFAULT '',      -- 公众号名 / RSS 名
  status TEXT DEFAULT 'raw',        -- raw | cleaned | rewritten | published
  tags TEXT DEFAULT '[]',           -- JSON array
  summary TEXT DEFAULT '',
  r2_raw_key TEXT,                  -- R2 中原始 HTML 的 key
  r2_md_key TEXT,                   -- R2 中 Markdown 的 key
  fetched_at TEXT NOT NULL,         -- ISO 时间
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_articles_status ON articles(status);
CREATE INDEX idx_articles_source ON articles(source_type);
CREATE INDEX idx_articles_time ON articles(fetched_at DESC);
```

## 文章状态流转

```
raw → cleaned → rewritten → published
 │                              ↑
 └──── 无代码块，Worker 直接清洗 ─┘（跳过 rewritten）
 │
 └──── 有代码块，触发 Actions ──→ cleaned
```

- **raw**：刚抓取，存了原始 HTML 到 R2
- **cleaned**：已转为 Markdown（代码块已格式化）
- **rewritten**：AI 改写完成
- **published**：已发布到公开展示页

## API 设计

### 管理后台（需认证）

| Method | Path | 说明 |
|--------|------|------|
| GET | /admin | 管理后台首页（文章列表） |
| POST | /api/fetch | 提交 URL 抓取 |
| GET | /api/articles | 文章列表（支持筛选/分页） |
| GET | /api/articles/:id | 文章详情 |
| POST | /api/articles/:id/publish | 发布文章 |
| DELETE | /api/articles/:id | 删除文章 |
| POST | /api/articles/:id/rewrite | 触发 AI 改写 |
| GET/POST | /api/settings | 系统设置 |
| POST | /api/callback | Actions 完成回调 |

### 公开展示（无需认证）

| Method | Path | 说明 |
|--------|------|------|
| GET | / | 文章列表（只展示 published 状态） |
| GET | /article/:id | 文章详情页 |
| GET | /feed.xml | RSS 输出 |

## 抓取流程

```
用户提交 URL
    ↓
fetch-service 识别来源类型
    ↓
调用对应 fetcher（weixin.ts / feishu.ts / ...）
    ↓
获取 HTML/内容
    ↓
存原始内容到 R2（r2_raw_key）
    ↓
检测是否有代码块（<pre> 标签）
    ↓
├── 无代码块 → Worker 内 turndown 转 Markdown → 存 R2 → 状态 = cleaned
│
└── 有代码块 → 触发 GitHub Actions（传 article_id + r2_key）
                → Actions 下载 R2 原始 HTML
                → Prettier + sql-formatter 格式化
                → 上传 Markdown 到 R2
                → 回调 /api/callback → 状态 = cleaned
```

## 与 wucurcheck 的复用

直接复用的模式：
- `index.ts` 入口结构（fetch + scheduled + withLogContext）
- `router.ts` 声明式路由表
- Repository 模式（KV/D1 抽象）
- Mustache 模板 + partials
- Islands 架构（客户端交互）
- auth-service（登录/登出/中间件）
- DESIGN.md 规范（按钮、表格、布局的 class 约定）

## 重构步骤（建议顺序）

1. **Phase 0：初始化项目骨架**
   - 新建 `worker/` 目录，TS + wrangler 配置
   - 从 wucurcheck 复制 lib/（log, response, constants）
   - 搭好 router + auth + layout 模板

2. **Phase 1：抓取能力**
   - 实现 fetch-service + 各 fetcher
   - 实现 article-repository (D1) + file-repository (R2)
   - 管理后台：抓取表单 + 文章列表

3. **Phase 2：内容清洗 + CI/CD**
   - Worker 内轻量清洗（turndown，无代码块场景）
   - Actions 重型清洗（Prettier，有代码块场景）
   - callback 回写机制 + 一次性 token 安全模型
   - Git 仓库存储（可选）

4. **Phase 3：公开展示（Astro）**
   - 初始化 Astro 项目（`site/` 目录）
   - Content Collections 对接 `content/articles/*.md`
   - 文章列表页 + 详情页 + 标签页
   - RSS 输出（`/feed.xml`）
   - Cloudflare Pages 部署配置
   - GitHub Pages 备站部署（同仓库双 workflow）
   - daisyUI 主题 + 响应式布局

5. **Phase 4：AI 改写 + NullClaw 集成**
   - 安装 NullClaw Agent 运行时到 Actions
   - 改写命令（改写 鲁迅/马三立/徐志摩 <URL>）
   - 蒸馏命令（蒸馏 <人名> → 生成人物 Skill）
   - 任意 Skill 执行（skill:名称 <消息>）
   - AI Runner 能力（调用 LLM 做摘要/标签/分类）
   - rewrite-article.yml + run-skill.yml workflows

6. **Phase 5：聊天集成（Telegram / 飞书）**
   - ✅ Telegram Webhook handler（已完成）
   - ✅ 飞书 Webhook handler（已完成）
   - ✅ 命令解析 /fetch /list /help（已完成）
   - ✅ 频率限制（已完成）
   - 企业微信 Webhook handler（待做）
   - 抓取完成后回复消息通知（待做）

7. **Phase 6：发布能力**
   - 发布到飞书文档（publish_feishu pipeline）
   - 发布到墨问（publish pipeline）
   - 待发布列表查询（pending）
   - 健康检查 / lint（知识库一致性）

8. **Phase 7：知识库**
   - 摄入（ingest）：URL → 抓取 → 存入知识库
   - 查询（query）：基于知识库回答问题
   - 封面图生成（cover）

## 旧版 msgflow 功能迁移对照表

| 旧版功能 | 旧版文件 | worker-v2 对应 | 状态 |
|---------|---------|---------------|------|
| Telegram webhook | `worker/handlers/telegram.js` | `handlers/webhook-telegram.ts` | ✅ |
| 飞书 webhook | `worker/handlers/feishu.js` | `handlers/webhook-feishu.ts` | ✅ |
| 企业微信 webhook | `worker/handlers/wecom.js` | — | ❌ Phase 5 |
| 管理后台 | `worker/handlers/admin.js` | `views/admin.ts` + handlers | ✅ |
| 命令解析 | `worker/lib/command.js` | `lib/command.ts` | ✅（精简版） |
| 频率限制 | `worker/lib/rate-limit.js` | `lib/rate-limit.ts` | ✅ |
| GitHub 触发 | `worker/lib/github.js` | `services/github-actions.ts` | ✅ |
| 飞书 token | `worker/lib/feishu-token.js` | 内联在 `fetchers/feishu.ts` | ✅ |
| 企业微信 token | `worker/lib/wecom-token.js` | — | ❌ Phase 5 |
| 配置管理 | `worker/lib/config.js` | `repositories/config-repository.ts` | ✅ |
| 内容抓取 | `tools/capabilities/content_fetcher.py` | `services/fetch-service.ts` | ✅ |
| 微信抓取 | `tools/capabilities/fetchers/weixin.py` | `fetchers/weixin.ts` | ✅ |
| 飞书抓取 | `tools/capabilities/fetchers/feishu.py` | `fetchers/feishu.ts` | ✅ |
| Jina 代理 | `tools/capabilities/fetchers/jina.py` | 内联在 `fetchers/generic.ts` | ✅ |
| Defuddle 代理 | `tools/capabilities/fetchers/defuddle.py` | 内联在 `fetchers/generic.ts` | ✅ |
| AI Runner | `tools/capabilities/ai_runner.py` | — | ❌ Phase 4 |
| 文件存储 | `tools/capabilities/file_store.py` | `repositories/file-repository.ts` | ✅ |
| 封面图生成 | `tools/capabilities/cover.py` | — | ❌ Phase 7 |
| 飞书 CLI | `tools/capabilities/feishu_cli.py` | — | ❌ Phase 6 |
| 发布器 | `tools/capabilities/publisher.py` | — | ❌ Phase 6 |
| 改写 pipeline | `tools/pipelines/rewrite.py` | — | ❌ Phase 4 |
| 蒸馏 pipeline | `tools/pipelines/distill.py` | — | ❌ Phase 4 |
| 摄入 pipeline | `tools/pipelines/ingest.py` | — | ❌ Phase 7 |
| 查询 pipeline | `tools/pipelines/query.py` | — | ❌ Phase 7 |
| 发布 pipeline | `tools/pipelines/publish.py` | — | ❌ Phase 6 |
| 发布飞书 | `tools/pipelines/publish_feishu.py` | — | ❌ Phase 6 |
| 待发布列表 | `tools/pipelines/pending.py` | — | ❌ Phase 6 |
| 健康检查 | `tools/pipelines/lint.py` | — | ❌ Phase 6 |
| 抓取 pipeline | `tools/pipelines/fetch.py` | `services/fetch-service.ts` | ✅ |
| NullClaw 集成 | `.github/workflows/run-skill.yml` | — | ❌ Phase 4 |
| 改写 workflow | `.github/workflows/rewrite-article.yml` | — | ❌ Phase 4 |
| 飞书任务 workflow | `.github/workflows/feishu-task.yml` | — | ❌ Phase 6 |
| 微信抓取 workflow | `.github/workflows/fetch-weixin.yml` | `.github/workflows/fetch-article.yml` | ✅（合并） |
| Worker 部署 | `.github/workflows/deploy-worker.yml` | 通过 `wrangler deploy` 手动 | ✅ |
| markdown-proxy skill | `skills/markdown-proxy/` | `fetchers/*.ts`（内置） | ✅ |
| nuwa-skill | `skills/nuwa-skill/` | — | ❌ Phase 4 |
| llmwiki-agent skill | `skills/llmwiki-agent/` | — | ❌ Phase 7 |

---

## 未来优化方向

**消除 Actions 依赖（长期目标）：**

当前有代码块的文章必须走 Actions 是因为 Prettier/sql-formatter 无法在 Worker 里运行。以下任一条件满足即可将全部逻辑收回 Worker 内闭环：

- Cloudflare 放宽 Worker bundle 大小限制（当前免费版 1MB，付费版 10MB，Prettier 打包约 2MB）
- Prettier 发布 WASM 版本（可在 Worker V8 isolate 中运行）
- 用 Workers AI 替代 Prettier 做代码格式化（当前已可行，但格式化质量不如 Prettier 稳定）

一旦实现，架构简化为：

```
用户提交 URL → Worker 抓取 → Worker 清洗（含代码格式化）→ 存储 → 完成
```

零外部依赖，全链路毫秒级，Actions 仅保留 AI 改写等真正需要 Agent 运行时的任务。

**浏览器插件（增值服务方向）：**

技术栈：Browser Extension + WASM (SQLite + Biome/dprint + Turndown)

插件无 CORS 限制、可后台运行、可访问页面 DOM，适合做以下增值场景：

| 功能 | 说明 |
|------|------|
| 一键采集 | 右键菜单 / 快捷键，当前页面直接抓取为 Markdown |
| 智能识别 | Content Script 自动识别文章正文区域，去除导航/广告 |
| 本地知识库 | SQLite WASM 存储，全文搜索，离线可用 |
| 阅读标注 | 高亮、批注、标签，存入本地 SQLite |
| 代码格式化 | Biome/dprint WASM 在插件内完成，不依赖服务端 |
| 批量采集 | 打开多个标签页批量抓取 |
| 稍后阅读 | 保存到本地队列，离线阅读 |
| 数据同步 | 可选同步到 Worker（调 `/api/fetch`），实现多设备共享 |
| 导出 | 导出为 Markdown 文件 / Obsidian vault / Notion |
| 剪藏增强 | 比 Web Clipper 更智能：自动去水印、修复图片、格式化代码 |

架构：

```
浏览器插件
├── Background Service Worker
│   ├── SQLite WASM（本地存储）
│   ├── Turndown（HTML → Markdown）
│   ├── Biome WASM（代码格式化）
│   └── Sync Engine（可选，同步到 Worker）
├── Content Script
│   ├── 文章正文识别
│   ├── 右键菜单注入
│   └── 高亮/标注 UI
├── Popup
│   ├── 最近采集列表
│   ├── 搜索
│   └── 快捷操作
└── Options Page
    ├── 同步配置（Worker URL + Token）
    ├── 存储管理
    └── 导出设置
```

与 Worker 的关系：插件是「采集前端」，Worker 是「处理后端」。插件本地完成轻量任务（抓取、格式化、存储），需要 AI 改写或发布时推给 Worker。两者通过 `/api/fetch` 接口对接。

**与 llmwiki 的结合（本地知识库 + AI 知识图谱）：**

插件的本地 SQLite 存储和 llmwiki 的知识组织能力双向打通：

```
浏览器插件（采集 + 本地存储）
    ↕ 双向同步
llmwiki（知识组织 + AI 回写）
    ↕
Worker（AI 处理 + 发布）
```

| 场景 | 流程 |
|------|------|
| 采集 → 入库 | 插件抓取文章 → 同步到 llmwiki → AI 自动归类到知识体系 |
| 标注 → 知识卡片 | 插件里高亮/批注 → AI 提取要点 → 生成 wiki 条目回写 |
| 搜索 → 语义理解 | 本地 SQLite 关键词搜索 + llmwiki AI 语义搜索，双引擎 |
| 离线 → 知识关联 | 插件本地缓存 wiki 结构，离线也能浏览知识图谱 |
| 阅读 → 自动关联 | 正在读的文章 → AI 找出知识库中相关条目 → 侧边栏推荐 |

数据模型：插件 SQLite 存 llmwiki 的 `wiki/index.md` + 各条目 Markdown，Worker 端 AI 做知识关联和回写，结果同步回插件本地。实现「采集即入库，阅读即学习」的闭环。

**Wiki CLI + SQLite 加速层（100+ 页面后启用）：**

当知识库超过 100 个页面时，AI Agent 直接读文件做搜索/关联变慢（O(n) 遍历）。此时引入 SQLite 作为索引加速层，通过 CLI 给 AI Agent 使用：

```bash
# AI Agent 通过 CLI 操作知识库（替代直接读写文件）
msgflow wiki search "Cloudflare Worker 限制"     # FTS5 全文搜索，毫秒级
msgflow wiki related "article-a"                  # 查哪些页面引用了它
msgflow wiki tags "AI,自动化"                     # 按标签筛选
msgflow wiki recent --limit 10                    # 最近更新的页面
msgflow wiki read "wiki/concept-x.md"            # 读单页
msgflow wiki write "wiki/new-page.md" < content  # 写入（SQLite + 文件双写）
msgflow wiki ingest "raw/new-article.md"         # 摄入新素材触发 AI 处理
msgflow wiki stats                               # 知识库统计（页面数、关联数、覆盖率）
```

SQLite schema：

```sql
CREATE VIRTUAL TABLE wiki_fts USING fts5(path, title, content, tags);

CREATE TABLE wiki_pages (
  path TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT DEFAULT '[]',
  updated_at TEXT,
  word_count INTEGER DEFAULT 0
);

CREATE TABLE wiki_links (
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL,
  context TEXT,  -- 引用时的上下文句子
  PRIMARY KEY (source_path, target_path)
);
```

性能对比（100 页面时）：

| 操作 | 直接读文件 | SQLite CLI |
|------|-----------|-----------|
| 全文搜索 | ~500ms (grep) | ~5ms (FTS5) |
| 查关联页面 | ~300ms (正则扫描) | ~1ms (索引查询) |
| 按标签筛选 | ~200ms (解析 frontmatter) | ~2ms |
| 读单页 | ~1ms | ~1ms |

触发条件：`wiki/` 目录下 .md 文件超过 100 个时，自动建议启用 SQLite 加速。文件仍然是 source of truth，SQLite 是派生索引（可随时从文件重建）。

## 已确认的决策

**前端展示技术栈：** Astro + Tailwind + daisyUI

选择 Astro 而非 Hugo 的原因：所有开发由 AI 完成，AI 写 TSX 比 Go 模板质量更高；全栈统一 TS，Worker 和展示站同语言；daisyUI 零配置直接用。

**部署策略：** 主站 + 备站双部署

```
同一个 Git 仓库（Astro + content/articles/*.md）
  ├── push → Cloudflare Pages 构建 → read.yourdomain.com（主站）
  └── push → GitHub Pages 构建 → backup.yourdomain.com（备站）
```

- 主站：Cloudflare Pages（国内外访问快，和 Worker/D1/R2 同生态）
- 备站：GitHub Pages（零成本容灾，CF 挂了 DNS 切过去）
- 两边同一份代码同时构建，内容永远一致

**域名规划：**

| 子域名 | 用途 | 部署位置 |
|--------|------|---------|
| `admin.yourdomain.com` | 管理后台（Worker） | Cloudflare Worker |
| `read.yourdomain.com` | 公开展示（主站） | Cloudflare Pages |
| `backup.yourdomain.com` | 公开展示（备站） | GitHub Pages |

**认证方式：**
- Phase 1：密码登录（快速上线）
- Phase 2：Google OAuth（更安全）
- 支持配置：开关注册、允许的邮箱域名列表
- `auth-service.ts` 抽象为接口，底层可切换

```typescript
// KV: auth_config
interface AuthConfig {
  mode: "password" | "google_oauth";
  allow_register: boolean;
  allowed_emails: string[];  // ["*"] 或 ["*@gmail.com", "me@example.com"]
  oauth_client_id?: string;
  oauth_client_secret?: string;
}
```

**定时抓取：** Cron `0 */3 * * *`（每 3 小时），轮询已配置的 RSS 源。

**图片处理：Telegram 永久存储 + R2 缓存层**

```
抓取图片 → 上传 Telegram 私有频道 → 存 file_id 到 D1
展示时 → /img/:id → R2 有缓存直接返回，没有则从 Telegram 拉取 → 缓存到 R2 → 返回
R2 快满 → 按 LRU（last_accessed_at）清理，file_id 永远在，随时可重新拉取
```

图片表：

```sql
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  original_url TEXT,           -- 原始图片 URL（可能过期）
  telegram_file_id TEXT,       -- 永久有效
  r2_key TEXT,                 -- R2 缓存 key（null = 未缓存）
  last_accessed_at TEXT,
  size_bytes INTEGER DEFAULT 0
);
```

文章 Markdown 中图片统一引用 `/img/:image_id`，不依赖外部 URL。
