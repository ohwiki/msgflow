/**
 * Repository interfaces — data access contracts.
 */

import type { Article } from "./index.js";

export interface ListOptions {
  status?: string;
  source?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export interface IArticleRepository {
  create(article: Omit<Article, "created_at" | "updated_at">): Promise<void>;
  getById(id: string): Promise<Article | null>;
  getByUrl(url: string): Promise<Article | null>;
  list(opts?: ListOptions): Promise<Article[]>;
  count(opts?: { status?: string }): Promise<number>;
  getAllTags(): Promise<string[]>;
  updateStatus(id: string, status: string): Promise<void>;
  updateMarkdown(id: string, r2MdKey: string): Promise<void>;
  updateTags(id: string, tags: string): Promise<void>;
  updateTitle(id: string, title: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IFileRepository {
  putRaw(articleId: string, html: string): Promise<string>;
  putMarkdown(articleId: string, markdown: string): Promise<string>;
  putImage(imageId: string, data: ArrayBuffer, contentType: string): Promise<string>;
  get(key: string): Promise<string | null>;
  getImage(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
