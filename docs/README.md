# docs/ 文档索引

## 架构与决策

| 文档 | 说明 |
|------|------|
| [architecture-decisions.md](architecture-decisions.md) | 技术选型、存储设计、状态机、关键决策备忘 |
| [worker-architecture.md](worker-architecture.md) | Worker 多实例扩展规划 |
| [worker-github-interaction.md](worker-github-interaction.md) | Worker ↔ GitHub Actions 交互流程 |
| [notification-strategy.md](notification-strategy.md) | 为什么用 Worker 做消息中转 |

## 部署与运维

| 文档 | 说明 |
|------|------|
| [deploy.md](deploy.md) | 完整部署指南（手动方式） |
| [admin-setup-guide.md](admin-setup-guide.md) | AI 辅助部署操作指南 |
| [admin-config-guide.md](admin-config-guide.md) | Admin 页面各配置项获取方法 |
| [user-credentials-guide.md](user-credentials-guide.md) | 部署前需准备的凭据清单 |
| [ai-secrets-config-guide.md](ai-secrets-config-guide.md) | 让 AI 帮你配置 Secrets |

## 接入渠道

| 文档 | 说明 |
|------|------|
| [channel-feishu.md](channel-feishu.md) | 飞书机器人接入 |
| [channel-telegram.md](channel-telegram.md) | Telegram Bot 接入 |
| [channel-wecom.md](channel-wecom.md) | 企业微信接入 |

## 功能配置

| 文档 | 说明 |
|------|------|
| [feishu-oauth-setup.md](feishu-oauth-setup.md) | 飞书 OAuth 用户认证配置 |
| [feishu-doc-fetch.md](feishu-doc-fetch.md) | 飞书文档抓取配置 |
| [telegram-bot-setup.md](telegram-bot-setup.md) | Telegram Bot 图片存储配置 |
| [image-cdn-guide.md](image-cdn-guide.md) | 图片 CDN（R2 + 自定义域名） |
| [fetch-modes-guide.md](fetch-modes-guide.md) | 文章抓取两种模式说明 |

---

> 编码规范见 `worker-v2/AGENTS.md`，项目级 AI 指引见根目录 `CLAUDE.md`。
