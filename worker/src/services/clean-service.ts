/**
 * Clean Service — convert raw HTML to Markdown using node-html-markdown.
 * (Pure string parsing, no DOM dependency, fully Workers-compatible.)
 */

import { NodeHtmlMarkdown } from "node-html-markdown";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";
import { ARTICLE_STATUS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

const nhm = new NodeHtmlMarkdown({
  bulletMarker: "-",
  codeBlockStyle: "fenced",
});

export class CleanService {
  private articleRepo: ArticleRepository;
  private fileRepo: FileRepository;

  constructor(env: Env, private log: Logger) {
    this.articleRepo = new ArticleRepository(env.DB);
    this.fileRepo = new FileRepository(env.R2);
  }

  /** Clean a single article: read raw HTML from R2, convert to Markdown, store back. */
  async cleanArticle(articleId: string): Promise<boolean> {
    const article = await this.articleRepo.getById(articleId);
    if (!article || !article.r2_raw_key) return false;
    if (article.status !== ARTICLE_STATUS.RAW) return false;

    const rawHtml = await this.fileRepo.get(article.r2_raw_key);
    if (!rawHtml) return false;

    this.log.info("clean_start", { articleId });

    // Fix WeChat lazy-load images before conversion
    const fixedHtml = rawHtml.replace(/(<img[^>]*?)data-src="([^"]+)"/g, '$1src="$2"');

    const markdown = nhm.translate(fixedHtml);

    // Store cleaned markdown
    const r2MdKey = await this.fileRepo.putMarkdown(articleId, markdown);
    await this.articleRepo.updateMarkdown(articleId, r2MdKey);

    this.log.info("clean_done", { articleId, chars: String(markdown.length) });
    return true;
  }
}
