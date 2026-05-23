# 飞书文档抓取配置

让 msgflow 能高质量抓取飞书文档（docx、wiki 知识库页面），通过飞书开放 API 获取结构化数据，转为干净的 Markdown。

## 为什么需要单独配置

飞书文档是 JS 渲染的，普通网页抓取效果差（图片丢失、内容截断）。

通过飞书 API 抓取，能拿到完整的结构化数据：标题层级、代码块（含语言标记）、图片、列表、待办等全部保留。

## 前提条件

- 一个飞书账号（手机号注册即可）
- 5 分钟时间

## 配置步骤

### 1. 创建飞书应用

打开 https://open.feishu.cn → 登录 → 创建企业自建应用

填写应用名称（如 `msgflow-reader`），创建后记录：
- **App ID**：格式 `cli_xxxxxxxxxxxxxxxx`
- **App Secret**：点击显示后复制

### 2. 添加文档读取权限

进入应用 → 权限管理 → 搜索并开通：

| 权限 | 用途 |
|------|------|
| `docx:document:readonly` | 读取文档内容 |
| `wiki:wiki:readonly` | 读取知识库页面 |

### 3. 发布应用

进入版本管理与发布 → 创建版本 → 提交（企业内部应用通常自动通过）

### 4. 配置凭据

需要在两个地方配置：

#### Worker 环境变量（用于 Worker 内飞书 fetcher）

```bash
npx wrangler secret put FEISHU_APP_ID --env production
npx wrangler secret put FEISHU_APP_SECRET --env production
```

#### GitHub Actions Secrets（用于 Python 精细处理）

在 `ohmyflow/msgflow-tasks` 仓库：Settings → Secrets → Actions → New repository secret：

| Name | Value |
|------|-------|
| `FEISHU_APP_ID` | 你的 App ID |
| `FEISHU_APP_SECRET` | 你的 App Secret |

## 使用方式

### 方式一：后台 Web 界面

在后台 https://admin.ouraihub.com/fetch 输入飞书文档 URL，点击抓取即可。

### 方式二：聊天指令

通过 Telegram/飞书/企业微信发送：

```
skill:markdown-proxy https://xxx.feishu.cn/wiki/xxxxxxxx
```

系统会自动识别飞书链接，走精细模式（GitHub Actions + 飞书 API）处理。

## 支持的 URL 格式

```
https://xxx.feishu.cn/docx/xxxxxxxx       # 新版文档
https://xxx.feishu.cn/docs/xxxxxxxx       # 旧版文档
https://xxx.feishu.cn/wiki/xxxxxxxx       # 知识库页面
https://xxx.larksuite.com/docx/xxxxxxxx   # 国际版
```

## 处理流程

```
飞书 URL → Worker 识别为飞书 → 触发 GitHub Actions
  → Python 调用飞书 Open API
  → 获取文档 Blocks（分页，最多 500/页）
  → 逐块转换 Markdown（16 种 block type）
  → 回调 Worker 存储 + 归档到 GitHub
```

支持的 Block 类型：

| Block Type | 转换结果 |
|-----------|---------|
| 文本 | 段落（含加粗/斜体/删除线/行内代码/链接） |
| 标题 1-7 | `# ~ #######` |
| 无序列表 | `- item` |
| 有序列表 | `1. item` |
| 代码块 | ` ```language ... ``` `（自动识别语言） |
| 引用 | `> text` |
| 待办 | `- [x] / - [ ]` |
| 分割线 | `---` |
| 图片 | `![image](feishu-image://token)` |
| 公式 | `$equation$` |

## 能抓什么

| 文档类型 | 能否抓取 | 说明 |
|---------|---------|------|
| 互联网公开的文档 | ✅ | 设置了「互联网可见」的文档 |
| 你自己的文档 | ✅ | 应用代表你访问 |
| 别人分享给你的文档 | ✅ | 你有查看权限即可 |
| 别人的私有文档 | ❌ | 没有权限 |

## 故障排查

| 问题 | 原因 | 解决 |
|------|------|------|
| 返回权限错误 | 应用没有文档读取权限 | 检查权限管理，确认已开通 `docx:document:readonly` |
| 知识库页面抓取失败 | 缺少 wiki 权限 | 添加 `wiki:wiki:readonly` 权限 |
| App Secret 无效 | 应用未发布 | 确认应用已发布上线 |
| 内容为空 | 文档是私有的且你无权访问 | 确认文档对你的账号可见 |
| Actions 中飞书步骤失败 | Secrets 未配置 | 检查 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET` 是否设置 |
