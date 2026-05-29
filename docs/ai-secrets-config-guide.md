# 通过 AI 配置 Secrets 指南

让 AI 帮你配置 GitHub Secrets 和 Cloudflare Worker Secrets，不用手动去网页操作。

## 前置条件

### GitHub CLI (`gh`)

| 步骤 | 谁做 | 命令/操作 |
|------|------|----------|
| 安装 gh | ✅ AI 可做 | `sudo apt install gh` |
| 登录 gh | ❌ 用户必须 | `gh auth login` → 浏览器打开 → 用户登录 GitHub 账号并授权 |
| 验证 | ✅ AI 可做 | `gh auth status` |

### Cloudflare CLI (`wrangler`)

| 步骤 | 谁做 | 命令/操作 |
|------|------|----------|
| 安装 wrangler | ✅ AI 可做 | `npm install -g wrangler` |
| 登录 wrangler | ❌ 用户必须 | `npx wrangler login` → 浏览器打开 → 用户登录 Cloudflare 账号并授权 |
| 验证 | ✅ AI 可做 | `npx wrangler whoami` |

### 配置 Secrets

| 步骤 | 谁做 | 说明 |
|------|------|------|
| 提供 secret 值 | ❌ 用户必须 | 告诉 AI 名称和值 |
| 执行存储命令 | ✅ AI 可做 | `gh secret set` / `wrangler secret put` |
| 上传到 KV | ✅ AI 可做 | `wrangler kv key put` |

**总结：用户只需要做两件事：**
1. 首次登录（浏览器授权，只需一次）
2. 提供 secret 的值

其余全部由 AI 完成。

### Cloudflare KV

**用户需要提供：**
- KV namespace ID（从 wrangler.toml 读取）
- Key 和 Value

**AI 执行的命令：**
```bash
npx wrangler kv key put --namespace-id "ID" "key" --value "value" --remote
```

## 常用配置清单

### msgflow 项目

| Secret | 存储位置 | 用途 |
|--------|---------|------|
| `FEISHU_APP_ID` | GitHub Secrets + CF Worker Secrets | 飞书 API |
| `FEISHU_APP_SECRET` | GitHub Secrets + CF Worker Secrets | 飞书 API |
| `feishu_user_token` | Cloudflare KV | 飞书用户 OAuth token（JSON） |
| `GITHUB_TOKEN` | GitHub 自动提供 | Actions 内置 |
| `CALLBACK_SECRET` | GitHub Secrets + CF Worker Secrets | Actions 回调验证 |

### ai-gateway 项目

| Secret | 存储位置 | 用途 |
|--------|---------|------|
| `OPENROUTER_API_KEY` | CF Worker Secrets | AI API 密钥（逗号分隔多个） |
| `TURNSTILE_SECRET` | CF Worker Secrets | 人机验证 |

## AI 操作流程

### 场景 1：用户说"帮我配置飞书凭据"

```
AI 需要问用户：
1. App ID 是什么？
2. App Secret 是什么？
3. 配到哪些项目？（msgflow? 其他?）

AI 执行：
1. gh secret set FEISHU_APP_ID --body "<value>" --repo ohwiki/msgflow
2. gh secret set FEISHU_APP_SECRET --body "<value>" --repo ohwiki/msgflow
3. cd worker-v2 && echo "<value>" | npx wrangler secret put FEISHU_APP_ID
4. cd worker-v2 && echo "<value>" | npx wrangler secret put FEISHU_APP_SECRET
```

### 场景 2：用户说"帮我加一个新的 API Key"

```
AI 需要问用户：
1. Key 的名称？
2. Key 的值？
3. 存到哪里？（GitHub Secrets / CF Worker Secrets / KV）
4. 哪个项目/Worker？

AI 执行对应命令。
```

### 场景 3：用户说"查看当前有哪些 secrets"

```
AI 执行：
- gh secret list                              # GitHub Secrets
- npx wrangler secret list                    # CF Worker Secrets
- npx wrangler kv key list --namespace-id ID --remote  # KV keys
```

## 安全注意事项

- ❌ AI 不应该在回复中回显 secret 的值
- ❌ AI 不应该把 secret 写入任何文件（除了 .env 且已在 .gitignore）
- ✅ AI 可以引用 secret 的名称（如 `FEISHU_APP_ID`）
- ✅ AI 执行完后确认"已设置"即可，不需要显示值
