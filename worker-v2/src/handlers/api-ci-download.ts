/**
 * Handler: GET /api/ci-download?token=xxx
 *
 * Called by GitHub Actions to download raw HTML directly from R2.
 * Uses the same one-time token as ci-config.
 */

import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { CiTokenService } from "../services/ci-token-service.js";
import type { Logger } from "../lib/log.js";

export async function apiCiDownload(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) throw new ValidationError("Missing token parameter");

  const ciTokenService = new CiTokenService(env.KV);
  const payload = await ciTokenService.consume(token);

  if (!payload) {
    log.warn("ci_download_token_invalid", { token: token.slice(0, 8) });
    throw new ValidationError("Invalid or expired token");
  }

  const obj = await env.R2.get(payload.r2_raw_key);
  if (!obj) return Res.notFound();

  log.info("ci_download", { articleId: payload.article_id, key: payload.r2_raw_key });

  return new Response(obj.body, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
