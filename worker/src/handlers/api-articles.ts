/**
 * Handler: /api/articles — list, get, delete, publish.
 */

import { Res } from "../lib/response.js";
import { NotFoundError, ValidationError } from "../lib/errors.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";
import { ARTICLE_STATUS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export async function apiArticles(request: Request, env: Env, _log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const repo = new ArticleRepository(env.DB);

  const status = url.searchParams.get("status") ?? undefined;
  const source = url.searchParams.get("source") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

  const [articles, total] = await Promise.all([
    repo.list({ status, source, limit, offset }),
    repo.count({ status }),
  ]);

  return Res.json({ articles, total, limit, offset });
}

export async function apiArticleDetail(request: Request, env: Env, _log: Logger): Promise<Response> {
  const id = new URL(request.url).pathname.split("/").pop();
  if (!id) throw new ValidationError("Missing article ID");

  const repo = new ArticleRepository(env.DB);
  const article = await repo.getById(id);
  if (!article) throw new NotFoundError("Article", id);

  let content: string | null = null;
  if (article.r2_md_key) {
    const fileRepo = new FileRepository(env.R2);
    content = await fileRepo.get(article.r2_md_key);
  }

  return Res.json({ ...article, content });
}

export async function apiArticleDelete(request: Request, env: Env, log: Logger): Promise<Response> {
  const id = new URL(request.url).pathname.split("/").pop();
  if (!id) throw new ValidationError("Missing article ID");

  const repo = new ArticleRepository(env.DB);
  const article = await repo.getById(id);
  if (!article) throw new NotFoundError("Article", id);

  const fileRepo = new FileRepository(env.R2);
  if (article.r2_raw_key) await fileRepo.delete(article.r2_raw_key);
  if (article.r2_md_key) await fileRepo.delete(article.r2_md_key);
  await repo.delete(id);

  log.info("article_deleted", { articleId: id });
  return Res.json({ ok: true });
}

export async function apiArticlePublish(request: Request, env: Env, log: Logger): Promise<Response> {
  const parts = new URL(request.url).pathname.split("/");
  const id = parts[parts.length - 2];
  if (!id) throw new ValidationError("Missing article ID");

  const repo = new ArticleRepository(env.DB);
  const article = await repo.getById(id);
  if (!article) throw new NotFoundError("Article", id);
  if (article.status === ARTICLE_STATUS.RAW) {
    throw new ValidationError("Article not cleaned yet");
  }

  await repo.updateStatus(id, ARTICLE_STATUS.PUBLISHED);
  log.info("article_published", { articleId: id });
  return Res.json({ ok: true });
}
