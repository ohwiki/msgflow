# docs/

```
docs/
├── architecture/          ← 技术选型、系统设计、交互流程
│   ├── architecture-decisions.md
│   ├── worker-architecture.md
│   ├── worker-github-interaction.md
│   └── notification-strategy.md
├── deploy/                ← 部署、配置、凭据
│   ├── deploy.md
│   ├── admin-setup-guide.md
│   ├── admin-config-guide.md
│   ├── user-credentials-guide.md
│   └── ai-secrets-config-guide.md
├── channels/              ← 消息渠道接入
│   ├── channel-feishu.md
│   ├── channel-telegram.md
│   └── channel-wecom.md
└── features/              ← 功能模块配置
    ├── feishu-oauth-setup.md
    ├── feishu-doc-fetch.md
    ├── telegram-bot-setup.md
    ├── image-cdn-guide.md
    └── fetch-modes-guide.md
```

## architecture/ — 架构与决策

| 文档 | 说明 |
|------|------|
| [architecture-decisions.md](architecture/architecture-decisions.md) | 技术选型、存储设计、状态机、关键决策备忘 |
| [worker-architecture.md](architecture/worker-architecture.md) | Worker 多实例扩展规划 |
| [worker-github-interaction.md](architecture/worker-github-interaction.md) | Worker ↔ GitHub Actions 交互流程 |
| [notification-strategy.md](architecture/notification-strategy.md) | 为什么用 Worker 做消息中转 |

## deploy/ — 部署与运维

| 文档 | 说明 |
|------|------|
| [deploy.md](deploy/deploy.md) | 完整部署指南（手动） |
| [admin-setup-guide.md](deploy/admin-setup-guide.md) | AI 辅助部署 |
| [admin-config-guide.md](deploy/admin-config-guide.md) | 各配置项获取方法 |
| [user-credentials-guide.md](deploy/user-credentials-guide.md) | 部署前凭据清单 |
| [ai-secrets-config-guide.md](deploy/ai-secrets-config-guide.md) | 让 AI 配置 Secrets |

## channels/ — 接入渠道

| 文档 | 说明 |
|------|------|
| [channel-feishu.md](channels/channel-feishu.md) | 飞书机器人 |
| [channel-telegram.md](channels/channel-telegram.md) | Telegram Bot |
| [channel-wecom.md](channels/channel-wecom.md) | 企业微信 |

## features/ — 功能配置

| 文档 | 说明 |
|------|------|
| [feishu-oauth-setup.md](features/feishu-oauth-setup.md) | 飞书 OAuth 认证 |
| [feishu-doc-fetch.md](features/feishu-doc-fetch.md) | 飞书文档抓取 |
| [telegram-bot-setup.md](features/telegram-bot-setup.md) | Telegram 图片存储 |
| [image-cdn-guide.md](features/image-cdn-guide.md) | 图片 CDN (R2) |
| [fetch-modes-guide.md](features/fetch-modes-guide.md) | 抓取模式说明 |

---

> 编码规范：`worker/AGENTS.md` ｜ AI 行为准则：`CLAUDE.md`
