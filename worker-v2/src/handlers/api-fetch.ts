/**
 * Handler: POST /api/fetch — submit a URL for fetching.
 */

import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { FetchService } from "../services/fetch-service.js";
import type { Logger } from "../lib/log.js";

export async function apiFetch(request: Request, env: Env, log: Logger): Promise<Response> {
  const body = await request.json<{ url?: string }>().catch(() => ({ url: undefined }));
  const url = body.url?.trim();

  if (!url || !url.startsWith("http")) {
    throw new ValidationError("Invalid URL");
  }

  const service = new FetchService(env, log);
  const result = await service.fetchUrl(url);
  return Res.json(result);
}
