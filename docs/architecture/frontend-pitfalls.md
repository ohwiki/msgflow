# 前端排查陷阱记录

> 本文档记录本项目实际踩过的前端坑，以及排查时用错的方法。
> 目的：让后续开发（含 AI 协作）不要重复同一条弯路。
> 每条包含「现象 → 错误判断 → 真实原因 → 判据」，其中**判据**是最值得复用的部分。

## 1. CDN 版 Tailwind 不为 daisyUI 组件类生成响应式变体

**现象**：`admin.ouraihub.com` 全站左侧菜单不可见。侧栏被定位在 `translate: -100%`，
`aside` 的 x 坐标为 `-256`，整个菜单在视口之外。

**错误判断（走过的弯路）**：

1. 先怀疑 Mustache 把 CDN URL 里的 `/` 转义成了 `&#x2F;` 导致样式加载失败。
   → 错。HTML 实体在属性值中会被浏览器正常解码，链接可用。
2. 再怀疑 daisyUI 的 `@layer` 没声明层顺序，被无层样式压过。
   → 方向对但未验证充分，当时无法据此定论。
3. 又怀疑是 daisyUI 5.7.9 版本回归，做了版本二分，得到「5.7.6 FAIL / 5.7.9 PASS」。
   → 错。同一版本两次结果不一致，说明**测试方法本身不可靠**，
   而非被测对象有问题。原因是用 `setContent()` 构造测试页，
   打断了 `@tailwindcss/browser` 的运行时处理时机，结论无效。

**真实原因**：`lg:drawer-open` 是 Tailwind 的响应式变体，需由 Tailwind 生成。
项目用的是 `@tailwindcss/browser`（运行时版），它只扫描标记中的 utility 类，
**不会为 daisyUI 的组件类生成变体**。daisyUI 自带的 `.lg\:drawer-open` 规则包在
`@layer` 内，优先级低于无层的运行时样式，因此不生效。

**判据**：不要绕着外围猜，直接在真实页面上替换类名做对照：

```js
// 在真实页面（非构造页）上执行
const d = document.querySelector('.drawer');
d.classList.remove('lg:drawer-open');
d.classList.add('drawer-open');       // 去掉 lg: 前缀
// 若立即恢复正常 → 组件本身没问题，坏的是响应式变体
```

同时确认 daisyUI 自身是否正常（排除「整个库没加载」这种更粗的原因）：

```js
const b = document.createElement('button');
b.className = 'btn btn-primary';
document.body.appendChild(b);
getComputedStyle(b).backgroundColor;  // 有主题色 → daisyUI 正常
```

**现行修复**：在 `worker/src/templates/layout.mustache` 内联等价规则，
只在 `min-width: 1024px` 生效，不依赖 Tailwind 生成变体。

**根治方案（尚未采用）**：改用官方 `@plugin "daisyui"` 引入方式，
让 daisyUI 走 Tailwind 插件管线，所有变体都能正常生成。
代价是改动 CDN 引入结构、影响全站样式。
若以后再遇到别的 `lg:` / `md:` 前缀配 daisyUI 组件类失效，就该做这个迁移。

## 2. `position: sticky` 让元素有几何盒但不被绘制

**现象**：修完第 1 条后，侧栏位置正确了（占住 256px），但**左侧一片空白** ——
空间占住了，内容画不出来。

**错误判断**：先怀疑有东西遮挡（`drawer-overlay` 之类）。
→ 错。命中栈里 overlay 是 `display: none`、尺寸为 0，没有参与遮挡。

**真实原因**：上一版修复里写了 `position: sticky`。它让 `drawer-side`
脱离正常绘制流程 —— 元素有正确的几何盒，但**不参与绘制与命中测试**。
daisyUI 原生用的是 `position: static`。

**判据**：`boundingBox().x === 0` **不足以证明元素可见**。
位置对 ≠ 被画出来。要用命中测试：

```js
const a = document.querySelector('.drawer-side aside ul.menu li a');
const r = a.getBoundingClientRect();
const stack = document.elementsFromPoint(
  Math.round(r.x + r.width / 2),
  Math.round(r.y + r.height / 2),
);
// 期望命中栈完整：a → li → ul.menu → aside → drawer-side → drawer
// 若栈里只有 .drawer / body / html，说明中间这些元素根本没被绘制
```

坏的时候命中栈只有 `.drawer`、`body`、`html` 三层，`aside` 与链接均不在其中 ——
这个信号非常明确，比肉眼看截图可靠。

## 通用教训

1. **构造测试页会失真**。涉及运行时 CSS 生成（`@tailwindcss/browser`）时，
   `setContent()` / `file://` 与真实 http 页面的加载时序不同，结论不可迁移。
   要在**真实页面**上做对照实验。
2. **同一输入两次结果不同 → 先怀疑测试方法，而不是被测对象**。
   版本二分里出现「5.7.6 FAIL / 5.7.9 PASS」时就该停下来质疑测法。
3. **验证判据要匹配"用户看得见"这个目标**。几何位置、类名存在、CSS 请求 200
   都只是必要条件。可见性用命中测试，可用性用真实点击（点菜单项确认跳转）。
4. **响应式修复必须跨断点验证**。本项目断点是 1024px，
   需覆盖 1400 / 1024 / 900 / 390，并确认小屏汉堡按钮出现且点击可展开 ——
   否则容易「修好桌面端、弄坏移动端」。
5. **改共享 layout 要跨页面验证**。所有页面共用 `layout.mustache`，
   一处改动影响全站，至少抽查 `/`、`/quota`、`/settings`、`/fetch`。
