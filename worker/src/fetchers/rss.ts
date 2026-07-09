/**
 * RSS feed fetcher — parse XML, fetch individual items via jina.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { URL_PATTERN, EXTERNAL_URL, DEFAULTS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

export const rssFetcher: Fetcher = {
  canHandle(url: string): boolean {
    return URL_PATTERN.RSS_SUFFIX.some((s) => url.endsWith(s)) ||
      URL_PATTERN.RSS_PATH.some((p) => url.includes(p));
  },

  async fetch(url: string, _env: Env, _log: Logger): Promise<FetchResult> {
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) throw new FetchError(url, `HTTP ${resp.status}`);
    const xml = await resp.text();

    // If it's a feed, return the first item's content
    const items = parseRssItems(xml);
    if (items.length === 0) throw new FetchError(url, "No items found in RSS feed");

    const first = items[0]!;
    return {
      title: first.title || "RSS Item",
      author: "",
      sourceName: "RSS",
      html: first.description || first.title,
      hasCodeBlocks: false,
    };
  },
};

export function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

  for (const match of itemMatches) {
    const itemXml = match[1] ?? "";
    items.push({
      title: extractTag(itemXml, "title"),
      link: extractTag(itemXml, "link"),
      description: extractTag(itemXml, "description"),
      pubDate: extractTag(itemXml, "pubDate"),
    });
  }
  return items;
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`),
  );
  return (match?.[1] ?? match?.[2] ?? "").trim();
}
