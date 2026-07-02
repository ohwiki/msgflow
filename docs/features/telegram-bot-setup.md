# 创建 Telegram Bot（图片存储用）

## 用途

这个 bot 用于将文章图片上传到 Telegram 私有频道做永久存储。Worker 展示图片时从 Telegram 拉取并缓存到 R2。

## 第一步：创建 Bot

1. 打开 Telegram，搜索 `@BotFather`
2. 发送 `/newbot`
3. 输入 bot 名称：`msgflow image store`（显示名，随意）
4. 输入 bot 用户名：`msgflow_img_bot`（必须以 `_bot` 结尾，全局唯一，被占了就换一个）
5. BotFather 会返回一个 token，格式类似：`7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
6. **保存这个 token**

## 第二步：创建私有频道

1. Telegram 里创建一个新频道（Channel）
2. 设为**私有**（Private）
3. 频道名随意，比如 `msgflow-images`
4. 创建完成后，把刚才的 bot 添加为频道管理员：
   - 进入频道设置 → 管理员 → 添加管理员
   - 搜索你的 bot 用户名
   - 给它 **发送消息** 权限即可

## 第三步：获取频道 ID

1. 在频道里随便发一条消息
2. 把 bot 加入频道后，访问：
   ```
   https://api.telegram.org/bot<你的TOKEN>/getUpdates
   ```
3. 在返回的 JSON 里找到 `"chat": {"id": -100xxxxxxxxxx}`，这个负数就是频道 ID
4. **保存这个频道 ID**

如果 getUpdates 返回空，试试：
- 先把 bot 从频道移除再重新添加
- 或者在频道里 @你的bot 发一条消息
- 再次访问 getUpdates

## 第四步：验证

发一张测试图片确认 bot 能往频道发消息：

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendPhoto" \
  -F "chat_id=<频道ID>" \
  -F "photo=https://via.placeholder.com/100"
```

返回 `"ok": true` 就成功了。

## 第五步：配置到 Worker

把以下值添加到 Worker 的环境变量（wrangler.toml 的 `[vars]` 或 Cloudflare Dashboard 的 Secrets）：

```
TELEGRAM_BOT_TOKEN = "7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TELEGRAM_CHANNEL_ID = "-100xxxxxxxxxx"
```

建议用 Secrets（Dashboard → Worker → Settings → Variables → Encrypt），不要明文写在 wrangler.toml 里。

## 完成

配置好后，Worker 的图片上传流程：
1. 抓取文章时提取图片 URL
2. 调用 `sendPhoto` API 上传到频道
3. 从返回值拿到 `file_id` 存入 D1
4. 展示时通过 `getFile` API 获取下载链接 → 缓存到 R2
