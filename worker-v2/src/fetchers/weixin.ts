/**
 * WeChat (公众号) article fetcher — direct HTTP with Tavily/Exa fallback.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { URL_PATTERN, HEADERS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export const weixinFetcher: Fetcher = {
  canHandle(url: string): boolean {
    return URL_PATTERN.WEIXIN.some((p) => url.includes(p));
  },

  async fetch(url: string, env: Env, log: Logger): Promise<FetchResult> {
    // Try direct fetch first
    const resp = await fetchWithTimeout(url, {
      headers: { Referer: HEADERS.WEIXIN_REFERER, "User-Agent": HEADERS.DEFAULT_UA },
    });
    if (!resp.ok) throw new FetchError(url, `HTTP ${resp.status}`);
    const html = await resp.text();

    // Detect verification page
    if (!html.includes('id="js_content"') || html.includes("环境异常")) {
      log.warn("weixin_blocked", { url });
      // Fallback: Tavily Extract → Exa
      const fallback = (await tryTavily(url, env, log)) ?? (await tryExa(url, env, log));
      if (!fallback) throw new FetchError(url, "Blocked by verification, all fallbacks failed");
      return fallback;
    }

    const title = extractText(html, /id="activity-name"[^>]*>([\s\S]*?)<\//);
    const author = extractText(html, /id="js_author_name"[^>]*>([\s\S]*?)<\//) ||
      extractText(html, /class="rich_media_meta_text"[^>]*>([\s\S]*?)<\//);
    const sourceName = extractText(html, /id="js_name"[^>]*>([\s\S]*?)<\//);

    const contentMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<script/);
    if (!contentMatch) throw new FetchError(url, "Content not found (#js_content)");

    const contentHtml = contentMatch[1] ?? "";
    const hasCodeBlocks = (contentHtml.match(/<pre/g) ?? []).length > 0;

    return { title, author, sourceName, html: contentHtml, hasCodeBlocks };
  },
};

function extractText(html: string, pattern: RegExp): string {
  return (html.match(pattern)?.[1] ?? "").replace(/<[^>]+>/g, "").trim();
}

/** Tavily Extract API — advanced mode for protected pages. */
async function tryTavily(url: string, env: Env, log: Logger): Promise<FetchResult | null> {
  const key = env.TAVILY_API_KEY || (await env.KV.get("tavily_api_key"));
  if (!key) return null;
  try {
    log.info("tavily_attempt", { url });
    const resp = await fetchWithTimeout("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, urls: [url], extract_depth: "advanced" }),
      timeoutMs: 30_000,
    });
    if (!resp.ok) { log.warn("tavily_failed", { status: String(resp.status) }); return null; }
    const data = await resp.json<{ results?: { raw_content?: string; title?: string }[] }>();
    const content = data.results?.[0]?.raw_content;
    if (!content || content.length < 100) { log.warn("tavily_empty"); return null; }
    const title = data.results?.[0]?.title || extractTitleFromMd(content);
    log.info("tavily_success", { title, chars: String(content.length) });
    return { title, author: "", sourceName: "WeChat", html: content, hasCodeBlocks: false, isMarkdown: true };
  } catch (e: unknown) {
    log.error("tavily_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

/** Exa get-contents API fallback. */
async function tryExa(url: string, env: Env, log: Logger): Promise<FetchResult | null> {
  const key = env.EXA_API_KEY || (await env.KV.get("exa_api_key"));
  if (!key) return null;
  try {
    log.info("exa_attempt", { url });
    const resp = await fetchWithTimeout("https://api.exa.ai/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ urls: [url], text: true }),
      timeoutMs: 30_000,
    });
    if (!resp.ok) { log.warn("exa_failed", { status: String(resp.status) }); return null; }
    const data = await resp.json<{ results?: { text?: string; title?: string; author?: string }[] }>();
    const item = data.results?.[0];
    if (!item?.text || item.text.length < 100) { log.warn("exa_empty"); return null; }
    log.info("exa_success", { title: item.title || "", chars: String(item.text.length) });
    return { title: item.title || "", author: item.author || "", sourceName: "WeChat", html: item.text, hasCodeBlocks: false, isMarkdown: true };
  } catch (e: unknown) {
    log.error("exa_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

function extractTitleFromMd(md: string): string {
  const m = md.match(/^#\s+(.+)/m);
  return m?.[1] ?? "";
}
