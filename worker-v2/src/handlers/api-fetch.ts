/**
 * Handler: POST /api/fetch — submit a URL for fetching.
 */

import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { FetchService } from "../services/fetch-service.js";
import type { Logger } from "../lib/log.js";

export async function apiFetch(request: Request, env: Env, log: Logger): Promise<Response> {
  const isHtmx = request.headers.get("HX-Request") === "true";
  let url: string | undefined;

  try {
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      const body = await request.json<{ url?: string }>();
      url = body.url?.trim();
    } else {
      // form-urlencoded or multipart
      const form = await request.formData();
      url = (form.get("url") as string)?.trim();
    }
  } catch (e) {
    log.error("fetch_parse_error", { error: String(e) });
    if (isHtmx) return Res.html(`<div class="alert alert-error">请求解析失败</div>`);
    throw new ValidationError("Request parse error");
  }

  log.info("fetch_request", { url: url || "(empty)" });

  if (!url || !url.startsWith("http")) {
    if (isHtmx) return Res.html(`<div class="alert alert-error">请输入有效的 URL</div>`);
    throw new ValidationError("Invalid URL");
  }

  try {
    const service = new FetchService(env, log);
    const result = await service.fetchUrl(url);

    if (isHtmx) {
      return Res.html(`
        <div class="alert alert-success">
          <span>✅ 抓取成功：<strong>${result.title}</strong></span>
          <span class="badge badge-sm">${result.sourceType}</span>
          <span class="badge badge-sm badge-outline">${result.status}</span>
        </div>
      `);
    }
    return Res.json(result);
  } catch (e: any) {
    log.error("fetch_error", { url, error: e.message });
    if (isHtmx) return Res.html(`<div class="alert alert-error">❌ 抓取失败：${e.message}</div>`);
    throw e;
  }
}
