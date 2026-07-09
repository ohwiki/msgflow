/**
 * Handler: GET /api/ai-config?secret=xxx
 *
 * Called by GitHub Actions to retrieve AI model configuration.
 * Authenticated via CALLBACK_SECRET (same secret used for callbacks).
 */

import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import type { Logger } from "../lib/log.js";

export async function apiAiConfig(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  if (!secret || secret !== env.CALLBACK_SECRET) {
    throw new ValidationError("Unauthorized");
  }

  const apiKey = await env.KV.get("nullclaw_api_key") || "";
  const baseUrl = await env.KV.get("nullclaw_base_url") || "";
  const model = await env.KV.get("nullclaw_model") || "mimo-v2.5-pro";

  log.info("ai_config_issued");

  return Res.json({ api_key: apiKey, base_url: baseUrl, model });
}
