/**
 * RSS 聚合 API + 页面。
 *
 * GET    /rss                       — 阅读器页面
 * GET    /api/rss/feeds             — 源列表（按分类分组 + 未读数）
 * POST   /api/rss/feeds             — 新增源 { xmlUrl }
 * DELETE /api/rss/feeds/:id         — 删除源（级联删文章）
 * POST   /api/rss/import            — OPML 导入 { opml }
 * POST   /api/rss/refresh           — 手动触发抓取
 * GET    /api/rss/articles?feed=&unread=&page=  — 文章列表
 * GET    /api/rss/articles/:id      — 单篇正文
 * POST   /api/rss/articles/:id/read — 标记已读
 * POST   /api/rss/ai                — AskCat 斜杠命令
 */

import { Res } from "../lib/response.js";
import type { Logger } from "../lib/log.js";
import { RssRepository } from "../repositories/rss-repository.js";
import { fetchFeed, refreshDueFeeds, parseOpml, ensureArticleContent } from "../services/rss-service.js";
import { runRssAi } from "../services/rss-ai-service.js";
import type { FeedCategoryGroup } from "../types/rss.js";
import { rssReaderPage } from "../views/rss-reader.js";

/** GET /rss — 阅读器页面。 */
export async function pageRss(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  return Res.html(rssReaderPage());
}

/** GET /api/rss/feeds — 分类分组 + 未读数。 */
export async function apiRssFeeds(request: Request, env: Env, log: Logger): Promise<Response> {
  const repo = new RssRepository(env.DB);

  if (request.method === "POST") {
    const body = await request.json<{ xmlUrl?: string; category?: string }>();
    const xmlUrl = body.xmlUrl?.trim();
    if (!xmlUrl || !/^https?:\/\//.test(xmlUrl)) {
      return Res.json({ error: "invalid xmlUrl" }, 400);
    }
    const { id } = await repo.addFeed({ xmlUrl, category: body.category?.trim() || "未分类" });
    log.info("rss_feed_add", { id: String(id), url: xmlUrl });
    // 立即抓一次，失败不阻断（error 已记录到 feed）
    const feed = await repo.getFeed(id);
    if (feed) {
      try {
        await fetchFeed(feed, repo);
      } catch {
        /* error recorded on feed */
      }
    }
    return Res.json({ success: true, id });
  }

  log.info("rss_feeds_list");
  const feeds = await repo.listFeedsWithUnread();
  const groupMap = new Map<string, FeedCategoryGroup>();
  for (const f of feeds) {
    let g = groupMap.get(f.category);
    if (!g) {
      g = { category: f.category, feeds: [] };
      groupMap.set(f.category, g);
    }
    g.feeds.push(f);
  }
  return Res.json({ categories: [...groupMap.values()] });
}

/** DELETE /api/rss/feeds/:id */
export async function apiRssFeedDelete(request: Request, env: Env, log: Logger): Promise<Response> {
  const id = Number(new URL(request.url).pathname.split("/").pop());
  if (!id || Number.isNaN(id)) return Res.json({ error: "invalid id" }, 400);
  await new RssRepository(env.DB).deleteFeed(id);
  log.info("rss_feed_delete", { id: String(id) });
  return Res.json({ success: true });
}

/** POST /api/rss/import — OPML 导入。 */
export async function apiRssImport(request: Request, env: Env, log: Logger): Promise<Response> {
  const body = await request.json<{ opml?: string }>();
  if (!body.opml?.trim()) return Res.json({ error: "opml is required" }, 400);
  const repo = new RssRepository(env.DB);
  const parsed = parseOpml(body.opml);
  let added = 0;
  for (const f of parsed) {
    const { inserted } = await repo.addFeed({ xmlUrl: f.xmlUrl, title: f.title, category: f.category });
    if (inserted) added += 1;
  }
  log.info("rss_import", { count: String(added) });
  return Res.json({ success: true, imported: added });
}

/** POST /api/rss/refresh — 手动抓取一轮。 */
export async function apiRssRefresh(request: Request, env: Env, log: Logger): Promise<Response> {
  const limit = Number(new URL(request.url).searchParams.get("limit")) || 40;
  const result = await refreshDueFeeds(env, log, limit);
  return Res.json({ success: true, ...result });
}

/** GET /api/rss/articles?feed=&unread=&page= */
export async function apiRssArticles(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const feedId = url.searchParams.get("feed") ? Number(url.searchParams.get("feed")) : undefined;
  const unreadOnly = url.searchParams.get("unread") === "1";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = 30;
  const repo = new RssRepository(env.DB);
  const articles = await repo.listArticles({ feedId, unreadOnly, limit, offset: (page - 1) * limit });
  log.info("rss_articles_list", { feed: String(feedId ?? ""), page: String(page) });
  return Res.json({
    items: articles.map((a) => ({
      id: a.id,
      feedId: a.feed_id,
      title: a.title,
      link: a.link,
      author: a.author,
      snippet: a.snippet,
      enclosure: a.enclosure,
      pubDate: a.pub_date,
      isRead: a.is_read === 1,
    })),
    page,
  });
}

/** GET /api/rss/articles/:id — 正文（RSS 无全文时回源抓取并缓存）。 */
export async function apiRssArticleGet(request: Request, env: Env, log: Logger): Promise<Response> {
  const id = Number(new URL(request.url).pathname.split("/").pop());
  if (!id || Number.isNaN(id)) return Res.json({ error: "invalid id" }, 400);
  const repo = new RssRepository(env.DB);
  const found = await repo.getArticle(id);
  if (!found) return Res.json({ error: "not found" }, 404);
  const article = await ensureArticleContent(found, repo, env, log);
  return Res.json({
    id: article.id,
    feedId: article.feed_id,
    title: article.title,
    link: article.link,
    author: article.author,
    content: article.content,
    enclosure: article.enclosure,
    pubDate: article.pub_date,
    isRead: article.is_read === 1,
  });
}

/** POST /api/rss/articles/:id/read */
export async function apiRssArticleRead(request: Request, env: Env, _log: Logger): Promise<Response> {
  // path: /api/rss/articles/:id/read
  const parts = new URL(request.url).pathname.split("/");
  const id = Number(parts[parts.length - 2]);
  if (!id || Number.isNaN(id)) return Res.json({ error: "invalid id" }, 400);
  await new RssRepository(env.DB).markRead(id);
  return Res.json({ success: true });
}

/** POST /api/rss/ai — AskCat 斜杠命令。 */
export async function apiRssAi(request: Request, env: Env, log: Logger): Promise<Response> {
  const body = await request.json<{ command?: string; articleId?: number; feedId?: number; question?: string }>();
  if (!body.command) return Res.json({ error: "command is required" }, 400);
  const result = await runRssAi(env, log, body);
  if (result.error) return Res.json({ error: result.error }, result.status ?? 400);
  return Res.json({ reply: result.reply });
}
