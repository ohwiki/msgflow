/**
 * Handler: POST /api/callback — receive results from GitHub/GitLab Actions.
 *
 * Payload: { article_id, markdown, status?, secret }
 */

import { Res } from "../lib/response.js";
import { ValidationError, NotFoundError } from "../lib/errors.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";
import { GitService } from "../services/git-service.js";
import { ARTICLE_STATUS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

interface CallbackPayload {
  article_id: string;
  markdown: string;
  status?: string;
  secret?: string;
}

export async function apiCallback(request: Request, env: Env, log: Logger): Promise<Response> {
  // Verify callback secret
  const expectedSecret = env.CALLBACK_SECRET ?? "";
  const body = await request.json<CallbackPayload>();

  if (expectedSecret && body.secret !== expectedSecret) {
    throw new ValidationError("Invalid callback secret");
  }
  if (!body.article_id || !body.markdown) {
    throw new ValidationError("Missing article_id or markdown");
  }

  const articleRepo = new ArticleRepository(env.DB);
  const fileRepo = new FileRepository(env.R2);

  const article = await articleRepo.getById(body.article_id);
  if (!article) throw new NotFoundError("Article", body.article_id);

  // Store formatted markdown to R2
  const r2MdKey = await fileRepo.putMarkdown(body.article_id, body.markdown);

  // Update article status
  const newStatus = body.status ?? ARTICLE_STATUS.CLEANED;
  await articleRepo.updateMarkdown(body.article_id, r2MdKey);

  log.info("callback_received", { articleId: body.article_id, status: newStatus });

  // Optionally commit to Git repo
  if (env.GIT_REPO_ENABLED === "true") {
    try {
      const gitService = new GitService(env);
      await gitService.commitMarkdown(article.title, body.markdown, body.article_id);
      log.info("git_committed", { articleId: body.article_id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      log.warn("git_commit_failed", { articleId: body.article_id, error: msg });
      // Non-fatal: don't fail the callback if git commit fails
    }
  }

  return Res.json({ ok: true, articleId: body.article_id, status: newStatus });
}
