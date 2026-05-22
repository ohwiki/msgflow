/**
 * Generic web page fetcher — cascade: jina → defuddle → direct.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { EXTERNAL_URL, HEADERS, DEFAULTS } from "../lib/constants.js";

export const genericFetcher: Fetcher = {
  canHandle(): boolean {
    return true;
  },

  async fetch(url: string): Promise<FetchResult> {
    const markdown = (await tryJina(url)) ?? (await tryDefuddle(url)) ?? (await tryDirect(url));
    if (!markdown) throw new FetchError(url, "All fetch methods failed");

    const titleMatch = markdown.match(/^#\s+(.+)/m);
    const title = titleMatch?.[1] ?? url.split("/").pop() ?? "Untitled";

    return { title, author: "", sourceName: "Web", html: markdown, hasCodeBlocks: false };
  },
};

async function tryJina(url: string): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(`${EXTERNAL_URL.JINA_PROXY}/${url}`, {
      headers: { Accept: "text/markdown" },
      timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS,
    });
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

async function tryDefuddle(url: string): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(
      `${EXTERNAL_URL.DEFUDDLE_PROXY}/?url=${encodeURIComponent(url)}`,
      { timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS },
    );
    if (!resp.ok) return null;
    const text = await resp.text();
    return text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

async function tryDirect(url: string): Promise<string | null> {
  try {
    const resp = await fetchWithTimeout(url, {
      headers: { "User-Agent": HEADERS.BOT_UA },
      timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS,
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    return bodyMatch?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() ?? null;
  } catch {
    return null;
  }
}
