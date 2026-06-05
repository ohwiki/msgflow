/**
 * Handler: domain availability check via RDAP.
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import layoutTpl from "../templates/layout.mustache";

const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

const PAGE_TPL = `
<div class="card bg-base-100 shadow">
  <div class="card-body">
    <h2 class="card-title">🌐 域名查询</h2>
    <p class="text-sm text-base-content/60">批量检测域名是否已被注册（通过 RDAP 协议）</p>
    <form hx-post="/api/domain/check" hx-target="#domain-result" hx-indicator="#domain-loading" class="mt-4 space-y-4">
      <textarea name="domains" class="textarea textarea-bordered w-full h-32" placeholder="每行一个域名，例如：&#10;example.com&#10;mysite.io&#10;cool-app.dev" required></textarea>
      <button type="submit" class="btn btn-primary w-full">批量查询</button>
    </form>
    <div id="domain-loading" class="htmx-indicator mt-4"><span class="loading loading-spinner loading-sm"></span> 正在查询...</div>
    <div id="domain-result" class="mt-4"></div>
  </div>
</div>`;

export async function pageDomain(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  const content = Mustache.render(PAGE_TPL, {});
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "域名查询", content });
  return Res.html(html);
}

export async function apiDomainCheck(request: Request, _env: Env, log: Logger): Promise<Response> {
  const form = await request.formData();
  const raw = (form.get("domains") as string) || "";
  const domains = raw.split(/[\n,]+/).map((d) => d.trim().toLowerCase()).filter(Boolean);

  if (!domains.length) return Res.html(`<div class="alert alert-error">请输入至少一个域名</div>`);

  log.info("domain_check", { count: String(domains.length) });

  const results = await Promise.all(domains.slice(0, 20).map(checkDomain));

  const rows = results.map((r) => {
    const icon = r.available ? "✅" : "❌";
    const badge = r.available
      ? `<span class="badge badge-success badge-sm">可注册</span>`
      : `<span class="badge badge-error badge-sm">已注册</span>`;
    return `<tr><td class="font-mono">${r.domain}</td><td>${icon} ${badge}</td><td class="text-xs text-base-content/50">${r.sources}</td></tr>`;
  }).join("");

  const available = results.filter((r) => r.available).length;

  return Res.html(`
    <div class="text-sm mb-2 text-base-content/60">共查询 ${results.length} 个，可注册 <strong class="text-success">${available}</strong> 个（RDAP + DNS + WHOIS 三源交叉验证）</div>
    <div class="overflow-x-auto bg-base-100 rounded-box">
      <table class="table table-sm"><thead><tr><th>域名</th><th>状态</th><th>验证来源</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
  `);
}

async function checkDomain(domain: string): Promise<{ domain: string; available: boolean; sources: string }> {
  const results = await Promise.all([
    checkRdap(domain),
    checkDns(domain),
    checkWhois(domain),
  ]);

  // Only count non-skipped sources for voting
  const validResults = results.filter((r) => !("skipped" in r && r.skipped));
  const availableCount = validResults.filter((r) => r.available).length;
  const available = validResults.length > 0 ? availableCount > validResults.length / 2 : false;
  const sources = results.map((r) => `${r.source}:${"skipped" in r && r.skipped ? "—" : r.available ? "✓" : "✗"}`).join(" ");

  return { domain, available, sources };
}

async function checkRdap(domain: string): Promise<{ available: boolean; source: string; skipped?: boolean }> {
  // RDAP doesn't support these TLDs (registries not connected)
  const unsupported = [".cn", ".com.cn", ".net.cn", ".org.cn", ".中国", ".io", ".ai", ".me", ".tv", ".cc", ".co"];
  if (unsupported.some((tld) => domain.endsWith(tld))) {
    return { available: false, source: "RDAP(不支持)", skipped: true };
  }
  try {
    const resp = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json" },
      signal: AbortSignal.timeout(6000),
    });
    return { available: resp.status === 404, source: "RDAP" };
  } catch {
    return { available: false, source: "RDAP" };
  }
}

async function checkDns(domain: string): Promise<{ available: boolean; source: string }> {
  try {
    const resp = await fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(5000),
    });
    const data = await resp.json<{ Answer?: unknown[] }>();
    return { available: !data.Answer || data.Answer.length === 0, source: "DNS" };
  } catch {
    return { available: false, source: "DNS" };
  }
}

async function checkWhois(domain: string): Promise<{ available: boolean; source: string }> {
  try {
    const resp = await fetch(`https://whoisjson.com/api/v1/whois?domain=${domain}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (resp.status === 404 || resp.status === 204) return { available: true, source: "WHOIS" };
    const data = await resp.json<{ domain_name?: string; error?: string }>();
    if (data.error?.toLowerCase().includes("not found") || !data.domain_name) return { available: true, source: "WHOIS" };
    return { available: false, source: "WHOIS" };
  } catch {
    return { available: false, source: "WHOIS" };
  }
}
