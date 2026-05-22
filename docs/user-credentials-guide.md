# 用户凭据准备指南

部署 msgflow 前，你需要准备以下凭据。全部配置在 Cloudflare Worker 一处，GitHub/GitLab 仓库不需要配任何 secrets。

---

## 必须提供

### 1. 管理后台登录密码

自己定一个，至少 6 位。例如：`MySecurePass123`

---

### 2. GitHub Personal Access Token

**用途：** Worker 自动触发 GitHub Actions（格式化有代码块的文章）

**获取步骤：**

1. 打开 https://github.com/settings/tokens
2. 点击 **Generate new token (classic)**
3. Note 填：`msgflow-worker`
4. Expiration：选 90 天或 No expiration
5. 勾选权限：
   - ✅ `repo`（全部子项）
   - ✅ `workflow`
6. 点 **Generate token**
7. **立即复制 token**（页面关闭后无法再看）

格式类似：`ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 3. Google OAuth 凭据（可选，如果要 Google 登录）

**用途：** 管理后台支持 Google 账号登录

**获取步骤：**

1. 打开 https://console.cloud.google.com/apis/credentials
2. 选择你的项目（或创建新项目）
3. 如果没配过 OAuth 同意屏幕：
   - 左侧菜单 → OAuth consent screen
   - User Type 选「外部」→ 创建
   - 应用名称填 `msgflow`，邮箱填你的
   - 保存（其他都跳过）
4. 回到 Credentials 页面
5. 点 **+ 创建凭据** → **OAuth 客户端 ID**
6. 应用类型：**Web 应用**
7. 名称：`msgflow-admin`
8. 已获授权的重定向 URI，添加：
   - `https://msgflow-v2.ouraihub.workers.dev/auth/google/callback`
   - （如果有自定义域名）`https://admin.yourdomain.com/auth/google/callback`
9. 点创建，复制 **Client ID** 和 **Client Secret**

---

## 可选提供

### 4. 自定义域名

如果你想用自己的域名（如 `admin.yourdomain.com`）而不是默认的 `msgflow-v2.ouraihub.workers.dev`。

**前提：** 域名的 DNS 已托管在 Cloudflare。

**操作：** 告诉 AI 你要绑定的域名，AI 会指导你在 Dashboard 添加。

---

### 5. 飞书应用凭据（如果要抓取飞书文档）

**获取步骤：**

1. 打开 https://open.feishu.cn/app
2. 创建企业自建应用
3. 获取 **App ID** 和 **App Secret**
4. 在权限管理中添加：`docx:document:readonly`、`wiki:wiki:readonly`

---

### 6. Telegram Bot Token（如果要图片持久化存储）

参考 `docs/telegram-bot-setup.md`。

---

## 汇总清单

把以下信息准备好，交给 AI 执行部署：

```
管理后台密码：_______________
GitHub Token：ghp________________
Google Client ID：_______________（可选）
Google Client Secret：_______________（可选）
自定义域名：_______________（可选，默认用 workers.dev）
飞书 App ID：_______________（可选）
飞书 App Secret：_______________（可选）
```

AI 拿到这些后会自动完成所有配置和部署，你不需要在 GitHub 或其他平台配置任何东西。
