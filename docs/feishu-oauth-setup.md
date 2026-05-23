# 飞书 OAuth 用户身份认证

## 为什么需要用户身份

飞书有两种 API 调用身份：

| 身份 | 能访问的文档 | Token 获取方式 |
|------|------------|--------------|
| 应用身份（app_access_token） | 只能读被授权给应用的文档（同租户） | App ID + Secret 直接换 |
| 用户身份（user_access_token） | 能读用户本人能看到的所有文档（跨租户） | OAuth 授权码流程 |

**我们用用户身份**，因为需要抓取外部租户分享的飞书文档。

## Token 存储和刷新机制

```
OAuth 授权（一次性）→ user_access_token + refresh_token
                          ↓
                    存到 Worker KV（key: feishu_user_token）
                          ↓
              Worker cron 每 3 小时检查，快过期就自动刷新
                          ↓
              Python fetcher 从 KV 读 token 调 API
```

- `user_access_token`：有效期 2 小时，Worker cron 自动刷新
- `refresh_token`：有效期 30 天，每次刷新会续期，只要 cron 在跑就永不过期

## 相关文件

| 文件 | 作用 |
|------|------|
| `python/src/lib/feishu_oauth.py` | 一次性 OAuth 授权脚本（本地跑） |
| `python/src/fetchers/feishu.py` | 飞书 fetcher（读 KV token → 调 blocks API） |
| `worker-v2/src/index.ts` | cron handler（自动刷新 token） |
| `~/.feishu_token.json` | 本地 token 缓存（fallback） |
| KV key: `feishu_user_token` | 远程 token 存储（GitHub Actions 用） |

## 首次配置步骤

### 1. 飞书开放平台配置

- 应用：你的飞书应用 App ID
- 安全设置 → 重定向 URL：`http://localhost:9999/callback`
- 权限（用户身份）：
  - `docx:document:readonly`
  - `wiki:wiki:readonly`
  - `docs:document.media:download`

### 2. 执行 OAuth 授权

```fish
cd /home/administrator/workspace/open-source/msgflow/python/src
set -x FEISHU_APP_ID "<your_app_id>"
set -x FEISHU_APP_SECRET "<your_app_secret>"
uv run python lib/feishu_oauth.py
```

浏览器打开链接 → 登录飞书 → 点同意 → 终端显示成功。

### 3. 上传 token 到 KV

```bash
cd worker-v2
npx wrangler kv key put --namespace-id "7158494aa5804d02ae472f82d4b61199" \
  "feishu_user_token" --value "$(cat ~/.feishu_token.json)" --remote
```

### 4. 确认 Worker secrets 已设置

```bash
cd worker-v2
echo "<your_app_id>" | npx wrangler secret put FEISHU_APP_ID
echo "<your_app_secret>" | npx wrangler secret put FEISHU_APP_SECRET
```

## 日常维护

**正常情况：不需要任何维护。** Worker cron 自动刷新 token。

**异常情况（token 彻底过期）：** 如果 Worker 连续 30 天没跑（不可能），需要重新执行步骤 2 和 3。

## 注意事项

- ❌ 不要把 token 提交到 git（`.feishu_token.json` 已在 gitignore）
- ❌ 不要手动修改 KV 里的 token 值
- ✅ fetcher 优先从 KV 读，fallback 到本地文件
- ✅ 本地开发时有 `~/.feishu_token.json` 就能用，不需要 KV

## 飞书图片下载

飞书文档中的图片会自动下载到 `./images/` 目录，markdown 引用相对路径 `./images/xxx.png`。

### 实现细节

- API：`GET /open-apis/drive/v1/medias/{token}/download?extra={"drive_route_token":"doc_id"}`
- `extra` 参数必须传文档 ID，否则返回 403
- 图片 block type：17（旧 API）和 27（新 API）
- 下载失败时 fallback 到 `feishu-image://token` 占位符

### 已知限制

- 部分文档的图片可能返回 403（文档所有者未开放图片权限）
- 此时 markdown 中保留 `feishu-image://token` 占位符，不影响文本内容
