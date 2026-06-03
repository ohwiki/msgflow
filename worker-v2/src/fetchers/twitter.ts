/**
 * Twitter/X fetcher — via r.jina.ai proxy.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { URL_PATTERN, EXTERNAL_URL, DEFAULTS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export const twitterFetcher: Fetcher = {
  canHandle(url: string): boolean {
    return URL_PATTERN.TWITTER.some((p) => url.includes(p));
  },

  async fetch(url: string, _env: Env, _log: Logger): Promise<FetchResult> {
    const resp = await fetchWithTimeout(`${EXTERNAL_URL.JINA_PROXY}/${url}`, {
      headers: { Accept: "text/markdown" },
      timeoutMs: DEFAULTS.PROXY_TIMEOUT_MS,
    });
    if (!resp.ok) throw new FetchError(url, `Jina proxy HTTP ${resp.status}`);
    const markdown = await resp.text();

    const titleMatch = markdown.match(/^#\s+(.+)/m);
    const title = titleMatch?.[1] ?? markdown.split("\n")[0]?.slice(0, 100) ?? "Twitter Post";

    return { title, author: "", sourceName: "Twitter/X", html: markdown, hasCodeBlocks: false };
  },
};
