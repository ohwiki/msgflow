/**
 * Handler: EasyClaude 额度查询。
 *
 * GET  /quota           → 页面（自动加载 KV 中预配置 key 的余额）
 * POST /api/quota/check → HTMX partial（mode=saved | mode=manual）
 *
 * 职责边界：HTTP 请求解析 → 调 Service → 数据映射 → Mustache 渲染。
 * 不含业务逻辑、不含 HTML 拼接、不含日期格式化。
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry } from "../types/quota.js";
import { QuotaService, EasyClaudeClient, toCardViewModels } from "../services/quota-service.js";
import layoutTpl from "../templates/layout.mustache";
import quotaTpl from "../templates/partials/quota.mustache";
import quotaCardsTpl from "../templates/partials/quota-cards.mustache";

const KV_KEY_EASYCLAUDE = "easyclaude_keys";

const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

// ─── Page ───────────────────────────────────────────────

export async function pageQuota(_request: Request, env: Env, _log: Logger): Promise<Response> {
  const keys = await loadKeys(env);
  const content = Mustache.render(quotaTpl, { hasKeys: keys.length > 0, keyCount: keys.length });
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "额度查询", content });
  return Res.html(html);
}

// ─── API ────────────────────────────────────────────────

export async function apiQuotaCheck(request: Request, env: Env, log: Logger): Promise<Response> {
  const form = await request.formData();
  const mode = (form.get("mode") as string) || "manual";

  const service = new QuotaService(new EasyClaudeClient(), log);
  let entries: QuotaKeyEntry[];

  if (mode === "saved") {
    entries = await loadKeys(env);
    if (!entries.length) {
      return Res.html(Mustache.render(quotaCardsTpl, { hasResults: false }));
    }
  } else {
    const apiKey = ((form.get("api_key") as string) || "").trim();
    if (!apiKey) {
      return Res.html(`<div class="alert alert-error">请输入 API Key</div>`);
    }
    entries = [{ label: "手动查询", key: apiKey }];
  }

  const results = await service.queryAll(entries);
  const viewModels = toCardViewModels(results);
  const html = Mustache.render(quotaCardsTpl, { hasResults: viewModels.length > 0, results: viewModels });
  return Res.html(html);
}

// ─── KV Access ──────────────────────────────────────────

async function loadKeys(env: Env): Promise<QuotaKeyEntry[]> {
  const raw = await env.KV.get(KV_KEY_EASYCLAUDE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QuotaKeyEntry[];
  } catch {
    return [];
  }
}
