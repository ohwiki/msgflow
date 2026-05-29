/**
 * Fetcher interface — all content fetchers implement this contract.
 */

export interface FetchResult {
  title: string;
  author: string;
  sourceName: string;
  html: string;
  hasCodeBlocks: boolean;
}

export interface Fetcher {
  canHandle(url: string): boolean;
  fetch(url: string, env: Env): Promise<FetchResult>;
}
