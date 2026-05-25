# 任务通知方案对比

## 背景

GitHub Actions 执行完任务后，需要通知用户结果。有三种方案。

## 方案对比

### 方案 A：Python 直接通知（wucurcheck 现用）

```
用户发指令 → Worker 触发 Actions → Python 执行任务 → Python 直接发通知给用户
```

**实现**：Python 端调 Telegram Bot API / 飞书 Webhook / 邮件等，直接发消息。

**优点**：
- 最快（少一跳网络请求）
- 最可靠（不依赖 Worker 在线）
- 代码简单（一个 HTTP 请求）

**缺点**：
- 需要把 bot token、chat_id、webhook URL 等全部存到 GitHub Secrets
- 配置分散（GitHub Secrets + Worker Secrets 两处维护）
- Python 需要知道用户来自哪个通道（需要 Worker 传 channel 参数）

**适合**：配置简单的项目、通知通道固定的场景。

---

### 方案 B：回调 Worker 转发通知（nullclaw-ci / msgflow 现用）

```
用户发指令 → Worker 触发 Actions → Python 执行任务 → Actions 回调 Worker → Worker 通知用户
```

**实现**：Actions 完成后 POST 结果到 Worker callback URL，Worker 根据 chat_id 和通道类型回复用户。

**优点**：
- 配置集中（所有 token/key 在 Worker KV 里统一管理）
- Worker 知道用户来自哪个通道，自动选择回复方式
- Python 端不需要关心通知逻辑，只输出结果
- 支持从 Worker KV 动态拉取敏感配置给 Actions 用

**缺点**：
- 多一跳（Actions → Worker → 用户），延迟增加 ~1 秒
- 依赖 Worker 在线（Worker 挂了通知丢失）
- 需要维护 callback 接口 + secret 验证

**适合**：多通道（Telegram + 飞书 + 企业微信）、配置需要集中管理的项目。

---

### 方案 C：混合模式

```
Python 直接发通知（快速反馈）+ 回调 Worker 更新状态（数据同步）
```

**实现**：
- Python 执行完直接发 Telegram/飞书通知（用户立即收到）
- 同时回调 Worker 更新数据库/面板状态（不用于通知）

**优点**：
- 通知最快（直接发）
- 状态同步不丢（Worker 更新 DB）
- 即使 Worker 挂了，用户也能收到通知

**缺点**：
- 两处都要配置（GitHub Secrets 存通知 token，Worker 存业务配置）
- 逻辑稍复杂（两条路径）

**适合**：对通知时效性要求高，同时需要 Worker 管理面板的项目。

---

## 各项目现状与建议

| 项目 | 现用方案 | 建议 | 理由 |
|------|---------|------|------|
| wucurcheck | A（Python 直接发） | 保持 A | 通知通道固定（Telegram），配置简单 |
| msgflow | B（Worker 回调） | 可改为 C | 通知走直发更快，callback 保留用于更新文章状态 |
| nullclaw-ci | B（Worker 回调） | 保持 B | 依赖 Worker 拉 KV 配置，改动大收益小 |

## 决策要素

选择方案时考虑：

1. **你主要用什么收通知？** → 如果只用 Telegram，方案 A 最简单
2. **配置是否经常变？** → 经常变选 B（KV 集中管理），不变选 A（GitHub Secrets）
3. **是否需要 Worker 面板同步状态？** → 需要则用 C（通知 + 回调并行）
4. **Worker 是否可能挂？** → 担心可靠性选 A 或 C

## pycore.notify 的定位

无论选哪种方案，`pycore.notify` 都可以作为方案 A/C 中 Python 直接发通知的实现。

当前 pycore.notify 支持：Telegram、飞书 Webhook。
wucurcheck 的 NotificationKit 支持：Telegram、飞书、钉钉、企业微信、邮件、Bark、Gotify、PushPlus、Server Push（9 种）。

后续可以把 wucurcheck 的 NotificationKit 能力合并到 pycore.notify 中，统一所有项目的通知实现。
