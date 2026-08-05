/**
 * Handler: 额度查询（EasyClaude + Fenno 两个中转，tab 切换）。
 *
 * GET  /quota            → 页面（EasyClaude tab 随页面加载，Fenno tab 展开时才查）
 * POST /api/quota/check  → HTMX partial（mode=saved | mode=manual）
 * POST /api/fenno/check  → HTMX partial
 * GET  /quota/:provider/:id → 详情页
 *
 * 职责边界：HTTP 请求解析 → 调 Service → 数据映射 → Mustache 渲染。
 * 不含业务逻辑、不含 HTML 拼接、不含日期格式化。
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { BASE_TEMPLATE_VARS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry } from "../types/quota.js";
import { QuotaService, EasyClaudeClient, toCardViewModels, toRowViewModels, toDetailViewModel, keyId } from "../services/quota-service.js";
import { FennoService, FennoClient, toFennoRowViewModels, toFennoDetailViewModel } from "../services/fenno-service.js";
import layoutTpl from "../templates/layout.mustache";
import quotaTpl from "../templates/partials/quota.mustache";
import quotaCardsTpl from "../templates/partials/quota-cards.mustache";
import quotaRowsTpl from "../templates/partials/quota-rows.mustache";
import quotaDetailTpl from "../templates/partials/quota-detail.mustache";
import quotaFennoDetailTpl from "../templates/partials/quota-fenno-detail.mustache";

const KV_KEY_EASYCLAUDE = "easyclaude_keys";
const KV_KEY_FENNO = "fenno_keys";

const baseVars = BASE_TEMPLATE_VARS;

// ─── Page ───────────────────────────────────────────────

export async function pageQuota(_request: Request, env: Env, _log: Logger): Promise<Response> {
  const [ec, fn] = await Promise.all([loadKeys(env), loadFennoKeys(env)]);
  const content = Mustache.render(quotaTpl, {
    ecHasKeys: ec.length > 0,
    ecCount: ec.length,
    fnHasKeys: fn.length > 0,
    fnCount: fn.length,
  });
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

export async function apiFennoCheck(_request: Request, env: Env, log: Logger): Promise<Response> {
  const entries = await loadFennoKeys(env);
  const service = new FennoService(new FennoClient(), log);
  const rows = toFennoRowViewModels(await service.queryAll(entries));
  return Res.html(Mustache.render(quotaRowsTpl, { hasResults: rows.length > 0, results: rows }));
}

// ─── Detail Page ────────────────────────────────────────

/** GET /quota/:provider/:id — the provider segment says which KV list owns the id. */
export async function pageQuotaDetail(request: Request, env: Env, log: Logger): Promise<Response> {
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  const provider = parts[1] ?? "";
  const id = parts[2] ?? "";

  if (provider === "fenno") {
    const entry = (await loadFennoKeys(env)).find((e) => keyId(e.key) === id);
    if (!entry) return Res.notFound();
    const service = new FennoService(new FennoClient(), log);
    const vm = toFennoDetailViewModel(await service.queryOne(entry));
    return renderDetail(quotaFennoDetailTpl, vm, entry.label);
  }

  const entry = (await loadKeys(env)).find((e) => keyId(e.key) === id);
  if (!entry) return Res.notFound();
  const service = new QuotaService(new EasyClaudeClient(), log);
  const vm = toDetailViewModel(await service.queryOne(entry));
  return renderDetail(quotaDetailTpl, vm, entry.label);
}

function renderDetail(tpl: string, vm: object, label: string): Response {
  const content = Mustache.render(tpl, vm);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: `额度详情 · ${label}`, content });
  return Res.html(html);
}

// ─── KV Access ──────────────────────────────────────────

async function loadKeys(env: Env): Promise<QuotaKeyEntry[]> {
  return readKeyList(env, KV_KEY_EASYCLAUDE);
}

async function loadFennoKeys(env: Env): Promise<QuotaKeyEntry[]> {
  return readKeyList(env, KV_KEY_FENNO);
}

async function readKeyList(env: Env, kvKey: string): Promise<QuotaKeyEntry[]> {
  const raw = await env.KV.get(kvKey);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QuotaKeyEntry[];
  } catch {
    return [];
  }
}
