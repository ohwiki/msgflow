/**
 * Generic web page fetcher — cascade: jina → defuddle → direct.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { EXTERNAL_URL, HEADERS, DEFAULTS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";
import { NodeHtmlMarkdown } from "node-html-markdown";

export const genericFetcher: Fetcher = {
  canHandle(): boolean {
    return true;
  },

  async fetch(url: string, env: Env, log: Logger): Promise<FetchResult> {
    const markdown = (await tryJina(url, log)) ?? (await tryDefuddle(url, log)) ?? (await tryDirect(url, log)) ?? (await tryTavily(url, env, log)) ?? (await tryExa(url, env, log));
    if (!markdown) throw new FetchError(url, "All fetch methods failed");

    const titleMatch = markdown.match(/^#{1,2}\s+(.+)/m);
    const title = titleMatch?.[1]?.replace(/\[.*?\]/g, "").trim() ?? url.split("/").pop() ?? "Untitled";

    return { title, author: "", sourceName: "Web", html: markdown, hasCodeBlocks: false };
  },
};

async function tryJina(url: string, log: Logger): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(`${EXTERNAL_URL.JINA_PROXY}/${url}`, {
      headers: { Accept: "text/markdown" },
      timeoutMs: 30_000,
    });
    if (!resp.ok) { log.warn("jina_failed", { status: String(resp.status) }); return null; }
    const text = await resp.text();
    if (text.length < 100) { log.warn("jina_too_short", { chars: String(text.length) }); return null; }
    log.info("jina_success", { chars: String(text.length) });
    return text;
  } catch (e: unknown) {
    log.warn("jina_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

async function tryDefuddle(url: string, log: Logger): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(
      `${EXTERNAL_URL.DEFUDDLE_PROXY}/?url=${encodeURIComponent(url)}`,
      { timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS },
    );
    if (!resp.ok) { log.warn("defuddle_failed", { status: String(resp.status) }); return null; }
    const text = await resp.text();
    if (text.length < 100) return null;
    log.info("defuddle_success", { chars: String(text.length) });
    return text;
  } catch (e: unknown) {
    log.warn("defuddle_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

async function tryDirect(url: string, log: Logger): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(url, {
      headers: { "User-Agent": HEADERS.DEFAULT_UA },
      timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS,
    });
    if (!resp.ok) { log.warn("direct_failed", { status: String(resp.status) }); return null; }
    const html = await resp.text();
    // Extract main content area or body
    const contentMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
      ?? html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      ?? html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!contentMatch?.[1]) return null;
    const md = NodeHtmlMarkdown.translate(contentMatch[1]);
    if (md.length < 100) return null;
    log.info("direct_success", { chars: String(md.length) });
    return md;
  } catch (e: unknown) {
    log.warn("direct_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

async function tryTavily(url: string, env: Env, log: Logger): Promise<string | null> {
  const key = env.TAVILY_API_KEY || (await env.KV.get("tavily_api_key"));
  if (!key) return null;
  try {
    log.info("generic_tavily_attempt", { url });
    const resp = await fetchWithTimeout("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: key, urls: [url], extract_depth: "basic" }),
      timeoutMs: 30_000,
    });
    if (!resp.ok) { log.warn("generic_tavily_failed", { status: String(resp.status) }); return null; }
    const data = await resp.json<{ results?: { raw_content?: string }[] }>();
    const content = data.results?.[0]?.raw_content;
    if (!content || content.length < 100) return null;
    log.info("generic_tavily_success", { chars: String(content.length) });
    return content;
  } catch (e: unknown) {
    log.warn("generic_tavily_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}

async function tryExa(url: string, env: Env, log: Logger): Promise<string | null> {
  const key = env.EXA_API_KEY || (await env.KV.get("exa_api_key"));
  if (!key) return null;
  try {
    log.info("generic_exa_attempt", { url });
    const resp = await fetchWithTimeout("https://api.exa.ai/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ urls: [url], text: true }),
      timeoutMs: 30_000,
    });
    if (!resp.ok) { log.warn("generic_exa_failed", { status: String(resp.status) }); return null; }
    const data = await resp.json<{ results?: { text?: string }[] }>();
    const content = data.results?.[0]?.text;
    if (!content || content.length < 100) return null;
    log.info("generic_exa_success", { chars: String(content.length) });
    return content;
  } catch (e: unknown) {
    log.warn("generic_exa_error", { error: e instanceof Error ? e.message : "unknown" });
    return null;
  }
}
