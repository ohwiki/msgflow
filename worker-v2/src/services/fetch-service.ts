/**
 * Fetch Service — URL routing via Fetcher registry + storage orchestration.
 */

import { ARTICLE_STATUS, detectSourceType } from "../lib/constants.js";
import { DuplicateError, FetchError } from "../lib/errors.js";
import type { Logger } from "../lib/log.js";
import type { IArticleRepository } from "../types/repository.js";
import type { IFileRepository } from "../types/repository.js";
import type { Fetcher } from "../types/fetcher.js";
import { weixinFetcher } from "../fetchers/weixin.js";
import { feishuFetcher } from "../fetchers/feishu.js";
import { twitterFetcher } from "../fetchers/twitter.js";
import { rssFetcher } from "../fetchers/rss.js";
import { genericFetcher } from "../fetchers/generic.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";

/** Ordered fetcher registry — first match wins, generic is always last. */
const FETCHERS: Fetcher[] = [weixinFetcher, feishuFetcher, twitterFetcher, rssFetcher, genericFetcher];

export interface FetchOutput {
  articleId: string;
  title: string;
  sourceType: string;
  hasCodeBlocks: boolean;
  status: string;
}

export class FetchService {
  private articleRepo: IArticleRepository;
  private fileRepo: IFileRepository;

  constructor(
    private env: Env,
    private log: Logger,
  ) {
    this.articleRepo = new ArticleRepository(env.DB);
    this.fileRepo = new FileRepository(env.R2);
  }

  async fetchUrl(url: string): Promise<FetchOutput> {
    // Dedup check
    const existing = await this.articleRepo.getByUrl(url);
    if (existing) {
      this.log.info("fetch_duplicate", { url, articleId: existing.id });
      return {
        articleId: existing.id,
        title: existing.title,
        sourceType: existing.source_type,
        hasCodeBlocks: false,
        status: existing.status,
      };
    }

    // Find matching fetcher
    const fetcher = FETCHERS.find((f) => f.canHandle(url));
    if (!fetcher) throw new FetchError(url, "No fetcher available");

    this.log.info("fetch_start", { url });
    const result = await fetcher.fetch(url, this.env);

    const articleId = crypto.randomUUID();
    const sourceType = detectSourceType(url);

    // Store raw content
    const r2RawKey = await this.fileRepo.putRaw(articleId, result.html);

    // Determine if we can clean immediately (no code blocks, or already markdown from proxy)
    const canCleanNow = !result.hasCodeBlocks;
    const r2MdKey = canCleanNow ? await this.fileRepo.putMarkdown(articleId, result.html) : null;
    const status = canCleanNow ? ARTICLE_STATUS.CLEANED : ARTICLE_STATUS.RAW;

    // Persist to D1
    await this.articleRepo.create({
      id: articleId,
      url,
      title: result.title,
      author: result.author,
      source_type: sourceType,
      source_name: result.sourceName,
      status,
      tags: "[]",
      summary: "",
      r2_raw_key: r2RawKey,
      r2_md_key: r2MdKey,
      fetched_at: new Date().toISOString(),
      published_at: null,
    });

    this.log.info("fetch_done", { articleId, sourceType, status });
    return { articleId, title: result.title, sourceType, hasCodeBlocks: result.hasCodeBlocks, status };
  }
}
