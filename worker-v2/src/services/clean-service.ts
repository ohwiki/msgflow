/**
 * Clean Service — convert raw HTML to Markdown using Turndown.
 * Used for articles without code blocks (lightweight, runs in Worker).
 */

import TurndownService from "turndown";
import { ArticleRepository } from "../repositories/article-repository.js";
import { FileRepository } from "../repositories/file-repository.js";
import { ARTICLE_STATUS } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export class CleanService {
  private articleRepo: ArticleRepository;
  private fileRepo: FileRepository;
  private turndown: TurndownService;

  constructor(env: Env, private log: Logger) {
    this.articleRepo = new ArticleRepository(env.DB);
    this.fileRepo = new FileRepository(env.R2);
    this.turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });

    // Fix image lazy-load (data-src → src)
    this.turndown.addRule("lazyImages", {
      filter: (node: any) => node.nodeName === "IMG" && !!node.getAttribute("data-src"),
      replacement: (_content: string, node: any) => {
        const src = node.getAttribute("data-src") ?? "";
        const alt = node.getAttribute("alt") ?? "";
        return src ? `![${alt}](${src})` : "";
      },
    });

    // Remove empty links and spans
    this.turndown.addRule("cleanEmpty", {
      filter: (node: any) =>
        (node.nodeName === "SPAN" || node.nodeName === "A") && !node.textContent?.trim(),
      replacement: () => "",
    });
  }

  /** Clean a single article: read raw HTML from R2, convert to Markdown, store back. */
  async cleanArticle(articleId: string): Promise<boolean> {
    const article = await this.articleRepo.getById(articleId);
    if (!article || !article.r2_raw_key) return false;
    if (article.status !== ARTICLE_STATUS.RAW) return false;

    const rawHtml = await this.fileRepo.get(article.r2_raw_key);
    if (!rawHtml) return false;

    this.log.info("clean_start", { articleId });

    // Convert HTML to Markdown
    const markdown = this.turndown.turndown(rawHtml);

    // Store cleaned markdown
    const r2MdKey = await this.fileRepo.putMarkdown(articleId, markdown);
    await this.articleRepo.updateMarkdown(articleId, r2MdKey);

    this.log.info("clean_done", { articleId, chars: String(markdown.length) });
    return true;
  }
}
