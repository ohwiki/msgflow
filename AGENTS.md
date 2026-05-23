# AGENTS.md

msgflow — 消息驱动的 AI 内容工作流。Worker + Python + GitHub Actions。

## 开发

```bash
# Worker
cd worker-v2 && npm install && npx wrangler dev

# Python
cd python/src && uv run python run_task.py --help

# 测试
cd worker-v2 && npx vitest
```

详细编码规范见 `worker-v2/AGENTS.md` 和 `CLAUDE.md`。

## 文件放置规范（严格遵守）

**白名单制 — 只允许在以下位置创建/修改文件：**

| 路径 | 允许放什么 |
|------|-----------|
| `worker-v2/src/` | Worker TypeScript 源码 |
| `worker-v2/tests/` | Worker 测试 |
| `python/src/` | Python 任务代码 |
| `python/tests/` | Python 测试 |
| `skills/` | Skill 定义（SKILL.md） |
| `docs/` | 项目文档（Markdown） |
| `.github/workflows/` | GitHub Actions |

**已有的目录结构（不得新增顶层目录）：**

```
msgflow/
├── worker-v2/       # Cloudflare Worker（TypeScript）— 主力
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
- ❌ 在 `worker-v2/src/` 外放 TypeScript 代码
- ❌ 在 `python/src/` 外放 Python 代码
- ❌ 创建 `scripts/`、`tools/`、`lib/`、`utils/` 等新目录

**Worker 代码结构（worker-v2/src/）：**

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
