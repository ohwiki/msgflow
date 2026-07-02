# 图片 CDN 配置指南

## 概述

msgflow 展示站使用 Cloudflare R2 存储文章图片，通过自定义域名 + CDN 加速访问。支持两种模式切换。

## 架构

```
文章 Markdown (cover: "path/to/image.jpg")
  → CdnImage 组件
    → 模式 A: 直连 R2（默认，免费）
    → 模式 B: Worker 裁剪（需部署 Worker）
```

## 模式 A：直连 R2（免费）

图片原样输出，靠 Cloudflare CDN 全球缓存加速。

### 配置步骤

1. 创建 R2 Bucket：
```bash
npx wrangler r2 bucket create msgflow-images
```

2. 绑定自定义域名（R2 Settings → Custom Domains）：
```
r2.yourdomain.com → msgflow-images
```

3. 设置环境变量：
```
PUBLIC_IMAGE_CDN=https://r2.yourdomain.com
```

### 上传图片

```bash
npx wrangler r2 object put msgflow-images/articles/my-post/cover.jpg --file=./cover.jpg
```

### 在文章中使用

```yaml
---
title: "文章标题"
cover: "articles/my-post/cover.jpg"
---
```

CdnImage 组件自动拼接为 `https://r2.yourdomain.com/articles/my-post/cover.jpg`。

---

## 模式 B：Worker 裁剪（免费，需部署 Worker）

通过 Worker 自动裁剪、压缩、转 WebP。适合图片量大或需要多尺寸的场景。

### 额外配置

1. 部署图片处理 Worker（监听 `/resize/` 路径）
2. 设置环境变量：
```
PUBLIC_IMAGE_CDN=https://r2.yourdomain.com
PUBLIC_IMAGE_RESIZE=true
```

### Worker 处理逻辑

Worker 接收请求格式：
```
/resize/w=160,h=96,fit=cover,f=auto,q=80/articles/my-post/cover.jpg
```

Worker 从 R2 读取原图，用 `cf.image` 参数裁剪后返回。

### Worker 示例代码

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/resize\/([^/]+)\/(.+)$/);
    if (!match) return fetch(request);

    const [, params, path] = match;
    const obj = await env.R2_BUCKET.get(path);
    if (!obj) return new Response('Not found', { status: 404 });

    // 解析参数
    const opts: Record<string, string> = {};
    params.split(',').forEach(p => {
      const [k, v] = p.split('=');
      opts[k] = v;
    });

    // 返回图片（配合 Cloudflare 缓存）
    return new Response(obj.body, {
      headers: {
        'Content-Type': obj.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  },
};
```

> 注意：真正的图片裁剪需要 Cloudflare Image Resizing（Pro 计划）或在 Worker 中用 sharp/wasm 处理。免费方案下 Worker 主要做格式检测 + 缓存头优化。

---

## 环境变量汇总

| 变量 | 必填 | 说明 |
|------|------|------|
| `PUBLIC_IMAGE_CDN` | 是 | R2 自定义域名，如 `https://r2.yourdomain.com` |
| `PUBLIC_IMAGE_RESIZE` | 否 | 设为 `true` 启用 Worker 裁剪模式 |

## 费用

| 项目 | 免费额度 |
|------|---------|
| R2 存储 | 10 GB/月 |
| R2 读取 | 1000 万次/月 |
| Workers 请求 | 10 万次/天 |
| CDN 流量 | 无限 |
