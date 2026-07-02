# msgflow 部署指南（AI Agent 执行）

## 概述

本文档供 AI Agent 执行部署。用户只需提供凭据（见 `docs/user-credentials-guide.md`），其余全部由 AI 完成。

## 前置条件

- 用户已提供所有凭据（见用户凭据指南）
- 代码已推到 GitHub 仓库
- Cloudflare 账号已登录（`npx wrangler whoami` 能看到账号）

## 部署步骤

### Step 1：初始化线上 D1 数据库

```bash
cd worker-v2
npx wrangler d1 execute msgflow-content --remote --file=schema.sql
```

验证：`npx wrangler d1 execute msgflow-content --remote --command="SELECT name FROM sqlite_master WHERE type='table'"` 应返回 `articles` 和 `images`。

### Step 2：设置初始密码到线上 KV

```bash
# 生成密码 hash（替换 YOUR_PASSWORD 为用户提供的密码）
HASH=$(node -e "const c=require('crypto');console.log(c.createHash('sha256').update('YOUR_PASSWORD').digest('hex'))")

# 写入 KV
npx wrangler kv key put "auth_config" "{\"mode\":\"password\",\"allow_register\":false,\"allowed_emails\":[\"*\"],\"password_hash\":\"$HASH\"}" --namespace-id=7158494aa5804d02ae472f82d4b61199 --remote
```

### Step 3：配置 Worker Secrets

通过 CLI 逐个设置（用户提供的值替换占位符）：

```bash
cd worker-v2

# Google OAuth
echo "CLIENT_ID_VALUE" | npx wrangler secret put GOOGLE_CLIENT_ID
echo "CLIENT_SECRET_VALUE" | npx wrangler secret put GOOGLE_CLIENT_SECRET

# GitHub（用于触发 Actions）
echo "GITHUB_TOKEN_VALUE" | npx wrangler secret put GITHUB_TOKEN

# 回调安全（AI 自动生成随机值）
echo "$(openssl rand -hex 32)" | npx wrangler secret put CALLBACK_SECRET

# Worker 自身 URL
echo "https://msgflow-v2.ouraihub.workers.dev" | npx wrangler secret put WORKER_URL

# GitHub 仓库名
echo "ohwiki/msgflow" | npx wrangler secret put GITHUB_REPO

# Cloudflare 账号 ID（用于 ci-config 返回给 Actions）
echo "34d0f0b38fb6c0bd4d3a8f76b1164b2e" | npx wrangler secret put CF_ACCOUNT_ID
```

### Step 4：部署 Worker

```bash
cd worker-v2
npx wrangler deploy
```

验证：`curl -s https://msgflow-v2.ouraihub.workers.dev/login` 应返回登录页 HTML。

### Step 5：添加 /api/ci-download 端点（可选，避免用户配 CF API Token）

如果用户没有提供 CF R2 API Token，需要在 Worker 里加一个下载端点，让 Actions 通过 Worker 代理下载 R2 文件。实现后更新 `fetch-article.yml` 中的下载步骤。

### Step 6：绑定自定义域名（可选）

```bash
# 通过 wrangler 添加自定义域名路由
npx wrangler deployments list  # 确认部署成功
```

用户需要在 Cloudflare Dashboard → Worker → Triggers → Custom Domains 手动添加域名。或者先用默认的 `*.workers.dev` 域名。

### Step 7：验证完整流程

```bash
# 1. 登录
curl -s -X POST https://msgflow-v2.ouraihub.workers.dev/login -d "username=admin&password=USER_PASSWORD" -D - | grep "Set-Cookie"

# 2. 抓取一篇无代码块的文章（应直接变 cleaned）
curl -s -X POST https://msgflow-v2.ouraihub.workers.dev/api/fetch \
  -H "Cookie: msgflow_session=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://some-article-without-code.com"}'

# 3. 查看文章列表
curl -s https://msgflow-v2.ouraihub.workers.dev/api/articles -H "Cookie: msgflow_session=TOKEN"
```

### Step 8：验证 Google OAuth

1. 访问 `https://msgflow-v2.ouraihub.workers.dev/login`
2. 点击 Google 登录按钮
3. 应跳转到 Google 授权页面
4. 授权后应回到管理后台首页

注意：Google OAuth 的 redirect URI 必须和 Google Cloud Console 里配置的一致。如果用 workers.dev 域名，需要在 Console 里加 `https://msgflow-v2.ouraihub.workers.dev/auth/google/callback`。

## 部署后的架构

```
用户浏览器 → https://msgflow-v2.ouraihub.workers.dev（或自定义域名）
  ├── /login → 密码 / Google OAuth
  ├── / → 文章列表
  ├── /fetch → 抓取表单
  ├── /settings → 修改密码
  └── /api/* → REST API

抓取有代码块的文章时：
  Worker → 生成一次性 token → 触发 GitHub Actions
  Actions → 调 /api/ci-config 拿配置 → 调 /api/ci-download 拿 HTML → 格式化 → 回调 /api/callback
```
