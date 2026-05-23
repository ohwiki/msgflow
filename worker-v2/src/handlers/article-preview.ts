/**
 * Handler: GET /article/:id/preview — render article markdown as HTML page.
 */

import { marked } from "marked";
import { Res } from "../lib/response.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";
import type { Logger } from "../lib/log.js";

export async function pageArticlePreview(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split("/")[2] ?? "";

  const repo = new ArticleRepository(env.DB);
  const article = await repo.getById(id);
  if (!article) return Res.notFound();

  let htmlContent = "<p>文章尚未清洗，暂无 Markdown 内容。</p>";
  if (article.r2_md_key) {
    const fileRepo = new FileRepository(env.R2);
    const md = await fileRepo.get(article.r2_md_key);
    if (md) htmlContent = await marked(md);
  }

  const html = `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${article.title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tailwindcss/typography@0.5.16/src/styles/base.min.css"/>
  <style>
    body { max-width: 48rem; margin: 2rem auto; padding: 0 1rem; font-family: system-ui, sans-serif; line-height: 1.8; }
    .meta { color: #666; font-size: 0.875rem; margin-bottom: 2rem; }
    a.back { display: inline-block; margin-bottom: 1rem; color: #006cac; }
    pre { background: #f6f8fa; border: 1px solid #e1e4e8; border-radius: 6px; padding: 1rem; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word; }
    code { font-family: ui-monospace, monospace; font-size: 0.875rem; }
    p code { background: #f0f0f0; padding: 0.15em 0.4em; border-radius: 3px; }
    img { max-width: 100%; border-radius: 6px; margin: 1rem 0; }
    blockquote { border-left: 3px solid #ddd; padding-left: 1rem; color: #555; }
  </style>
</head>
<body>
  <a class="back" href="/">← 返回列表</a>
  <article class="prose">
    <h1>${article.title}</h1>
    <div class="meta">${article.author || ""} · ${article.source_type} · ${article.fetched_at?.slice(0, 10) || ""}</div>
    ${htmlContent}
  </article>
</body>
</html>`;

  return Res.html(html);
}
