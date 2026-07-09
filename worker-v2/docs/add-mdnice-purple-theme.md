# 任务：为公众号排版器新增「mdnice紫色」主题

## 项目位置
- 排版器代码：`/home/administrator/workspace/open-source/msgflow/worker-v2/src/formatter/`
- 主题文件目录：`/home/administrator/workspace/open-source/msgflow/worker-v2/src/formatter/themes/`
- 已有6个主题：moyu-green, red-white, graphite-minimal, zen-whitespace, moyu-ticket, olive-journal

## 架构说明

### 添加新主题的步骤
1. 在 `themes/` 目录创建 `mdnice-purple.ts`，继承 `BaseTheme`
2. 在 `themes/registry.ts` 中 import 并注册
3. 部署：`cd worker-v2 && npx wrangler deploy --env production`

### 主题文件结构（参考 `themes/red-white.ts`）
```typescript
import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class MdnicePurpleTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "mdnice-purple",
    name: "Mdnice紫色",
    description: "紫色左竖条+网格纸纹背景，适合技术文章和工具评测",
    scenes: ["技术", "工具评测", "教程"],
  };

  readonly colors: ThemeColors = {
    primary: "#916DD5",      // 主紫色
    primaryDark: "#6B4FA0",  // 深紫
    primaryLight: "#DEC6FB", // 浅紫（左竖条/分割线）
    primaryBg: "#F6EEFF",    // 极浅紫底
    title: "#595959",        // 标题色（深灰）
    body: "#595959",         // 正文色
    muted: "#9CA3AF",        // 辅助文字
    border: "#DEC6FB",       // 边框色
    underline: "border-bottom:2px solid #DEC6FB;font-weight:600;",  // 下划线样式
  };
}
```

### 注册到 registry.ts
```typescript
import { MdnicePurpleTheme } from "./mdnice-purple.js";
// 在 register 调用处添加：
register(new MdnicePurpleTheme());
```

### BaseTheme 已提供的默认渲染方法
BaseTheme 在 `themes/base-theme.ts` 中实现了所有 ITheme 接口方法的默认版本：
- `renderContainerOpen/Close` — 全局容器
- `renderLeadQuote` — 引言卡
- `renderHighlights` — 3个看点面板
- `renderDivider` — 分割线
- `renderChapterHeading` — 章节标题（编号+英文标签+中文标题）
- `renderSubHeading` — 子标题
- `renderParagraph` — 段落（支持inline marks）
- `renderBlockquote` — 引用
- `renderCodeBlock` — 代码块
- `renderImage` — 图片
- `renderList` — 列表
- `renderEnding` — 结语
- `renderSignature` — 签名
- `renderReferences` — 参考链接
- `renderLeadQuoteMarked` — AI金句（带高亮词）
- `renderMarkedParagraph` — AI标记段落
- `renderBlockquoteBox` — AI左竖条引用块

**如果默认实现的样式不符合mdnice紫色风格，可以在子类中 override 对应方法。**

## 目标主题的设计变量（从贴的HTML中提取）

```
主色调：       #916DD5（紫色）
主色调深：     rgb(145, 109, 213) 即 #916DD5
主色调浅：     #DEC6FB（浅紫，左竖条/分割线）
主色调极浅：   rgb(246, 238, 255) 即 #F6EEFF
背景纸纹：     linear-gradient(90deg, rgba(50,0,0,0.05) 0%, rgba(0,0,0,0) 6.76%), linear-gradient(360deg, rgba(50,0,0,0.05) 0%, rgba(249,247,252,0) 9.46%)  size: 20px 20px
标题色：       rgb(89, 89, 89) 即 #595959
正文色：       rgb(89, 89, 89)
正文字号：     15px
行高：         1.8em
字间距：       0.02em
分割线：       border-top: 2px solid rgb(217, 184, 250) 即 #D9B8FA
脚注高亮词：   color: #916DD5; font-weight: bold
行内代码：     color: #916DD5; background: rgba(27,31,35,0.05); border-radius: 4px; padding: 2px 4px; font-family: 'Operator Mono', Consolas, Monaco, Menlo, monospace
字体栈：       Optima, 'Microsoft YaHei', PingFangSC-regular, serif
最大宽度：     不限（公众号自适应）
```

## 目标主题的组件样式

### 章节标题（h2）
```html
<h2 style="margin-top:30px;margin-bottom:15px;">
  <span class="content" style="font-size:18px;color:#595959;line-height:1.8em;padding-left:10px;border-left:5px solid #DEC6FB;display:block;font-weight:bold;">章节标题文字</span>
</h2>
```

### 分割线
```html
<hr style="margin:10px 0;border-top:2px solid #D9B8FA;border-bottom:none;border-left:none;border-right:none;height:1px;">
```

### 正文段落
```html
<p style="color:#595959;font-size:15px;line-height:1.8em;letter-spacing:0.02em;text-align:left;margin:0;padding:8px 0;">正文内容</p>
```

### 脚注引用词（正文中的链接文字）
```html
<span style="color:#916DD5;font-weight:bold;">链接文字</span><sup style="line-height:0;color:#916DD5;font-weight:bold;">[1]</sup>
```

### 行内代码
```html
<code style="color:#916DD5;font-size:14px;background:rgba(27,31,35,0.05);padding:2px 4px;border-radius:4px;font-family:'Operator Mono',Consolas,Monaco,Menlo,monospace;word-break:break-all;">代码</code>
```

### 列表
```html
<ul style="list-style-type:circle;margin:8px 0;padding-left:25px;">
  <li><section style="margin:5px 0;color:#595959;font-size:14px;line-height:1.8em;">内容</section></li>
</ul>
```

### Reference 脚注区块
```html
<section style="margin-top:30px;margin-bottom:15px;border-bottom:1px solid rgba(222,198,251,0.4);">
  <span style="display:block;color:#000;font-size:18px;line-height:1.5em;text-align:center;font-weight:bold;">Reference</span>
</section>
<section style="margin:0;padding:20px;border:1px solid #DEC6FB;border-radius:4px;background:#F6EEFF;">
  <!-- 每条脚注 -->
  <span style="display:flex;font-size:14px;line-height:1.8em;">
    <span style="color:rgba(89,89,89,0.6);width:10%;font-size:80%;">[1] </span>
    <p style="color:#595959;font-weight:bold;display:inline;word-break:break-all;flex:1;">标题: <em style="font-style:normal;font-weight:normal;">https://example.com</em></p>
  </span>
</section>
```

### 全局容器（带网格纸纹背景）
```html
<section style="margin:0;padding:0 10px;background-image:linear-gradient(90deg,rgba(50,0,0,0.05) 0%,rgba(0,0,0,0) 6.76%),linear-gradient(360deg,rgba(50,0,0,0.05) 0%,rgba(249,247,252,0) 9.46%);background-size:20px 20px;font-family:Optima,'Microsoft YaHei',PingFangSC-regular,serif;font-size:16px;color:#000;line-height:1.5em;word-break:break-word;">
  <!-- 内容 -->
</section>
```

## 注意事项

1. **所有文字必须用 `<span leaf="">文字</span>` 包裹**（微信公众号兼容要求）
2. **不能用** `<style>`, `<script>`, `<div>`, `class`, `id`, `position:fixed/absolute`
3. **样式全部内联** `style="..."`
4. **可用标签**：`<section>`, `<p>`, `<span>`, `<strong>`, `<img>`, `<h3>`, `<sup>`, `<code>`, `<ul>`, `<li>`
5. 如果只改颜色，继承BaseTheme后只需设置 `meta` 和 `colors` 即可
6. 如果要完全自定义组件样式（如网格背景、紫色左竖条标题），需要 override 对应方法

## 验证命令
```bash
cd /home/administrator/workspace/open-source/msgflow/worker-v2
npx tsc --noEmit          # 类型检查
npx vitest run            # 运行测试
npx wrangler deploy --env production  # 部署
```

## 部署后测试
```bash
curl -s -X POST https://api.ouraihub.com/api/format \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# 测试\n\n## 第一章\n\n测试内容","theme":"mdnice-purple"}' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['html'][:300])"
```
