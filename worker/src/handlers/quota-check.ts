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
import { CDN, BASE_TEMPLATE_VARS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry } from "../types/quota.js";
import { QuotaService, EasyClaudeClient, toCardViewModels, toRowViewModels, toDetailViewModel, keyId } from "../services/quota-service.js";
import layoutTpl from "../templates/layout.mustache";
import quotaTpl from "../templates/partials/quota.mustache";
import quotaCardsTpl from "../templates/partials/quota-cards.mustache";
import quotaRowsTpl from "../templates/partials/quota-rows.mustache";
import quotaDetailTpl from "../templates/partials/quota-detail.mustache";

const KV_KEY_EASYCLAUDE = "easyclaude_keys";

const baseVars = BASE_TEMPLATE_VARS;

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

  // Saved keys render as compact rows linking to /quota/:id.
  if (mode === "saved") {
    const entries = await loadKeys(env);
    const rows = toRowViewModels(await service.queryAll(entries));
    return Res.html(Mustache.render(quotaRowsTpl, { hasResults: rows.length > 0, results: rows }));
  }

  // A manually typed key isn't in KV, so it has no detail route — render the full card.
  const apiKey = ((form.get("api_key") as string) || "").trim();
  if (!apiKey) {
    return Res.html(`<div class="alert alert-error">请输入 API Key</div>`);
  }
  const cards = toCardViewModels(await service.queryAll([{ label: "手动查询", key: apiKey }]));
  return Res.html(Mustache.render(quotaCardsTpl, { hasResults: cards.length > 0, results: cards }));
}

// ─── Detail Page ────────────────────────────────────────

export async function pageQuotaDetail(request: Request, env: Env, log: Logger): Promise<Response> {
  const id = new URL(request.url).pathname.split("/").pop() ?? "";
  const entry = (await loadKeys(env)).find((e) => keyId(e.key) === id);
  if (!entry) return Res.notFound();

  const service = new QuotaService(new EasyClaudeClient(), log);
  const vm = toDetailViewModel(await service.queryOne(entry));
  const content = Mustache.render(quotaDetailTpl, vm);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: `额度详情 · ${entry.label}`, content });
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
