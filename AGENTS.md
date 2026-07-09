# AGENTS.md

msgflow — 消息驱动的 AI 内容工作流。Worker + Python + GitHub Actions。

## 开发

```bash
# Worker
cd worker && npm install && npx wrangler dev

# Python
cd python/src && uv run python run_task.py --help

# 测试
cd worker && npx vitest
```

详细编码规范见 `worker/AGENTS.md` 和 `CLAUDE.md`。

配置 Secrets 时，读 `docs/ai-secrets-config-guide.md`。
配置飞书 OAuth 时，读 `docs/feishu-oauth-setup.md`。

## 文件放置规范（严格遵守）

**白名单制 — 只允许在以下位置创建/修改文件：**

| 路径 | 允许放什么 |
|------|-----------|
| `worker/src/` | Worker TypeScript 源码 |
| `worker/tests/` | Worker 测试 |
| `python/src/` | Python 任务代码 |
| `python/tests/` | Python 测试 |
| `skills/` | Skill 定义（SKILL.md） |
| `docs/` | 项目文档（Markdown） |
| `.github/workflows/` | GitHub Actions |

**已有的目录结构（不得新增顶层目录）：**

```
msgflow/
├── worker/       # Cloudflare Worker（TypeScript）— 主力
├── python/          # Python 任务执行器（新版）
├── python-legacy/   # 旧版 Python（只读参考，不修改）
├── skills/          # Skill 定义文件
├── docs/            # 文档
├── .github/         # CI/CD
├── worker/          # 旧版 Worker（只读，不修改）
├── site/            # 旧版站点（只读，不修改）
├── output/          # 输出目录
└── rewritten/       # 改写输出
```

**根目录允许的文件（不得新增）：**

```
README.md
AGENTS.md
CLAUDE.md
TODO.md
.gitignore
.env
.env.example
.gitlab-ci.yml
deploy.sh
```

**绝对禁止：**

- ❌ 创建新的顶层目录
- ❌ 修改 `python-legacy/`（只读参考）
- ❌ 修改 `worker/`（旧版，只读）
- ❌ 在 `worker/src/` 外放 TypeScript 代码
- ❌ 在 `python/src/` 外放 Python 代码
- ❌ 创建 `scripts/`、`tools/`、`lib/`、`utils/` 等新目录

**Worker 代码结构（worker/src/）：**

```
src/
├── index.ts          # 入口
├── router.ts         # 路由
├── env.d.ts          # 类型定义
├── handlers/         # 路由处理器
├── services/         # 业务逻辑
├── repositories/     # 数据访问
├── fetchers/         # 内容抓取
├── lib/              # 通用工具
├── types/            # 类型定义
├── views/            # 页面渲染
├── templates/        # HTML 模板
└── islands/          # 交互组件
```

**Python 代码结构（python/src/）：**

```
src/
├── run_task.py       # CLI 入口
├── lib/              # 通用（interfaces, registry, logger 等）
├── fetchers/         # 内容抓取实现
├── writers/          # 发布实现
└── pipelines/        # 业务流水线
```

**pycore 使用规范（必须遵守）：**

项目依赖 `pycore` 包（`https://github.com/ouraihub/pycore`），提供以下能力。**禁止重复造轮子**：

| pycore 提供 | 用法 | 禁止的替代写法 |
|---|---|---|
| `pycore.logger(name)` | 结构化日志 | ❌ `import logging` |
| `pycore.env(key)` | 读环境变量（返回 str 或 ""） | ❌ `os.environ.get(key, "")` |
| `pycore.require_env(key)` | 读必需环境变量（缺失抛异常） | ❌ `os.environ[key]` |
| `pycore.load_dotenv()` | 加载 .env | ❌ `from dotenv import load_dotenv` |
| `pycore.Result` | 统一返回值（ok/fail） | ❌ 自定义 result dict |
| `pycore.output_result(r)` | CLI 输出 Result | ❌ `print(json.dumps(...))` |
| `pycore.http.get(url, ...)` | HTTP GET（返回 Response） | ❌ `urllib.request` / `requests.get` |
| `pycore.http.post(url, ...)` | HTTP POST | ❌ `urllib.request` / `requests.post` |
| `pycore.http.HttpError` | HTTP 异常类 | ❌ 自定义异常 |
| `pycore.run_batch(items, fn)` | 并发批量执行 | ❌ 手写 ThreadPoolExecutor |
| `pycore.run_parallel(fns)` | 并行执行多个函数 | ❌ 手写 asyncio.gather |
| `pycore.errors.*` | 业务异常层次（AppError, ValidationError 等） | ❌ 自定义异常类 |

**例外情况（允许不用 pycore）：**
- `urllib.parse`（URL 编码/解码）— pycore 不提供
- `subprocess`（调用外部 CLI）— pycore 不提供
- `requests`（仅在 pycore.http 不支持二进制下载时）— 需注释说明原因
