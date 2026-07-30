# RSS 聚合功能：对标分析 + 集成设计

> 目标：在 msgflow 的 admin 下集成一个 RSS 聚合阅读器，对标 CatReader（墨问共享 RSS 计划）。
> 本文档分两部分：(A) 反混淆分析 CatReader 的实现，(B) 在 msgflow 落地的设计方案。

---

## A. 对标分析：CatReader 怎么实现的

来源：`https://pub-sdn-001.mowen.cn/fe/static/cat/assets/index-BN3_N5nD.js`（React 18.3.1 SPA，447KB 解压后）。
代码已混淆，变量名不可还原，但**字符串常量（接口路径、字段名、命令）是明文**，据此重建架构。

### A.1 后端接口（base = `Tt`）

```
生产:  https://misc.mowen.cn/api/cat/v1
开发:  https://dev-misc.mowen.cn/api/cat/v1
```

已确认的 REST 端点：

| 端点 | 用途 |
|---|---|
| `GET  /feeds` | 订阅源列表 |
| `GET  /articles?...` | 文章列表（支持 `sort=random&limit=12`、分页参数） |
| `GET  /recommendations?limit=12` | 推荐文章 |
| `GET  /stats` | 统计 |
| `GET/POST /user-state` | 用户状态 |
| `GET/POST /user-state/followed-feeds` | 关注的订阅源（读/写） |
| `POST /user-state/mark-read` | 标记已读 |
| `GET  /user-state/unread-counts` | 未读数 |
| `POST /chat/completions` | AI 对话（AskCat） |
| `GET/POST /chat-sessions`, `/chat-sessions/{id}`, `/chat-sessions/bookmark/{id}` | 会话历史 |
| `GET/POST /askcat-memory`, `/askcat-memory/{id}`, `/askcat-memory/search`, `/askcat-memory/archive/{id}` | AI 记忆 |

### A.2 RSS 抓取策略：多级代理回退

CatReader **前端直接抓 RSS XML**（不是后端抓），用一条 fallback 链解决 CORS + 反爬：

```
对每个 feed 的 xmlUrl，依次尝试：
1. 特例：xgo.ing 的源 → 走 rsshub 代理
     https://rsshub-eta-topaz-88.vercel.app/{xmlUrl去掉协议头}
2. 直连：{ url: xmlUrl, isDirect: true }
3. 自建 CF Worker 代理：
     https://catreader-proxy.jackychi.workers.dev/?url={encodeURIComponent(xmlUrl)}
4. 第三方兜底：
     https://api.rss2json.com/v1/api.json?rss_url={encodeURIComponent(xmlUrl)}
   （返回 JSON，标记 isRss2Json）
```

拿到 XML 后用浏览器 `DOMParser` 解析，读取字段：
`content:encoded`、`dc:date`、`enclosure`（播客音频）、`itunes:summary`（播客摘要）。
文章对象形状：

```
{
  feedTitle, feedUrl(=xmlUrl),
  content: content:encoded || description,
  contentSnippet: 去 HTML 后前 200 字,
  ... title, link, pubDate, enclosure ...
}
```

订阅源对象形状（`Hr()` 归一化后）：

```
{
  xmlUrl,           // 主键（"cached" 和 "category:*" 是特殊值）
  title / feedTitle,
  category,         // 分类：AI/技术/播客/商业/创业/摄影/艺术/生活
  articleCount,
  url
}
```

订阅列表本身走 OPML 概念（`xmlUrl` 是 OPML 里的属性名），存在后端 `user-state/followed-feeds`。

### A.3 AI 助手（AskCat）——斜杠命令

前端定义了一组 slash command，POST 到 `/chat/completions`，按上下文注入不同 prompt：

| 命令 | 标签 | 作用域 |
|---|---|---|
| `/summary` | 总结全文 | 单篇 |
| `/keypoints` | 提取要点 | 单篇 |
| `/translate` | 翻译全文 | 单篇 |
| `/explain` | 术语解释 | 单篇 |
| `/opinion` | 观点评析 | 单篇 |
| `/digest` | 订阅源动态 / 关注动态 | 单源 / 全部关注 |
| `/intro` | 订阅源介绍 | 单源 |
| `/highlights` | 精选推荐 | — |
| `/overview` | 分类总览 | 分类 |
| `/recommend` | 分类推荐 / 关注推荐 | 分类 / 关注 |

AI 回复用 `marked` 渲染 Markdown。有「记忆」和「历史会话」两层持久化。

### A.4 关键结论（对我们落地的启发）

1. **RSS 抓取放前端 + 多级代理**是它的核心 trick，为了绕 CORS。我们在 Worker 后端抓则**没有 CORS 问题**，可以简化成「后端定时抓 + 存库」，比它更干净。
2. 数据模型清晰：`feeds`（订阅源，按 category 分组）+ `articles`（文章，关联 feedUrl）+ `user-state`（已读/未读/关注）。
3. AI 是增值层，不是必需。一期可以先不做 AskCat，只做「聚合 + 阅读 + 已读管理」。

---

## B. 集成设计：在 msgflow admin 落地

### B.1 现有架构可复用的部分

- **路由**：`src/router.ts` 的 protected admin routes（exact-path + prefix match，走 authMiddleware）。加 `/rss` 页面 + `/api/rss/*` 接口即可。
- **导航**：`src/templates/layout.mustache` 侧栏菜单（line 29-37），加一项 `📰 RSS 阅读 (/rss)`。
- **页面模式**：参考 format-editor —— handler(`api-format.ts`) → view(`format-editor.ts`) → template(`.mustache`) → client TS(`client/format-editor.ts`)，esbuild 打包注入。或走更简单的 layout partial 模式（像 article-table）。
- **数据层**：D1（`DB` 绑定）存 feeds/articles/已读状态；沿用 Repository 模式（`src/types/repository.ts`）。
- **定时抓取**：`wrangler.toml` 已有 `[triggers] crons`（当前 3 小时刷飞书 token）。加一条 cron 定时拉 RSS。`src/index.ts` 的 `scheduled()` handler 里分发。

### B.2 数据模型（D1 新表）

```sql
CREATE TABLE rss_feeds (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  xml_url     TEXT NOT NULL UNIQUE,   -- 订阅源地址（主键概念）
  title       TEXT,
  site_url    TEXT,
  category    TEXT,                   -- AI/技术/播客/商业...
  favicon     TEXT,
  last_fetch  INTEGER,                -- 上次抓取时间戳
  error       TEXT,                   -- 上次抓取错误（null=正常）
  created_at  INTEGER NOT NULL
);

CREATE TABLE rss_articles (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id      INTEGER NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  guid         TEXT NOT NULL,         -- RSS guid / link，去重用
  title        TEXT,
  link         TEXT,
  author       TEXT,
  content      TEXT,                  -- content:encoded || description
  snippet      TEXT,                  -- 去 HTML 前 200 字
  enclosure    TEXT,                  -- 播客音频 url（可选）
  pub_date     INTEGER,
  is_read      INTEGER NOT NULL DEFAULT 0,
  created_at   INTEGER NOT NULL,
  UNIQUE(feed_id, guid)
);

CREATE INDEX idx_articles_feed  ON rss_articles(feed_id, pub_date DESC);
CREATE INDEX idx_articles_unread ON rss_articles(is_read, pub_date DESC);
```

单用户 admin，暂不需要独立 user-state 表（已读直接落在 `rss_articles.is_read`）。

### B.3 后端接口（`/api/rss/*`）

| 端点 | 用途 |
|---|---|
| `GET  /api/rss/feeds` | 订阅源列表（含未读数，按 category 分组） |
| `POST /api/rss/feeds` | 新增订阅源（body: xmlUrl；后端抓一次拿 title/category） |
| `DELETE /api/rss/feeds/{id}` | 删除订阅源（级联删文章） |
| `POST /api/rss/feeds/import` | OPML 导入（可选，二期） |
| `GET  /api/rss/articles?feed={id}&unread=1&page=` | 文章列表 |
| `GET  /api/rss/articles/{id}` | 单篇正文 |
| `POST /api/rss/articles/{id}/read` | 标记已读 |
| `POST /api/rss/refresh` | 手动触发抓取（复用 cron 逻辑） |

### B.4 RSS 抓取（后端，Worker 里）

新建 `src/services/rss-service.ts`：

```
fetchFeed(xmlUrl):
  1. fetch(xmlUrl)  // Worker 端无 CORS，直连即可
  2. 解析 XML  ——  Worker 没有 DOMParser，需用轻量 XML 解析
       方案：fast-xml-parser（纯 JS，无 DOM 依赖，可打包进 Worker）
  3. 归一化 items → {guid,title,link,author,content,snippet,pubDate,enclosure}
  4. UPSERT 到 rss_articles（按 UNIQUE(feed_id,guid) 去重）
  5. 更新 feed.last_fetch / error
```

注意点：
- **Worker 无 `DOMParser`** —— 这是和 CatReader 最大的实现差异。引 `fast-xml-parser`（约 30KB，纯 JS）。
- 直连抓取失败的源（403/超时）记 `error` 字段，UI 标红，一期不做代理回退（CatReader 那套多级代理是为了绕浏览器 CORS，后端不需要）。若个别源反爬严重，二期再加 rsshub 代理兜底。
- cron 里遍历所有 feed 串行/小并发抓取，注意 Worker 子请求数限制（免费 50 / 付费 1000 subrequests）和 CPU 时间。feed 多时分批。

### B.5 前端页面（`/rss`）

两种做法，二选一：

- **方案 A（推荐，轻）**：走 layout partial，服务端渲染。三栏：左订阅源树（按 category）│ 中文章列表 │ 右正文。用少量 HTMX/原生 fetch 做已读标记和切换。和现有 article-table 模式一致，改动小。
- **方案 B（重）**：像 format-editor 那样独立 SPA + client TS bundle。交互更顺滑（无刷新切换），但工作量大。

建议一期用方案 A 打通闭环，二期视体验决定是否升级 B。

### B.6 定时抓取

`wrangler.toml`：

```toml
[triggers]
crons = ["0 */3 * * *", "*/30 * * * *"]  # 原飞书 token + 新增每 30 分钟抓 RSS
```

`src/index.ts` 的 `scheduled(event)` 按 `event.cron` 分发到对应任务。

### B.7 AI 增值（二期，可选）

对标 AskCat 的 slash 命令，复用 msgflow 已有的 AI 能力（项目里已有 analyzer / AI 排版）。一期不做。

---

## C. 实施顺序（建议）

1. D1 建表（`rss_feeds` + `rss_articles`）——写 migration sql。
2. `rss-service.ts`：引 `fast-xml-parser`，实现 `fetchFeed` + upsert。
3. Repository：`RssRepository`（feeds/articles 的 CRUD + 未读数）。
4. `/api/rss/*` handlers。
5. cron 接入 `scheduled()`。
6. `/rss` 页面（方案 A：partial + 三栏）+ 导航加菜单项。
7. 手动 `/api/rss/refresh` 验证抓取，再验 cron。

## D. 待确认

- 一期是否只做「聚合+阅读+已读」，AI（AskCat）放二期？
- 页面用方案 A（服务端 partial，轻）还是 B（SPA，重）？
- 初始订阅源：手动一个个加，还是要 OPML 批量导入？
- 抓取频率（cron 间隔）？
