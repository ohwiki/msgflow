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
        <div class="card bg-base-100 shadow border border-error/40">
          <div class="card-body gap-1 py-3 px-4">
            <div class="flex items-center justify-between">
              <span class="font-semibold">${label}</span>
              <span class="text-xs opacity-50 font-mono">${masked}</span>
            </div>
            <div class="text-error text-sm">${info}</div>
          </div>
        </div>`;
    }

    const k = r.key_info!;
    const pct = k.remaining_percentage ?? (k.total_quota > 0 ? (k.remain_quota / k.total_quota) * 100 : 0);
    const pctNum = Math.min(100, Math.max(0, Math.round(pct)));
    const usagePct = 100 - pctNum;
    const statusOk = k.status === 1;

    // Parse remaining days
    const daysMatch = (k.remaining_time || "").match(/[\d.]+/);
    const days = daysMatch ? Math.round(parseFloat(daysMatch[0])) : NaN;
    const daysTxt = isNaN(days) ? "—" : `${days} 天`;
    const daysCls = !isNaN(days) && days <= 5 ? "text-error" : "";

    // Format dates
    const fmtDate = (s: string) => {
      if (!s) return "—";
      const parts = s.split(" ");
      const d = parts[0] || "";
      const t = parts[1] || "";
      const p = d.split("-");
      if (p.length !== 3) return escapeHtml(s);
      return `${+(p[0] || 0)}/${+(p[1] || 0)}/${+(p[2] || 0)}${t ? " " + t : ""}`;
    };

    return `
      <div class="card bg-base-100 shadow">
        <div class="card-body gap-3 p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="font-semibold truncate">${label}</div>
              <div class="text-xs opacity-50 font-mono">${masked}</div>
            </div>
            <span class="badge ${statusOk ? "badge-success" : "badge-error"} badge-sm shrink-0">
              ${statusOk ? "正常" : "停用"}
            </span>
          </div>

          <div class="flex items-center gap-4">
            <div class="relative shrink-0" style="width:7rem;height:7rem;">
              <div class="w-full h-full rounded-full" style="background:conic-gradient(#3b82f6 0 ${pctNum}%, var(--color-base-300,#d1d5db) ${pctNum}% 100%);"></div>
              <div class="absolute rounded-full bg-base-100 flex flex-col items-center justify-center" style="inset:0.7rem;">
                <span class="text-xl font-bold" style="color:#3b82f6;">${k.remain_quota.toFixed(1)}</span>
                <span class="text-xs opacity-60">剩余</span>
              </div>
            </div>
            <div class="flex-1 flex flex-col gap-1.5 text-sm">
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full" style="background:#3b82f6;"></span>剩余</span>
                <span class="font-semibold">${k.remain_quota.toFixed(2)} <span class="opacity-50">(${pctNum}%)</span></span>
              </div>
              <div class="flex items-center justify-between">
                <span class="flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full bg-base-300"></span>已用</span>
                <span class="font-semibold">${k.used_quota.toFixed(2)} <span class="opacity-50">(${usagePct}%)</span></span>
              </div>
              <div class="border-t border-base-300 my-0.5"></div>
              <div class="flex items-center justify-between">
                <span class="opacity-60">总额度</span>
                <span class="font-semibold">${k.total_quota.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div class="border-t border-base-300 my-0"></div>

          <div class="flex flex-col gap-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="opacity-60">套餐</span>
              <span class="truncate ml-2 text-sm font-medium">${escapeHtml(k.name || "—")}</span>
            </div>
            ${renderTimeline(k.created_time, k.expired_time, days, daysCls)}
          </div>
        </div>
      </div>`;
  });

  return `<div class="flex flex-col gap-3">${cards.join("")}</div>`;
}

/** Render subscription period as a visual timeline progress bar with countdown */
function renderTimeline(createdTime: string, expiredTime: string, daysLeft: number, daysCls: string): string {
  // Calculate progress percentage through the subscription period
  const start = parseDate(createdTime);
  const end = parseDate(expiredTime);
  const now = Date.now();

  let progressPct = 50; // fallback
  if (start && end && end > start) {
    const elapsed = now - start;
    const total = end - start;
    progressPct = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  const barColor = progressPct > 80 ? "#f87171" : progressPct > 60 ? "#fbbf24" : "#3b82f6";

  // Format dates short
  const fmtShort = (s: string) => {
    if (!s) return "—";
    const parts = s.split(" ");
    const d = (parts[0] || "").split("-");
    if (d.length !== 3) return s.slice(0, 10);
    return `${d[1] || ""}/${d[2] || ""}`;
  };

  // Countdown display
  const countdownHtml = isNaN(daysLeft)
    ? `<span class="opacity-50">—</span>`
    : daysLeft <= 0
      ? `<span class="text-error font-bold">已到期</span>`
      : `<span class="font-mono font-bold ${daysCls}" style="font-size:1.1rem;">${daysLeft}</span><span class="opacity-60 ml-0.5">天</span>`;

  return `
    <div class="mt-1 rounded-lg bg-base-200/50 p-2.5">
      <div class="flex items-center justify-between mb-1.5">
        <span class="opacity-60 text-xs">服务周期</span>
        <div class="flex items-baseline gap-0.5 text-sm">${countdownHtml}</div>
      </div>
      <div class="relative h-2 rounded-full bg-base-300 overflow-hidden">
        <div class="absolute inset-y-0 left-0 rounded-full transition-all" style="width:${progressPct}%;background:${barColor};"></div>
        <div class="absolute inset-y-0 rounded-full w-1 bg-base-100 border border-base-300" style="left:calc(${progressPct}% - 2px);top:-1px;bottom:-1px;width:6px;height:calc(100% + 2px);border-radius:3px;"></div>
      </div>
      <div class="flex justify-between mt-1 text-xs opacity-50">
        <span>${fmtShort(createdTime)}</span>
        <span>${fmtShort(expiredTime)}</span>
      </div>
    </div>`;
}

function parseDate(s: string): number | null {
  if (!s) return null;
  const t = Date.parse(s.replace(" ", "T"));
  return isNaN(t) ? null : t;
}
