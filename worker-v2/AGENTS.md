# AGENTS.md — msgflow Worker v2 编码规范

本文件定义了 `worker-v2/` 的架构约定和编码规范。所有修改代码的 AI Agent 必须遵守。

## 架构分层

```
src/
├── index.ts          ← 入口：只做 fetch/scheduled 分发 + 全局错误处理
├── router.ts         ← 纯路由表：无业务逻辑，只做 path → handler 映射
├── handlers/         ← 薄层：参数校验 + 调 service，不直接操作存储
├── services/         ← 业务逻辑：编排 repository 和 fetcher
├── fetchers/         ← 外部数据获取：每个来源一个文件，实现 Fetcher 接口
├── repositories/     ← 数据访问：实现 IXxxRepository 接口，封装 D1/R2/KV
├── lib/              ← 工具函数：无业务逻辑，纯工具
├── types/            ← 类型定义：接口、DTO、常量类型
├── views/            ← 视图渲染：Mustache 模板 + 数据组装
└── islands/          ← 客户端 JS：按需加载的交互逻辑
```

### 依赖方向（严格单向）

```
handlers → services → repositories → D1/R2/KV
              ↓
           fetchers → lib/http
```

禁止：
- handler 直接操作 D1/R2/KV
- fetcher 依赖 service
- repository 依赖 handler
- 循环依赖

## 常量集中管理

所有外部 URL、匹配模式、配置默认值必须定义在 `lib/constants.ts` 中，禁止在业务代码中硬编码。

| 类别 | 常量组 | 示例 |
|------|--------|------|
| 外部服务 URL | `EXTERNAL_URL` | Jina 代理、飞书 API |
| URL 匹配模式 | `URL_PATTERN` | 微信域名、飞书域名 |
| CDN 资源 | `CDN` | daisyUI、HTMX |
| HTTP Headers | `HEADERS` | UA、Referer |
| 默认值 | `DEFAULTS` | 超时时间、分页大小 |
| KV 键名 | `KV_KEY` | session 前缀、配置键 |

**规则：**
- 新增外部依赖 URL → 加到 `EXTERNAL_URL`
- 新增来源匹配规则 → 加到 `URL_PATTERN` + 更新 `detectSourceType()`
- 超时、分页等数值 → 加到 `DEFAULTS`
- 禁止在 fetcher/service/handler 中出现裸字符串 URL

## 面向接口编程

### Fetcher 接口

所有内容抓取器必须实现 `types/fetcher.ts` 中的 `Fetcher` 接口：

```typescript
export interface Fetcher {
  canHandle(url: string): boolean;
  fetch(url: string, env: Env): Promise<FetchResult>;
}
```

新增来源时：
1. 在 `fetchers/` 下创建文件，导出一个实现 `Fetcher` 的对象
2. 在 `services/fetch-service.ts` 的 `FETCHERS` 数组中注册（顺序决定优先级，generic 永远最后）

### Repository 接口

所有数据访问类必须实现 `types/repository.ts` 中对应的接口：

```typescript
export interface IArticleRepository { ... }
export interface IFileRepository { ... }
```

Service 层通过接口引用 Repository，不直接依赖具体实现类。

## TypeScript 规范

- **strict 模式**：`tsconfig.json` 已开启 strict + noUncheckedIndexedAccess
- **零 any**：禁止使用 `any`，用 `unknown` + 类型守卫替代
- **显式返回类型**：公开函数必须标注返回类型
- **const 断言**：常量对象用 `as const`
- **类型导入**：用 `import type` 导入纯类型

## 错误处理

### 规则

1. **Handler 不 try-catch**：错误向上抛，由 `index.ts` 全局捕获
2. **业务错误用 AppError 子类**：`ValidationError`、`NotFoundError`、`FetchError`、`DuplicateError`
3. **未知错误返回 500**：不暴露内部细节给客户端
4. **Fetcher 失败抛 FetchError**：包含 URL 和原因

### 错误类型

| 类 | HTTP 状态码 | 用途 |
|---|---|---|
| `ValidationError` | 400 | 参数校验失败 |
| `NotFoundError` | 404 | 资源不存在 |
| `DuplicateError` | 409 | 重复创建 |
| `FetchError` | 502 | 外部抓取失败 |

## 日志规范

### 规则

1. **Logger 通过参数传递**，不使用模块级全局变量（避免并发污染）
2. **每个请求创建独立 Logger**：`createLogger({ rid, path, method })`
3. **结构化 JSON 输出**：每条日志是一个 JSON 对象
4. **必须包含 rid**：request ID 贯穿整个请求链路

### 日志级别

| 级别 | 用途 |
|------|------|
| `info` | 正常业务事件：request、fetch_start、fetch_done、article_published |
| `warn` | 可恢复的异常：app_error（400/404）、fetch_duplicate |
| `error` | 不可恢复的异常：unhandled error |

### 格式

```json
{"level":"info","event":"fetch_done","rid":"a1b2c3d4","articleId":"...","sourceType":"weixin","ts":"2025-05-22T12:00:00Z"}
```

## HTTP 请求规范

- **所有外部 fetch 必须使用 `lib/http.ts` 的 `fetchWithTimeout`**
- 默认超时 15 秒，可通过 `timeoutMs` 参数覆盖
- 禁止裸调 `fetch()`（无超时保护会卡死 Worker）

## Worker 最佳实践

- **入口只做分发**：`index.ts` 不包含业务逻辑
- **环境变量通过 Env 接口访问**：不使用 `process.env`
- **wrangler.toml 分环境**：`[env.dev.vars]` 和 `[env.production.vars]`
- **Secrets 不写入 wrangler.toml**：API key 等通过 Dashboard Secrets 配置
- **D1 操作用参数化查询**：禁止字符串拼接 SQL

## daisyUI / 前端规范

- **CDN 引入**：不本地打包 CSS，用 CDN 版本
- **语义化 class**：优先用 daisyUI 组件类（`btn`、`card`、`table`），不写裸 Tailwind
- **HTMX 交互**：用 `hx-post`/`hx-get` 声明式交互，不写 fetch JS
- **Islands 架构**：需要客户端 JS 时，写独立小文件放 `islands/`，按需加载
- **模板内联**：Mustache 模板作为字符串常量写在 `views/*.ts` 中（esbuild 不支持 .mustache loader）

## 测试规范

- **框架**：vitest（原生 TS 支持，与 wrangler 生态兼容）
- **目录**：`tests/` 下，文件名 `*.test.ts`
- **运行**：`npm test`（单次）、`npm run test:watch`（监听）
- **CI**：每次 push/PR 自动跑 typecheck + test

### 必须测试的内容

| 模块 | 测试重点 |
|------|---------|
| `lib/constants.ts` | `detectSourceType()`、`urlMatches()` |
| `lib/errors.ts` | 各错误类的 status/code/toJSON |
| `fetchers/*.ts` | `canHandle()` 匹配逻辑 |
| `lib/log.ts` | Logger 输出格式、context 传递 |
| `repositories/*.ts` | CRUD 逻辑（需 miniflare 模拟 D1） |

### 不需要测试的内容

- 模板渲染（UI 层，靠人眼验证）
- 外部 HTTP 调用（集成测试范畴，不在单元测试里 mock 整个网络）

### 命令速查

```bash
npm run typecheck   # 类型检查
npm test            # 跑测试
npm run check       # typecheck + test 一起跑
```

## 命名约定

| 类型 | 命名 | 示例 |
|------|------|------|
| 文件 | kebab-case | `fetch-service.ts` |
| 接口 | I + PascalCase | `IArticleRepository` |
| 类 | PascalCase | `ArticleRepository` |
| 函数 | camelCase | `fetchWeixin` |
| 常量 | UPPER_SNAKE | `ARTICLE_STATUS` |
| Fetcher 导出 | camelCase + Fetcher | `weixinFetcher` |
| Handler 导出 | camelCase + 动词 | `apiFetch`、`pageHome` |

## CI/CD 与 Git 存储

### GitHub/GitLab Actions（重型任务）

有代码块的文章由 Worker 触发 Actions 处理，完成后回调 `/api/callback`。

流程：
```
Worker 检测到代码块 → 触发 workflow_dispatch → Actions 下载 R2 HTML
→ Prettier + sql-formatter 格式化 → 回调 Worker → 存 R2 + 更新 D1
```

共享脚本 `scripts/format_article.py` 被 GitHub Actions 和 GitLab CI 共用。

### Markdown 存储到 Git 仓库（可选）

通过环境变量开启：
- `GIT_REPO_ENABLED=true`
- `GIT_PROVIDER=github|gitlab`
- `GIT_TOKEN=xxx`
- `GIT_REPO=owner/repo`（GitHub）或 project ID（GitLab）
- `GIT_BRANCH=main`
- `GIT_BASE_PATH=articles`

callback 收到 Markdown 后自动提交到指定仓库。失败不阻塞主流程。

### Callback 安全

- `CALLBACK_SECRET` 环境变量配置在 Worker Secrets 中
- Actions 调用 callback 时必须带 `secret` 字段
- Worker 验证 secret 后才处理

## Python 代码规范（scripts/ 目录，Actions 中运行）

Actions 中的 Python 脚本也需要遵循规范：

- **类型注解**：所有函数参数和返回值必须有类型注解
- **面向接口**：用 `Protocol` 定义接口，扩展时只加实现不改调用方
- **模块化**：每个 pipeline 一个文件，共享逻辑提取到 `lib/`
- **入口统一**：`if __name__ == "__main__"` + argparse
- **错误处理**：用 `sys.exit(1)` 退出，不吞异常
- **日志**：用 `logging` 模块，不用 `print`
- **依赖**：在 `requirements.txt` 中锁定版本

### 接口设计（Protocol 模式）

扩展点通过 Protocol 定义，新增功能只需实现接口 + 注册，不改上层调度逻辑：

```python
from typing import Protocol

# ─── 通讯渠道接口 ───────────────────────────
# 新增渠道（如 Slack、Discord）只需实现此接口
class MessageChannel(Protocol):
    name: str
    def send(self, chat_id: str, text: str) -> None: ...
    def parse_webhook(self, payload: dict) -> "Message | None": ...

# ─── 指令处理接口 ───────────────────────────
# 新增指令只需实现此接口 + 注册到 HANDLERS 列表
class CommandHandler(Protocol):
    def can_handle(self, command: "Command") -> bool: ...
    def execute(self, command: "Command", ctx: "Context") -> "Result": ...

# ─── 发布目标接口 ───────────────────────────
# 新增发布渠道（飞书/墨问/WordPress）只需实现此接口
class Publisher(Protocol):
    name: str
    def publish(self, title: str, content: str, metadata: dict) -> "PublishResult": ...

# ─── 内容抓取接口 ───────────────────────────
# 新增来源只需实现此接口 + 注册到 FETCHERS 列表
class Fetcher(Protocol):
    def can_handle(self, url: str) -> bool: ...
    def fetch(self, url: str) -> "FetchResult": ...
```

### 注册表模式（和 TS 端一致）

```python
# 注册表：顺序决定优先级，最后一个是 fallback
FETCHERS: list[Fetcher] = [WeixinFetcher(), FeishuFetcher(), JinaFetcher()]
HANDLERS: list[CommandHandler] = [FetchHandler(), ListHandler(), RewriteHandler()]
PUBLISHERS: list[Publisher] = [FeishuPublisher(), MowenPublisher()]

# 调度逻辑（永远不改）
def dispatch_fetch(url: str) -> FetchResult:
    for f in FETCHERS:
        if f.can_handle(url):
            return f.fetch(url)
    raise ValueError(f"No fetcher for {url}")
```

### 目录结构

```
scripts/
├── format_article.py      ← 代码格式化（Prettier 调用）
├── rewrite_article.py     ← AI 改写（NullClaw 调用）
├── distill.py             ← 蒸馏 Skill
├── publish_feishu.py      ← 发布到飞书
├── lib/
│   ├── interfaces.py      ← Protocol 定义（所有接口集中）
│   ├── fetcher.py         ← Fetcher 实现 + 注册表
│   ├── channels.py        ← MessageChannel 实现 + 注册表
│   ├── publishers.py      ← Publisher 实现 + 注册表
│   ├── ai_runner.py       ← LLM 调用封装
│   └── file_store.py      ← 文件读写
└── requirements.txt
```

### 扩展 Checklist

新增通讯渠道：
- [ ] 在 `lib/channels.py` 实现 `MessageChannel` Protocol
- [ ] 注册到 `CHANNELS` 列表
- [ ] 上层调度代码不改

新增指令：
- [ ] 在 `lib/` 下实现 `CommandHandler` Protocol
- [ ] 注册到 `HANDLERS` 列表
- [ ] 上层调度代码不改

新增发布目标：
- [ ] 在 `lib/publishers.py` 实现 `Publisher` Protocol
- [ ] 注册到 `PUBLISHERS` 列表
- [ ] 上层调度代码不改

## 新增功能 Checklist

添加新的内容来源：
- [ ] 在 `fetchers/` 创建文件，实现 `Fetcher` 接口
- [ ] 在 `fetch-service.ts` 的 `FETCHERS` 数组注册
- [ ] 在 `detectSourceType()` 添加 URL 匹配规则
- [ ] TypeScript 编译通过（`npx tsc --noEmit`）

添加新的 API 端点：
- [ ] 在 `handlers/` 创建或修改 handler 函数
- [ ] 在 `router.ts` 注册路由
- [ ] Handler 签名：`(request: Request, env: Env, log: Logger) => Promise<Response>`
- [ ] 业务错误用 AppError 子类抛出，不自己 try-catch

添加新的数据表：
- [ ] 在 `schema.sql` 添加 DDL
- [ ] 在 `types/` 定义数据类型
- [ ] 在 `types/repository.ts` 定义接口
- [ ] 在 `repositories/` 实现具体类
