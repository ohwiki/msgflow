/**
 * Article Repository — D1 data access for articles table.
 */

import type { Article } from "../types/index.js";
import type { IArticleRepository, ListOptions } from "../types/repository.js";

export class ArticleRepository implements IArticleRepository {
  constructor(private db: D1Database) {}

  async create(article: Omit<Article, "created_at" | "updated_at">): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO articles (id, url, title, author, source_type, source_name, status, tags, summary, r2_raw_key, r2_md_key, fetched_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        article.id,
        article.url,
        article.title,
        article.author,
        article.source_type,
        article.source_name,
        article.status,
        article.tags,
        article.summary,
        article.r2_raw_key,
        article.r2_md_key,
        article.fetched_at,
        article.published_at,
      )
      .run();
  }

  async getById(id: string): Promise<Article | null> {
    const row = await this.db.prepare("SELECT * FROM articles WHERE id = ?").bind(id).first<Article>();
    return row ?? null;
  }

  async getByUrl(url: string): Promise<Article | null> {
    const row = await this.db.prepare("SELECT * FROM articles WHERE url = ?").bind(url).first<Article>();
    return row ?? null;
  }

  async list(opts: ListOptions = {}): Promise<Article[]> {
    const { status, source, tag, limit = 20, offset = 0 } = opts;
    let sql = "SELECT * FROM articles WHERE 1=1";
    const params: unknown[] = [];

    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (source) {
      sql += " AND source_type = ?";
      params.push(source);
    }
    if (tag) {
      sql += " AND tags LIKE ?";
      params.push(`%"${tag}"%`);
    }

    sql += " ORDER BY fetched_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await this.db.prepare(sql).bind(...params).all<Article>();
    return results ?? [];
  }

  async getAllTags(): Promise<string[]> {
    const { results } = await this.db
      .prepare("SELECT DISTINCT tags FROM articles WHERE tags != '[]' AND tags IS NOT NULL")
      .all<{ tags: string }>();
    const tagSet = new Set<string>();
    for (const row of results ?? []) {
      try {
        const arr = JSON.parse(row.tags) as string[];
        arr.forEach((t) => tagSet.add(t));
      } catch {
        console.warn(JSON.stringify({ level: "warn", event: "article_tags_parse_failed", tags: row.tags, ts: new Date().toISOString() }));
      }
    }
    return [...tagSet].sort();
  }

  async count(opts: { status?: string } = {}): Promise<number> {
    let sql = "SELECT COUNT(*) as cnt FROM articles WHERE 1=1";
    const params: unknown[] = [];
    if (opts.status) {
      sql += " AND status = ?";
      params.push(opts.status);
    }
    const row = await this.db.prepare(sql).bind(...params).first<{ cnt: number }>();
    return row?.cnt ?? 0;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.db
      .prepare("UPDATE articles SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(status, id)
      .run();
  }

  async updateMarkdown(id: string, r2MdKey: string): Promise<void> {
    await this.db
      .prepare("UPDATE articles SET r2_md_key = ?, status = 'cleaned', updated_at = datetime('now') WHERE id = ?")
      .bind(r2MdKey, id)
      .run();
  }

  async delete(id: string): Promise<void> {
    await this.db.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
  }

  async updateTags(id: string, tags: string): Promise<void> {
    await this.db
      .prepare("UPDATE articles SET tags = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(tags, id)
      .run();
  }

  async updateTitle(id: string, title: string): Promise<void> {
    await this.db
      .prepare("UPDATE articles SET title = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(title, id)
      .run();
  }
}
