# docs/ 文档索引

## 📖 当前有效文档

### 部署与运维

| 文档 | 说明 |
|------|------|
| [deploy.md](deploy.md) | 完整部署指南（手动方式） |
| [admin-setup-guide.md](admin-setup-guide.md) | AI 辅助部署操作指南 |
| [admin-config-guide.md](admin-config-guide.md) | Admin 页面各配置项获取方法 |
| [user-credentials-guide.md](user-credentials-guide.md) | 部署前需准备的凭据清单 |
| [ai-secrets-config-guide.md](ai-secrets-config-guide.md) | 让 AI 帮你配置 Secrets |

### 接入渠道

| 文档 | 说明 |
|------|------|
| [channel-feishu.md](channel-feishu.md) | 飞书机器人接入 |
| [channel-telegram.md](channel-telegram.md) | Telegram Bot 接入 |
| [channel-wecom.md](channel-wecom.md) | 企业微信接入 |

### 功能配置

| 文档 | 说明 |
|------|------|
| [feishu-oauth-setup.md](feishu-oauth-setup.md) | 飞书 OAuth 用户认证配置 |
| [feishu-doc-fetch.md](feishu-doc-fetch.md) | 飞书文档抓取配置 |
| [telegram-bot-setup.md](telegram-bot-setup.md) | Telegram Bot 图片存储配置 |
| [image-cdn-guide.md](image-cdn-guide.md) | 图片 CDN（R2 + 自定义域名） |
| [fetch-modes-guide.md](fetch-modes-guide.md) | 文章抓取两种模式说明 |

### 架构参考

| 文档 | 说明 |
|------|------|
| [worker-architecture.md](worker-architecture.md) | Worker 架构与扩展规划 |
| [worker-github-interaction.md](worker-github-interaction.md) | Worker ↔ GitHub Actions 交互流程 |
| [notification-strategy.md](notification-strategy.md) | 为什么用 Worker 做消息中转 |

---

## 📦 归档文档（已完成的设计/重构，保留供追溯）

以下文档是已执行完毕的一次性设计方案或迁移记录，不再需要日常参考。
移入 `docs/archive/` 目录。

| 文档 | 原因 |
|------|------|
| redesign-v2.md | v2 重构设计文档，已全部实施完毕 |
| run-task-refactor-design.md | Bash→Python 重构，已完成 |
| code-quality-fix-design.md | 代码质量修复，已完成 |
| workflow-slim-design.md | Workflow 瘦身，已完成 |
| feishu-fetcher-split-design.md | Feishu fetcher 拆分，已完成 |
| capabilities-refactor-tasks.md | capabilities 重构任务，已完成 |
| admin-panel-design.md | Admin 页面设计文档，已实施 |
| hugo-to-astro-migration.md | Hugo→Astro 迁移方案，已完成 |
| pycore-usage-optimization.md | pycore 复用分析，一次性文档 |
| deployment-guide.md | 早期 AI 部署指南，已被 admin-setup-guide.md 替代 |
| oracle-cloud-free-tier.md | Oracle Cloud 教程，与 msgflow 无直接关系 |
| oracle-cloud-create-instance.md | Oracle Cloud 教程，与 msgflow 无直接关系 |
