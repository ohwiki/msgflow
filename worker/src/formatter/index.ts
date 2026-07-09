/**
 * GZH Formatter — Facade.
 *
 * Top-level orchestrator: parse → [AI analyze] → render → validate.
 */

import type { IFormatter, FormatResult, ThemeMeta, RenderOptions } from "./types.js";
import type { ContentAnalysis } from "./content-analysis.js";
import type { IKVStore, IAnalyzerLogger } from "./analyzer.js";
import { MarkdownParser } from "./parser.js";
import { GzhRenderer } from "./renderer.js";
import { GzhValidator } from "./validator.js";
import { ContentAnalyzer } from "./analyzer.js";
import { getTheme, listThemes, getDefaultThemeId } from "./themes/registry.js";

export interface FormatWithAIOptions {
  readonly markdown: string;
  readonly themeId?: string;
  readonly kv: IKVStore;
  readonly logger?: IAnalyzerLogger;
  readonly guide?: boolean;
  readonly signature?: boolean;
  readonly footnotes?: boolean;
  readonly showTitle?: boolean;
  readonly fontSize?: number;
  readonly lineHeight?: number;
  readonly grid?: boolean;
}

export interface AIFormatResult extends FormatResult {
  readonly aiAnalysis: ContentAnalysis | null;
  readonly aiEnhanced: boolean;
}

export class GzhFormatter implements IFormatter {
  private readonly parser = new MarkdownParser();
  private readonly renderer = new GzhRenderer();
  private readonly validator = new GzhValidator();

  async format(markdown: string, themeId?: string, opts?: { guide?: boolean; signature?: boolean; footnotes?: boolean; showTitle?: boolean; fontSize?: number; lineHeight?: number; grid?: boolean }): Promise<FormatResult> {
    const resolvedThemeId = themeId || getDefaultThemeId();
    const theme = getTheme(resolvedThemeId);

    const article = this.parser.parse(markdown);
    const options: RenderOptions = { themeId: resolvedThemeId, autoNumbering: true, guide: opts?.guide, signature: opts?.signature, footnotes: opts?.footnotes, showTitle: opts?.showTitle, fontSize: opts?.fontSize, lineHeight: opts?.lineHeight, grid: opts?.grid };
    let { html, stats } = this.renderer.render(article, options);

    // Convert links to footnotes if enabled
    if (opts?.footnotes) {
      html = this.convertLinksToFootnotes(markdown, html);
    }

    const validation = this.validator.validate(html);

    return { html, validation, stats, themeName: theme.meta.name };
  }

  async formatWithAI(options: FormatWithAIOptions): Promise<AIFormatResult> {
    const { markdown, kv, logger } = options;
    const resolvedThemeId = options.themeId || getDefaultThemeId();
    const theme = getTheme(resolvedThemeId);

    const article = this.parser.parse(markdown);

    const analyzer = new ContentAnalyzer({ kv, logger });
    const analysis = await analyzer.analyze(markdown);

    const renderOptions: RenderOptions = {
      themeId: resolvedThemeId,
      autoNumbering: true,
      analysis,
      guide: options.guide,
      signature: options.signature,
      footnotes: options.footnotes,
      showTitle: options.showTitle,
      fontSize: options.fontSize,
      lineHeight: options.lineHeight,
      grid: options.grid,
    };
    let { html, stats } = this.renderer.render(article, renderOptions);

    // Convert links to footnotes if enabled
    if (options.footnotes) {
      html = this.convertLinksToFootnotes(markdown, html);
    }

    const validation = this.validator.validate(html);

    return {
      html,
      validation,
      stats,
      themeName: theme.meta.name,
      aiAnalysis: analysis,
      aiEnhanced: analysis !== null,
    };
  }

  getThemes(): readonly ThemeMeta[] {
    return listThemes();
  }

  /**
   * Convert inline links to footnote references for WeChat compatibility.
   * Adds superscript [1] after link text in body, and footnote list at end.
   */
  private convertLinksToFootnotes(markdown: string, html: string): string {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: Array<{ text: string; url: string }> = [];
    let match;
    while ((match = linkRegex.exec(markdown)) !== null) {
      if (!links.some(l => l.url === match![2])) {
        links.push({ text: match[1]!, url: match[2]! });
      }
    }

    if (links.length === 0) return html;

    // Add superscript numbers after link text in HTML
    let result = html;
    for (let i = 0; i < links.length; i++) {
      const linkText = links[i]!.text;
      const escaped = linkText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match the link text inside <span leaf="">...</span> and append superscript
      const sup = `<sup style="font-size:10px;color:#7C3AED;font-weight:700;margin-left:1px;">[${i + 1}]</sup>`;
      // Only replace first occurrence
      const textRegex = new RegExp(`(<span leaf="">)([^<]*?)(${escaped})([^<]*?</span>)`);
      result = result.replace(textRegex, `$1$2$3${sup}$4`);
    }

    // Build footnote section
    const footnoteHtml = `<section style="padding:24px 10px 10px;">
  <p style="font-size:12px;color:#9CA3AF;margin:0 0 8px;letter-spacing:1px;">
    <span leaf="">📎 参考链接</span>
  </p>
${links.map((l, i) => `  <p style="font-size:12px;color:#9CA3AF;margin:0 0 4px;line-height:1.6;word-break:break-all;">
    <span leaf=""><sup style="color:#7C3AED;font-weight:700;">[${i + 1}]</sup> ${l.text}: ${l.url}</span>
  </p>`).join('\n')}
</section>`;

    // Insert before the closing </section> (global container close)
    const lastClose = result.lastIndexOf('</section>');
    if (lastClose === -1) return result + footnoteHtml;
    return result.slice(0, lastClose) + footnoteHtml + '\n' + result.slice(lastClose);
  }
}

export { ContentAnalyzer } from "./analyzer.js";
export type { ContentAnalysis } from "./content-analysis.js";
