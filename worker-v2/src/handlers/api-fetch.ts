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
  let tags: string[] = [];
  let customTitle = "";

  try {
    const ct = request.headers.get("Content-Type") || "";
    if (ct.includes("json")) {
      const body = await request.json<{ url?: string; tags?: string[]; title?: string }>();
      url = body.url?.trim();
      tags = body.tags || [];
      customTitle = body.title?.trim() || "";
    } else {
      // form-urlencoded or multipart
      const form = await request.formData();
      url = (form.get("url") as string)?.trim();
      customTitle = (form.get("title") as string)?.trim() || "";
      tags = form.getAll("tags").map(t => String(t));
      const customTags = (form.get("custom_tags") as string)?.trim();
      if (customTags) {
        tags.push(...customTags.split(/[,，]/).map(t => t.trim()).filter(Boolean));
      }
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

    // 覆盖标题（用户自定义优先）
    const { ArticleRepository } = await import("../repositories/article-repository.js");
    const repo = new ArticleRepository(env.DB);
    if (customTitle) {
      await repo.updateTitle(result.articleId, customTitle);
      result.title = customTitle;
    }

    // 保存用户选择的标签
    if (tags.length > 0) {
      await repo.updateTags(result.articleId, JSON.stringify(tags));
    }

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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    log.error("fetch_error", { url: url || "", error: msg });
    if (isHtmx) return Res.html(`<div class="alert alert-error">❌ 抓取失败：${msg}</div>`);
    throw e;
  }
}
