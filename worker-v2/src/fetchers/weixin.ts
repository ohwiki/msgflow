/**
 * WeChat (公众号) article fetcher — pure HTTP, no browser needed.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { URL_PATTERN, HEADERS } from "../lib/constants.js";

export const weixinFetcher: Fetcher = {
  canHandle(url: string): boolean {
    return URL_PATTERN.WEIXIN.some((p) => url.includes(p));
  },

  async fetch(url: string): Promise<FetchResult> {
    const resp = await fetchWithTimeout(url, {
      headers: { Referer: HEADERS.WEIXIN_REFERER, "User-Agent": HEADERS.DEFAULT_UA },
    });
    if (!resp.ok) throw new FetchError(url, `HTTP ${resp.status}`);
    const html = await resp.text();

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
