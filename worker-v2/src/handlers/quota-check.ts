/**
 * Handler: EasyClaude 额度查询。
 *
 * GET  /quota           → 页面（自动加载 KV 中预配置 key 的余额）
 * POST /api/quota/check → HTMX API（mode=saved | mode=manual）
 *
 * 职责边界：HTTP 层（解析请求 → 调 Service → 渲染响应），不含业务逻辑。
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry, QuotaResult } from "../types/quota.js";
import { QuotaService, EasyClaudeClient, parseKeysText } from "../services/quota-service.js";
import layoutTpl from "../templates/layout.mustache";
import quotaTpl from "../templates/partials/quota.mustache";

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
      return Res.html(`<div class="alert alert-warning">未配置 key，请在 <a href="/settings" class="link">设置</a> 中添加</div>`);
    }
  } else {
    const apiKey = ((form.get("api_key") as string) || "").trim();
    if (!apiKey) {
      return Res.html(`<div class="alert alert-error">请输入 API Key</div>`);
    }
    entries = [{ label: "手动查询", key: apiKey }];
  }

  const results = await service.queryAll(entries);
  return Res.html(renderQuotaCards(results));
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

// ─── HTML Rendering (HTMX partial) ─────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderQuotaCards(results: QuotaResult[]): string {
  if (!results.length) {
    return `<div class="alert alert-warning">没有可查询的 key</div>`;
  }

  const cards = results.map((r) => {
    const label = escapeHtml(r.label);
    const masked = escapeHtml(r.masked);

    if (!r.ok) {
      const info = escapeHtml(r.info || "查询失败");
      return `
        <div class="card bg-base-100 shadow border border-error/30">
          <div class="card-body p-4">
            <div class="flex items-center gap-2">
              <span class="badge badge-error badge-sm">✗</span>
              <span class="font-medium">${label}</span>
              <span class="text-xs text-base-content/50 font-mono">${masked}</span>
            </div>
            <p class="text-sm text-error mt-1">${info}</p>
          </div>
        </div>`;
    }

    const k = r.key_info!;
    const pct = k.remaining_percentage ?? (k.total_quota > 0 ? (k.remain_quota / k.total_quota) * 100 : 0);
    const pctNum = Math.min(100, Math.max(0, Math.round(pct)));
    const ringColor = pctNum > 50 ? "text-success" : pctNum > 20 ? "text-warning" : "text-error";
    const statusBadge = k.status === 1
      ? `<span class="badge badge-success badge-xs">正常</span>`
      : `<span class="badge badge-error badge-xs">停用</span>`;

    return `
      <div class="card bg-base-100 shadow">
        <div class="card-body p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold">${label}</span>
                ${statusBadge}
              </div>
              <span class="text-xs text-base-content/50 font-mono">${masked}</span>
            </div>
            <div class="radial-progress ${ringColor} text-sm" style="--value:${pctNum};--size:3.5rem;--thickness:4px;" role="progressbar">
              ${pctNum}%
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
            <div class="text-base-content/60">剩余额度</div>
            <div class="font-medium text-right">${k.remain_quota.toFixed(2)}</div>
            <div class="text-base-content/60">已用额度</div>
            <div class="font-medium text-right">${k.used_quota.toFixed(2)}</div>
            <div class="text-base-content/60">总额度</div>
            <div class="font-medium text-right">${k.total_quota.toFixed(2)}</div>
            <div class="text-base-content/60">有效期</div>
            <div class="font-medium text-right">${escapeHtml(k.remaining_time || "—")}</div>
            <div class="text-base-content/60">套餐</div>
            <div class="font-medium text-right">${escapeHtml(k.name || "—")}</div>
          </div>
          <div class="text-xs text-base-content/40 mt-2">${escapeHtml(k.created_time || "—")} ~ ${escapeHtml(k.expired_time || "—")}</div>
        </div>
      </div>`;
  });

  return `<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">${cards.join("")}</div>`;
}
