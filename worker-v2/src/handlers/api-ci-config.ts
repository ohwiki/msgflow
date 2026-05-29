/**
 * Handler: GET /api/ci-config?token=xxx
 *
 * Called by GitHub/GitLab Actions to retrieve secrets.
 * Token is one-time use, auto-expires after 10 minutes.
 */

import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { CiTokenService } from "../services/ci-token-service.js";
import type { CiConfig } from "../services/ci-token-service.js";
import type { Logger } from "../lib/log.js";

export async function apiCiConfig(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) throw new ValidationError("Missing token parameter");

  const ciTokenService = new CiTokenService(env.KV);
  const payload = await ciTokenService.consume(token);

  if (!payload) {
    log.warn("ci_token_invalid", { token: token.slice(0, 8) });
    throw new ValidationError("Invalid or expired token");
  }

  log.info("ci_config_issued", { articleId: payload.article_id });

  // 从 DB 获取文章的 title 和 tags
  const { ArticleRepository } = await import("../repositories/article-repository.js");
  const repo = new ArticleRepository(env.DB);
  const article = await repo.getById(payload.article_id);

  const config: CiConfig = {
    cf_account_id: env.CF_ACCOUNT_ID ?? "",
    cf_api_token: env.CF_R2_API_TOKEN ?? "",
    callback_url: `${env.WORKER_URL}/api/callback`,
    callback_secret: env.CALLBACK_SECRET ?? "",
    article_id: payload.article_id,
    r2_raw_key: payload.r2_raw_key,
    title: article?.title ?? "",
    tags: article?.tags ?? "[]",
    source_type: article?.source_type ?? "",
    source_url: article?.url ?? "",
  };

  return Res.json(config);
}
