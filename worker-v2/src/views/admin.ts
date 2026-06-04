/**
 * Admin page views — render Mustache templates (HTML separated from logic).
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { ARTICLE_STATUS, CDN } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import layoutTpl from "../templates/layout.mustache";
import fetchFormTpl from "../templates/partials/fetch-form.mustache";
import articleTableTpl from "../templates/partials/article-table.mustache";
import noteFormTpl from "../templates/partials/note-form.mustache";

/** Shared template variables (CDN URLs etc.) */
const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

export async function pageHome(request: Request, env: Env, _log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const activeTag = url.searchParams.get("tag") || "";
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const repo = new ArticleRepository(env.DB);
  const [articles, total, cleanedCount, publishedCount, allTags] = await Promise.all([
    repo.list({ limit: pageSize, offset, tag: activeTag || undefined }),
    repo.count(),
    repo.count({ status: ARTICLE_STATUS.CLEANED }),
    repo.count({ status: ARTICLE_STATUS.PUBLISHED }),
    repo.getAllTags(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const data = {
    articles: articles.map((a) => ({
      ...a,
      isRaw: a.status === "raw",
      isCleaned: a.status === "cleaned",
      isPublished: a.status === "published",
      fetched_at_short: a.fetched_at?.slice(0, 10) ?? "",
    })),
    total,
    cleanedCount,
    publishedCount,
    tags: allTags.map((t) => ({ name: t, active: t === activeTag })),
    activeTag,
    hasTags: allTags.length > 0,
    page,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prevPage: page - 1,
    nextPage: page + 1,
    tagQuery: activeTag ? `&tag=${activeTag}` : "",
  };

  const content = Mustache.render(articleTableTpl, data);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "文章列表", content });
  return Res.html(html);
}

export async function pageFetch(_request: Request, env: Env, _log: Logger): Promise<Response> {
  const repo = new ArticleRepository(env.DB);
  const allTags = await repo.getAllTags();
  const content = Mustache.render(fetchFormTpl, { tags: allTags.map((t) => ({ name: t })) });
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "抓取文章", content });
  return Res.html(html);
}

export async function pageNote(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  const content = Mustache.render(noteFormTpl, {});
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "发布 note.com", content });
  return Res.html(html);
}
