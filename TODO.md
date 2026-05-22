# msgflow 待办清单

## 已完成 ✅

- [x] Phase 0：项目骨架 + D1/R2/KV 创建
- [x] Phase 1：抓取能力（weixin/feishu/twitter/rss/generic fetcher）
- [x] Phase 2：GitHub/GitLab Actions + callback + 一次性 token 安全模型
- [x] Phase 3：Astro 展示站骨架（Content Collections + 双部署配置）
- [x] Phase 5（部分）：Telegram + 飞书 webhook handler
- [x] 认证：密码登录 + Google OAuth + 修改密码
- [x] 清洗：turndown（无代码块文章 Worker 内闭环）
- [x] 代码质量：接口抽象 / 统一错误处理 / 结构化日志 / 常量集中 / fetchWithTimeout
- [x] 测试：vitest 28 个用例 + CI workflow
- [x] Python 架构：Protocol 接口 + 装饰器注册表 + 统一 CLI
- [x] 规范文档：AGENTS.md（TS + Python 编码规范）
- [x] 设计文档：redesign-v2.md / hugo-to-astro-migration.md / deployment-guide.md

## 待做

### 部署上线（需要用户提供凭据）

- [ ] 用户提供 GitHub Personal Access Token（repo + workflow 权限）
- [ ] 配置 Worker 线上 Secrets（Google OAuth / GitHub Token / Callback Secret）
- [ ] 初始化线上 D1 schema
- [ ] 设置初始登录密码到线上 KV
- [ ] 验证线上完整流程（登录 → 抓取 → 查看）
- [ ] 参考文档：`docs/deployment-guide.md` + `docs/user-credentials-guide.md`

### Phase 3 补全：Hugo 主题迁移到 Astro

- [ ] 还原 hugo-theme-paper 的视觉设计到 Astro
- [ ] 组件迁移（Header/Footer/PostCard/Tag/Breadcrumb 等）
- [ ] Islands 交互（主题切换/代码复制/返回顶部/搜索）
- [ ] SEO（OG Image / Schema.org）
- [ ] i18n（中/英）
- [ ] 集成 @ouraihub/ui-library 的 Astro 包
- [ ] 参考文档：`docs/hugo-to-astro-migration.md`

### Phase 4：AI 改写 + NullClaw

- [ ] rewrite-article.yml workflow（安装 NullClaw + 执行 skill）
- [ ] run-skill.yml workflow（通用 skill 执行）
- [ ] 改写命令（改写 鲁迅/马三立/徐志摩 <URL>）
- [ ] 蒸馏命令（蒸馏 <人名>）
- [ ] AI Runner 能力（LLM 摘要/标签/分类）
- [ ] 需要：NullClaw API Key + Base URL

### Phase 5 补全：聊天集成

- [ ] 企业微信 webhook handler
- [ ] 抓取完成后回复消息通知（Telegram/飞书）
- [ ] 高级命令迁移（摄入/查询/蒸馏/改写/发布）

### Phase 6：发布能力

- [ ] 发布到飞书文档（publish_feishu）
- [ ] 发布到墨问（publish）
- [ ] 待发布列表查询（pending）
- [ ] 健康检查 / lint
- [ ] 需要：飞书 App 凭据 / 墨问 API Key

### Phase 7：知识库

- [ ] 摄入（ingest）：URL → 抓取 → 存入知识库
- [ ] 查询（query）：基于知识库回答
- [ ] 封面图生成（cover）
- [ ] 与 llmwiki 集成

### 其他

- [ ] 加 /api/ci-download 端点（避免用户配 CF API Token）
- [ ] Telegram bot 创建 + webhook 配置
- [ ] 绑定自定义域名（admin.xxx.com + read.xxx.com）
- [ ] 图片持久化（Telegram 存储 + R2 缓存）
- [ ] RSS 定时轮询（cron 逻辑填充）

## 分支信息

- 仓库：`https://github.com/ohwiki/msgflow`
- 分支：`feat/worker-content-system-v2`
- Worker 部署地址：`https://msgflow-v2.ouraihub.workers.dev`
- 本地开发：`cd worker-v2 && npx wrangler dev --local --port 8788`
