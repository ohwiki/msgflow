/**
 * Fetcher interface — all content fetchers implement this contract.
 */

import type { Logger } from "../lib/log.js";

export interface FetchResult {
  title: string;
  author: string;
  sourceName: string;
  html: string;
  hasCodeBlocks: boolean;
  isMarkdown?: boolean;
}

export interface Fetcher {
  canHandle(url: string): boolean;
  fetch(url: string, env: Env, log: Logger): Promise<FetchResult>;
}
