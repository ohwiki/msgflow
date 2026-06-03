/**
 * Fetch Service — URL routing via Fetcher registry + storage orchestration.
 */

import { ARTICLE_STATUS, SOURCE_TYPE, detectSourceType } from "../lib/constants.js";
import { FetchError } from "../lib/errors.js";
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
import { CleanService } from "./clean-service.js";
import { triggerGitHubWorkflow } from "./github-actions.js";

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
    const result = await fetcher.fetch(url, this.env, this.log);

    const articleId = crypto.randomUUID();
    const sourceType = detectSourceType(url);

    // Store raw content
    const r2RawKey = await this.fileRepo.putRaw(articleId, result.html);

    // Determine if we can clean immediately (no code blocks, or already markdown from proxy)
    let r2MdKey: string | null = null;
    let status: string = ARTICLE_STATUS.RAW;

    if (true) {
      // For twitter/generic, content is already markdown from jina proxy
      // For weixin/feishu, use turndown to convert HTML → Markdown (now handles code blocks too)
      const isAlreadyMarkdown = sourceType === SOURCE_TYPE.TWITTER || sourceType === SOURCE_TYPE.WEB || result.isMarkdown;
      if (isAlreadyMarkdown) {
        r2MdKey = await this.fileRepo.putMarkdown(articleId, result.html);
      } else {
        const cleanService = new CleanService(this.env, this.log);
        // Store first, then clean (cleanArticle reads from R2)
        await this.articleRepo.create({
          id: articleId, url, title: result.title, author: result.author,
          source_type: sourceType, source_name: result.sourceName,
          status: ARTICLE_STATUS.RAW, tags: "[]", summary: "",
          r2_raw_key: r2RawKey, r2_md_key: null,
          fetched_at: new Date().toISOString(), published_at: null,
        });
        await cleanService.cleanArticle(articleId);
        this.log.info("fetch_done", { articleId, sourceType, status: ARTICLE_STATUS.CLEANED });
        return { articleId, title: result.title, sourceType, hasCodeBlocks: false, status: ARTICLE_STATUS.CLEANED };
      }
      status = ARTICLE_STATUS.CLEANED;
    }

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

    // Auto-trigger GitHub Actions for articles with code blocks
    if (result.hasCodeBlocks && r2RawKey) {
      const triggered = await triggerGitHubWorkflow(this.env, articleId, r2RawKey, this.log);
      if (triggered) {
        this.log.info("actions_triggered", { articleId });
      }
    }

    return { articleId, title: result.title, sourceType, hasCodeBlocks: result.hasCodeBlocks, status };
  }
}
