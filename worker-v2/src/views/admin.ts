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

/** Shared template variables (CDN URLs etc.) */
const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

export async function pageHome(request: Request, env: Env, _log: Logger): Promise<Response> {
  const repo = new ArticleRepository(env.DB);
  const [articles, total, cleanedCount, publishedCount] = await Promise.all([
    repo.list({ limit: 50 }),
    repo.count(),
    repo.count({ status: ARTICLE_STATUS.CLEANED }),
    repo.count({ status: ARTICLE_STATUS.PUBLISHED }),
  ]);

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
  };

  const content = Mustache.render(articleTableTpl, data);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "文章列表", content });
  return Res.html(html);
}

export async function pageFetch(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  const content = Mustache.render(fetchFormTpl, {});
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "抓取文章", content });
  return Res.html(html);
}
