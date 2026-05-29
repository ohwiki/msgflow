# Hugo Theme Paper → Astro 迁移方案

## 概述

将 `hugo-theme-paper` 的全部功能迁移到 Astro，作为 msgflow 的公开展示站。

## 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Astro 5.x |
| 样式 | Tailwind CSS 4 + daisyUI 5 |
| 组件库 | `@ouraihub/core`（逻辑）+ `@ouraihub/astro`（UI 包装） |
| 设计令牌 | `@ouraihub/tokens`（CSS 变量） |
| 内容 | Astro Content Collections（Markdown） |
| 代码高亮 | Shiki（Astro 内置） |
| 交互 | Islands（按需加载） |
| 部署 | Cloudflare Pages（主）+ GitHub Pages（备） |

## 与 @ouraihub/ui-library 的关系

Hugo 主题已经在用 ui-library 的 Hugo 包（`@ouraihub/hugo`）。迁移到 Astro 时：

- **不需要重写核心逻辑** — `@ouraihub/core` 的 ThemeManager、SearchModal、LazyLoader 等直接复用
- **不需要重新定义设计令牌** — `@ouraihub/tokens` 的 CSS 变量直接引入
- **只需要写 Astro 薄包装** — 用 `@ouraihub/astro` 包的组件，或基于 core 写新的 .astro 包装

```
hugo-theme-paper 用的:
  @ouraihub/core + @ouraihub/hugo + @ouraihub/tokens

Astro 展示站用的:
  @ouraihub/core + @ouraihub/astro + @ouraihub/tokens
                   ↑ 同一套核心逻辑，不同的 UI 层
```

这意味着迁移工作量大幅减少——核心功能（主题切换、搜索、懒加载、SEO）已经在 core 里实现了，Astro 端只需要写 `.astro` 组件调用 core 的类。

## 文件映射

### 页面

| Hugo (layouts/) | Astro (src/pages/) |
|-----------------|-------------------|
| `index.html` | `src/pages/index.astro` |
| `post/single.html` | `src/pages/articles/[slug].astro` |
| `_default/list.html` | `src/pages/articles/index.astro` |
| `archives/list.html` | `src/pages/archives.astro` |
| `tag/term.html` | `src/pages/tags/[tag].astro` |
| `categories/list.html` | `src/pages/categories/[category].astro` |
| `search/list.html` | `src/pages/search.astro` |
| `404.html` | `src/pages/404.astro` |
| `rss.xml` | `src/pages/feed.xml.ts` |
| `sitemap.xml` | 自动（@astrojs/sitemap） |
| `robots.txt` | `src/pages/robots.txt.ts` |

### 组件（partials → components）

| Hugo (layouts/partials/) | Astro (src/components/) |
|--------------------------|------------------------|
| `header.html` | `Header.astro` |
| `footer.html` | `Footer.astro` |
| `post-card.html` | `PostCard.astro` |
| `post-list-item.html` | `PostListItem.astro` |
| `pagination.html` | `Pagination.astro` |
| `tag.html` | `Tag.astro` |
| `breadcrumb.html` | `Breadcrumb.astro` |
| `theme-toggle.html` | `ThemeToggle.astro`（Island） |
| `code-copy.html` | `CodeCopy.astro`（Island） |
| `back-to-top.html` | `BackToTop.astro`（Island） |
| `reading-progress.html` | `ReadingProgress.astro`（Island） |
| `share-links.html` | `ShareLinks.astro` |
| `giscus.html` | `Giscus.astro`（Island） |
| `seo-meta.html` | `SEO.astro` |
| `schema.html` | 集成到 `SEO.astro` |
| `socials.html` | `Socials.astro` |
| `keyboard-shortcuts.html` | `KeyboardShortcuts.astro`（Island） |
| `language-switcher.html` | `LanguageSwitcher.astro` |

### 布局

| Hugo | Astro (src/layouts/) |
|------|---------------------|
| `_default/baseof.html` | `BaseLayout.astro` |
| `post/single.html` | `PostLayout.astro` |
| `page/single.html` | `PageLayout.astro` |

### 样式

| Hugo (assets/css/) | Astro (src/styles/) |
|-------------------|---------------------|
| `main.css` | `global.css`（Tailwind 入口） |
| `typography.css` | `prose.css`（文章排版） |
| `code-blocks.css` | 不需要（Shiki 内置处理） |
| `chroma-*.css` | 不需要（Shiki 替代 Chroma） |

### 脚本

| Hugo (assets/ts/) | Astro |
|-------------------|-------|
| `main.ts` | 拆分到各 Island 组件 |
| `toggle-theme.ts` | `ThemeToggle.astro` 内 `<script>` |
| `code-enhance.ts` | `CodeCopy.astro` 内 `<script>` |

### 内容

| Hugo (content/) | Astro (src/content/) |
|-----------------|---------------------|
| `content/zh/post/*.md` | `src/content/articles/*.md` |
| `content/en/post/*.md` | `src/content/articles-en/*.md`（或 i18n 方案） |

## Content Collection Schema

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string().default(''),
    date: z.date(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    summary: z.string().default(''),
    draft: z.boolean().default(false),
    source_type: z.string().optional(),
    source_url: z.string().optional(),
  }),
});

export const collections = { articles };
```

## 功能迁移清单

| 功能 | Hugo 实现 | Astro 实现 | 复杂度 |
|------|-----------|-----------|--------|
| 文章列表 + 分页 | Go 模板 | `getCollection()` + 手动分页 | 低 |
| 文章详情 | Go 模板 | `[slug].astro` 动态路由 | 低 |
| 标签/分类 | taxonomy | `getCollection()` + filter | 低 |
| 归档（按年月） | Go 模板 | JS 分组 | 低 |
| 搜索 | JSON index + JS | Pagefind（Astro 集成） | 中 |
| 暗色主题 | JS + CSS 变量 | daisyUI data-theme + Island | 低 |
| 代码高亮 | Chroma/Shiki 预构建 | Astro 内置 Shiki | 低（更简单） |
| 代码复制按钮 | JS partial | Island 组件 | 低 |
| RSS | Go 模板 | `feed.xml.ts` endpoint | 低 |
| SEO (OG/Schema) | Go 模板 | `SEO.astro` 组件 | 中 |
| 动态 OG Image | Hugo + 脚本 | `@vercel/og` 或 Satori | 中 |
| i18n | Hugo 内置 | `@astrojs/i18n` 或手动 | 中 |
| 评论 (Giscus) | iframe partial | Island 组件 | 低 |
| 阅读进度条 | JS | Island 组件 | 低 |
| 键盘快捷键 | JS | Island 组件 | 低 |

## 目录结构

```
site/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── src/
│   ├── content/
│   │   ├── config.ts
│   │   └── articles/          ← Markdown 文章（从 Git 仓库同步）
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── PostLayout.astro
│   │   └── PageLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── articles/
│   │   │   ├── index.astro
│   │   │   └── [slug].astro
│   │   ├── tags/[tag].astro
│   │   ├── categories/[category].astro
│   │   ├── archives.astro
│   │   ├── search.astro
│   │   ├── 404.astro
│   │   ├── feed.xml.ts
│   │   └── robots.txt.ts
│   ├── components/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   ├── PostListItem.astro
│   │   ├── Pagination.astro
│   │   ├── Tag.astro
│   │   ├── Breadcrumb.astro
│   │   ├── ShareLinks.astro
│   │   ├── Socials.astro
│   │   ├── SEO.astro
│   │   └── islands/
│   │       ├── ThemeToggle.astro
│   │       ├── CodeCopy.astro
│   │       ├── BackToTop.astro
│   │       ├── ReadingProgress.astro
│   │       ├── Giscus.astro
│   │       ├── KeyboardShortcuts.astro
│   │       └── Search.astro
│   └── styles/
│       ├── global.css
│       └── prose.css
├── public/
│   └── favicon.ico
└── .github/workflows/
    ├── deploy-cf-pages.yml
    └── deploy-gh-pages.yml
```

## 部署配置

### Cloudflare Pages

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://read.yourdomain.com',
  output: 'static',
  integrations: [tailwind(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'github-dark-dimmed' },
  },
});
```

### GitHub Pages（备站）

```yaml
# .github/workflows/deploy-gh-pages.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
    paths: ['site/**', 'src/content/**']
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        working-directory: site
      - run: npm run build
        working-directory: site
      - uses: actions/upload-pages-artifact@v3
        with: { path: site/dist }
  deploy:
    needs: build
    permissions: { pages: write, id-token: write }
    environment: { name: github-pages }
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

## 迁移步骤（建议顺序）

1. **初始化 Astro 项目** — `site/` 目录，配置 Tailwind + daisyUI
2. **BaseLayout + Header + Footer** — 骨架搭好
3. **Content Collection + 文章列表** — 核心页面
4. **文章详情页** — Markdown 渲染 + 代码高亮
5. **标签/分类/归档** — 辅助页面
6. **Islands 交互** — 主题切换、代码复制、返回顶部
7. **SEO + RSS** — 元数据 + 订阅
8. **搜索** — Pagefind 集成
9. **i18n** — 如果需要中英双语
10. **部署** — CF Pages + GitHub Pages 双部署

## 迁移验收标准

每步完成后必须验证：

1. **视觉一致** — Astro 输出的页面和 Hugo 原站视觉对比，布局、间距、字体、配色一致
2. **功能完整** — 主题切换、代码复制、搜索、分页、RSS 全部可用
3. **URL 兼容** — 文章 URL 结构和 Hugo 一致（`/articles/slug/`），旧链接不 404
4. **Lighthouse ≥ 90** — Performance、Accessibility、SEO 三项都 ≥ 90
5. **Markdown 渲染** — 随机抽 5 篇文章，对比 Hugo 和 Astro 的渲染结果，无明显差异
6. **双部署可用** — Cloudflare Pages 和 GitHub Pages 都能正常访问

## 与 msgflow Worker 的对接

Worker 清洗完文章后通过 `git-service.ts` 提交 Markdown 到 `site/src/content/articles/` 目录。Git push 自动触发 Astro 构建和部署。

```
Worker callback → git-service 提交 MD → Git push
  → Cloudflare Pages 自动构建（主站）
  → GitHub Actions 自动构建（备站）
```
