/**
 * RSS Repository — D1 数据访问（rss_feeds + rss_articles）。
 */

import type { RssFeed, RssArticle, NormalizedItem, FeedWithUnread } from "../types/rss.js";

export class RssRepository {
  constructor(private db: D1Database) {}

  // ─── Feeds ───────────────────────────────────────────────────────────────

  /** 新增一个源（幂等：xml_url 冲突则忽略）。返回 feed id（新建或已存在）。 */
  async addFeed(feed: {
    xmlUrl: string;
    title?: string;
    siteUrl?: string;
    category?: string;
    intro?: string;
  }): Promise<{ id: number; inserted: boolean }> {
    const now = Date.now();
    const res = await this.db
      .prepare(
        `INSERT INTO rss_feeds (xml_url, title, site_url, category, intro, created_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(xml_url) DO NOTHING`,
      )
      .bind(feed.xmlUrl, feed.title ?? null, feed.siteUrl ?? null, feed.category ?? null, feed.intro ?? null, now)
      .run();
    const row = await this.db
      .prepare(`SELECT id FROM rss_feeds WHERE xml_url = ?`)
      .bind(feed.xmlUrl)
      .first<{ id: number }>();
    return { id: row?.id ?? 0, inserted: (res.meta.changes ?? 0) > 0 };
  }

  async getFeed(id: number): Promise<RssFeed | null> {
    const row = await this.db.prepare(`SELECT * FROM rss_feeds WHERE id = ?`).bind(id).first<RssFeed>();
    return row ?? null;
  }

  async deleteFeed(id: number): Promise<void> {
    await this.db.prepare(`DELETE FROM rss_articles WHERE feed_id = ?`).bind(id).run();
    await this.db.prepare(`DELETE FROM rss_feeds WHERE id = ?`).bind(id).run();
  }

  /** 全部源 + 各自未读数，按 category 分组用。 */
  async listFeedsWithUnread(): Promise<FeedWithUnread[]> {
    const { results } = await this.db
      .prepare(
        `SELECT f.id, f.xml_url, f.title, f.category, f.intro, f.article_count, f.error,
                (SELECT COUNT(*) FROM rss_articles a WHERE a.feed_id = f.id AND a.is_read = 0) AS unread
         FROM rss_feeds f
         ORDER BY f.category, f.id`,
      )
      .all<{
        id: number;
        xml_url: string;
        title: string | null;
        category: string | null;
        intro: string | null;
        article_count: number;
        error: string | null;
        unread: number;
      }>();
    return (results ?? []).map((r) => ({
      id: r.id,
      xmlUrl: r.xml_url,
      title: r.title ?? r.xml_url,
      category: r.category ?? "未分类",
      intro: r.intro ?? "",
      unread: r.unread,
      articleCount: r.article_count,
      error: r.error,
    }));
  }

  /** 抓取轮转：返回最久未抓的 N 个源。 */
  async getDueFeeds(limit: number): Promise<RssFeed[]> {
    const { results } = await this.db
      .prepare(`SELECT * FROM rss_feeds ORDER BY last_fetch ASC NULLS FIRST LIMIT ?`)
      .bind(limit)
      .all<RssFeed>();
    return results ?? [];
  }

  /** 更新源的抓取结果元数据。 */
  async updateFeedMeta(
    id: number,
    meta: { lastFetch: number; lastSuccess?: number | null; error?: string | null; articleCount?: number; title?: string },
  ): Promise<void> {
    const sets: string[] = ["last_fetch = ?"];
    const params: unknown[] = [meta.lastFetch];
    if (meta.lastSuccess !== undefined) {
      sets.push("last_success = ?");
      params.push(meta.lastSuccess);
    }
    if (meta.error !== undefined) {
      sets.push("error = ?");
      params.push(meta.error);
    }
    if (meta.articleCount !== undefined) {
      sets.push("article_count = ?");
      params.push(meta.articleCount);
    }
    if (meta.title) {
      sets.push("title = COALESCE(NULLIF(title, ''), ?)");
      params.push(meta.title);
    }
    params.push(id);
    await this.db.prepare(`UPDATE rss_feeds SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
  }

  async countArticles(feedId: number): Promise<number> {
    const row = await this.db
      .prepare(`SELECT COUNT(*) AS c FROM rss_articles WHERE feed_id = ?`)
      .bind(feedId)
      .first<{ c: number }>();
    return row?.c ?? 0;
  }

  // ─── Articles ──────────────────────────────────────────────────────────────

  /** 批量 upsert 归一化条目，按 (feed_id, guid) 去重。返回新增条数。 */
  async upsertArticles(feedId: number, items: NormalizedItem[]): Promise<number> {
    if (items.length === 0) return 0;
    const now = Date.now();
    let inserted = 0;
    const stmt = this.db.prepare(
      `INSERT INTO rss_articles (feed_id, guid, title, link, author, content, snippet, enclosure, pub_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(feed_id, guid) DO NOTHING`,
    );
    const batch = items.map((it) =>
      stmt.bind(feedId, it.guid, it.title, it.link, it.author, it.content, it.snippet, it.enclosure, it.pubDate, now),
    );
    const res = await this.db.batch(batch);
    for (const r of res) inserted += r.meta?.changes ?? 0;
    return inserted;
  }

  /** 文章列表：可按 feed 过滤、只看未读、分页。 */
  async listArticles(opts: { feedId?: number; unreadOnly?: boolean; limit?: number; offset?: number }): Promise<RssArticle[]> {
    const { feedId, unreadOnly, limit = 30, offset = 0 } = opts;
    let sql = "SELECT id, feed_id, guid, title, link, author, snippet, enclosure, pub_date, is_read, created_at FROM rss_articles WHERE 1=1";
    const params: unknown[] = [];
    if (feedId !== undefined) {
      sql += " AND feed_id = ?";
      params.push(feedId);
    }
    if (unreadOnly) {
      sql += " AND is_read = 0";
    }
    sql += " ORDER BY pub_date DESC NULLS LAST, id DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const { results } = await this.db.prepare(sql).bind(...params).all<RssArticle>();
    return results ?? [];
  }

  async getArticle(id: number): Promise<RssArticle | null> {
    const row = await this.db.prepare(`SELECT * FROM rss_articles WHERE id = ?`).bind(id).first<RssArticle>();
    return row ?? null;
  }

  async markRead(id: number): Promise<void> {
    await this.db.prepare(`UPDATE rss_articles SET is_read = 1 WHERE id = ?`).bind(id).run();
  }

  /** 缓存抓取到的全文正文（供 AI/阅读复用，避免重复抓取）。 */
  async updateArticleContent(id: number, content: string, snippet: string): Promise<void> {
    await this.db
      .prepare(`UPDATE rss_articles SET content = ?, snippet = ? WHERE id = ?`)
      .bind(content, snippet, id)
      .run();
  }

  /** 某源近期文章标题列表（供 AI /digest /recommend 用）。 */
  async recentTitles(feedId: number, limit = 20): Promise<{ title: string; snippet: string }[]> {
    const { results } = await this.db
      .prepare(`SELECT title, snippet FROM rss_articles WHERE feed_id = ? ORDER BY pub_date DESC NULLS LAST, id DESC LIMIT ?`)
      .bind(feedId, limit)
      .all<{ title: string; snippet: string }>();
    return results ?? [];
  }
}
