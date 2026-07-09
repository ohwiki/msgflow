/**
 * GET /api/feishu/token-status — show feishu user token health.
 */
import type { Logger } from "../lib/log.js";

export async function apiFeishuTokenStatus(
  _request: Request,
  env: Env,
  log: Logger,
): Promise<Response> {
  const raw = await env.KV.get("feishu_user_token");
  if (!raw) {
    return Response.json({ status: "missing", message: "No token in KV" });
  }

  const data = JSON.parse(raw);
  const savedAt = data._saved_at || 0;
  const expiresIn = data.expires_in || 7200;
  const refreshExpiresIn = data.refresh_expires_in || 2592000;
  const now = Date.now() / 1000;

  const tokenAge = now - savedAt;
  const tokenRemaining = Math.max(0, expiresIn - tokenAge);
  const refreshRemaining = Math.max(0, refreshExpiresIn - tokenAge);

  const status = tokenRemaining > 0 ? "valid" : refreshRemaining > 0 ? "expired_refreshable" : "dead";

  log.info("feishu_token_status_checked", { status });

  return Response.json({
    status,
    access_token_remaining_seconds: Math.round(tokenRemaining),
    refresh_token_remaining_seconds: Math.round(refreshRemaining),
    scope: data.scope || "",
    last_refreshed: savedAt ? new Date(savedAt * 1000).toISOString() : "never",
  });
}
