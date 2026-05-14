# CLAUDE.md

AI 编码助手的行为准则。本项目主要由 AI 维护和开发，遵守以下规则减少返工。

## 项目概览

msgflow 是消息驱动的 AI 内容工作流。三部分：
- `worker/` — Cloudflare Worker（JS，消息接收 + 路由 + Admin）
- `tools/` — Python 任务执行器（抓取、改写、发布等）
- `.github/workflows/` — GitHub Actions 任务编排

数据流：`聊天消息 → Worker → GitHub Actions → Python pipeline → 回调 Worker → 回复用户`

## 1. 动手前先理解

- 读 `docs/deploy.md` 了解部署架构
- 读 `docs/admin-panel-design.md` 了解 Admin + KV 配置体系
- 读 `worker/lib/command.js` 了解指令解析逻辑
- 读 `tools/run_task.py` 了解 CLI 入口和 pipeline 注册方式
- 不确定就问，不要猜

## 2. Worker（JavaScript）规范

- 模块放对位置：handlers/ 放路由处理，lib/ 放通用逻辑
- 新路由加到 `index.js`，新指令加到 `lib/command.js`
- 配置项加到 `lib/config.js` 的 SENSITIVE_KEYS 或 NON_SENSITIVE_KEYS
- Admin 页面字段加到 `handlers/admin.js` 的 HTML 和 fields 数组
- 用 `log.info/warn/error` 记录关键操作（`lib/log.js`）
- 部署前同步到 nullclaw-ci 仓库：`cp worker/* → nullclaw-ci/worker/`

### 错误处理（必须遵守）

- 所有 `await request.json()` 必须 try-catch，catch 返回 400
- 所有外部 fetch（飞书 API、GitHub API 等）必须 try-catch，catch 记录 log.error 并返回合理的错误响应
- 不要让第三方 API 故障导致 Worker 返回 500
- `env.XXX` 访问前检查是否存在，缺失时返回明确错误而不是 undefined 报错

### 日志（必须遵守）

- 每个 handler 的失败路径必须有 log.warn 或 log.error
- 配置变更必须 log.info（记录改了什么 key，不记录 value）
- 鉴权失败必须 log.warn
- 不要在高频路径（如 GET /）打 info 日志，避免日志爆炸
- 日志格式：`log.info("动作描述", { key: value })`，msg 用英文动词短语

## 3. Python（tools/）规范

- 用项目的 logger（`from capabilities.logger import get_logger`）
- 新 pipeline 放 `tools/pipelines/`，新能力放 `tools/capabilities/`
- `run_task.py` 注册新子命令后，workflow 的 case 语句会自动匹配（`*` 通配）
- 结果写入 `/tmp/result.txt`（workflow 读取并回调）

### 错误处理（必须遵守）

- 不要用裸 `except Exception: return None`——至少 log.error 记录原因
- 外部请求（HTTP、subprocess）必须有 timeout
- 失败时日志要包含：什么操作失败 + 错误信息 + 相关上下文（URL、文件名等）

### 日志（必须遵守）

- 每个 fetcher/writer 的 fetch() 入口打 log.info（记录开始）
- 成功打 log.info（记录结果长度或关键信息）
- 失败打 log.error（记录错误原因）
- 模块名用点分层级：`get_logger("fetcher.feishu")`、`get_logger("writer.mowen")`

## 4. Workflow 规范

- 敏感配置从 Worker `/internal/config` 拉取，非敏感从 `inputs.config` JSON 解析
- 新环境变量加到 `Load config` step 的解析 + `GITHUB_ENV` 导出
- fallback 到 GitHub Secrets（向后兼容）
- 不要把敏感值写进 workflow 日志（用 `::add-mask::` 或避免 echo）

## 5. 改动原则

- 只改需要改的。不要顺手重构不相关的代码
- Worker 是 JS（无框架，纯 ESM），不要引入 npm 依赖
- Python 不要引入重依赖（保持 Actions 安装快）
- 每个 commit 只做一件事
- 改完 Worker 记得 `wrangler deploy` 或同步到 nullclaw-ci

## 6. 验证

- Worker 改动：`wrangler deploy` 后 curl 验证
- Python 改动：本地 `python3 tools/run_task.py <action> <target>` 验证
- Workflow 改动：手动触发 Actions 验证
- Admin 页面改动：浏览器打开 `/admin?token=xxx` 验证

## 7. 不要做的事

- 不要改 `wrangler.toml` 的 KV namespace ID 或 Worker 名称
- 不要把 `bot.ouraihub.com` 等实际域名写进文档（用「你的域名」占位）
- 不要在 Worker 代码里用 `eval()` 或动态 import
- 不要把 API key 写进代码
- 不要改 CALLBACK_SECRET 或 ADMIN_TOKEN 的值
- 不要直接 push 到 nullclaw-ci 的 main（先在 msgflow 改好再同步）
