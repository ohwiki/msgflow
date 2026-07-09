/**
 * GZH Formatter — Renderer.
 *
 * Implements IRenderer interface.
 * When AI analysis is provided, uses segment-level marks to render:
 * - underline (u): colored bottom-border on key phrases
 * - highlight (h): colored background tag on important terms
 * - bold (b): primary-color bold text
 * - blockquote: left-border quote block for citations
 *
 * All text wrapped in <span leaf=""> for WeChat compatibility.
 */

import type {
  IRenderer,
  ITheme,
  ParsedArticle,
  RenderOptions,
  RenderResult,
  RenderStats,
  AstNode,
} from "./types.js";
import type { ContentAnalysis } from "./content-analysis.js";
import { getTheme } from "./themes/registry.js";

export class GzhRenderer implements IRenderer {
  render(article: ParsedArticle, options: RenderOptions): RenderResult {
    const theme = getTheme(options.themeId);
    const analysis = options.analysis as ContentAnalysis | null | undefined;
    const autoNum = options.autoNumbering ?? true;
    const parts: string[] = [];
    const stats: Writeable<RenderStats> = {
      sections: 0,
      paragraphs: 0,
      keywords: 0,
      codeBlocks: 0,
      images: 0,
    };

    const colors = theme.colors;

    // Global container open
    const grid = options.grid ?? theme.meta.defaultGrid ?? false;
    parts.push(theme.renderContainerOpen(grid));

    // Article title (optional — WeChat has its own title)
    if (options.showTitle && article.title && article.title !== '无标题') {
      parts.push(`<h1 data-fs="title" style="font-size:22px;font-weight:900;color:${colors.title};text-align:center;margin:20px 10px 24px;line-height:1.4;"><span leaf="">${article.title}</span></h1>`);
    }

    // Lead quote card — with highlighted keywords if AI available
    if (analysis?.leadQuoteMarked) {
      parts.push(theme.renderLeadQuoteMarked(analysis.leadQuoteMarked.segments));
    } else if (article.leadQuote) {
      parts.push(theme.renderLeadQuote(article.leadQuote));
    }

    // Highlights panel
    const highlights = analysis?.highlights ?? this.fallbackHighlights(article);
    if (highlights.length >= 3) {
      parts.push(theme.renderHighlights(highlights.slice(0, 3)));
    }

    // Sections
    const markedSections = analysis?.markedSections;
    let sectionIndex = 0;
    for (let si = 0; si < article.sections.length; si++) {
      const section = article.sections[si]!;
      const sectionMark = markedSections?.[si];

      if (section.heading) {
        sectionIndex++;
        const headedSections = article.sections.filter((s) => s.heading);
        const isLast = sectionIndex === headedSections.length;
        const num = autoNum
          ? isLast && this.isEndingSection(section.heading)
            ? "∞"
            : String(sectionIndex).padStart(2, "0")
          : String(sectionIndex).padStart(2, "0");

        const englishTag = sectionMark?.englishTag ?? section.englishTag;

        parts.push(theme.renderDivider());
        parts.push(
          theme.renderChapterHeading(num, englishTag, section.heading, sectionIndex === 1)
        );
        stats.sections++;
      }

      // Render section body with AI marks
      let paragraphIndex = 0;
      for (const node of section.nodes) {
        if (node.type === "paragraph") {
          const markedParagraph = sectionMark?.paragraphs?.[paragraphIndex];
          const isBlockquote = sectionMark?.blockquotes?.includes(paragraphIndex) ?? false;

          if (isBlockquote && markedParagraph) {
            // Render as left-border quote block
            const text = markedParagraph.map(s => s.t).join('');
            parts.push(theme.renderBlockquoteBox(text));
          } else if (markedParagraph) {
            // Render with segment marks
            parts.push(theme.renderMarkedParagraph(markedParagraph));
            stats.keywords += markedParagraph.filter(s => s.m !== 'n').length;
          } else {
            // Fallback: plain rendering
            parts.push(theme.renderParagraph(node.segments));
          }
          stats.paragraphs++;
          paragraphIndex++;
        } else if (node.type === "blockquote") {
          const text = node.segments.map(s => s.text).join('');
          parts.push(theme.renderBlockquoteBox(text));
        } else {
          const rendered = this.renderNode(node, theme, stats);
          if (rendered) parts.push(rendered);
        }
      }

      // Ending quote
      if (section.heading && this.isEndingSection(section.heading) && analysis?.endingQuote) {
        parts.push(theme.renderEnding(analysis.endingQuote));
      }
    }

    // Signature (optional)
    if (options.guide || options.signature) {
      const sigParts: string[] = [];
      sigParts.push('<section style="padding:0 10px;margin-top:32px;margin-bottom:20px;">');
      if (options.guide) {
        sigParts.push('  <p style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:justify;">');
        sigParts.push('    <span leaf="">如果这些文字刚好落进你的片刻心绪，欢迎转给需要的人。</span>');
        sigParts.push('  </p>');
      }
      if (options.signature) {
        sigParts.push(`  <p style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:right;color:${colors.muted};">`);
        sigParts.push('    <span leaf="">— AI赋能说</span>');
        sigParts.push('  </p>');
      }
      sigParts.push('</section>');
      parts.push(sigParts.join('\n'));
    }

    // Global container close
    parts.push(theme.renderContainerClose());

    let html = parts.join("\n");

    // Apply custom font size and line height
    const fs = options.fontSize ?? 15;
    const lh = options.lineHeight ?? 1.8;
    if (fs !== 15) {
      html = html.replace(/font-size:15px/g, `font-size:${fs}px`);
    }
    if (lh !== 1.8) {
      html = html.replace(/line-height:1\.8/g, `line-height:${lh}`);
    }

    return { html, stats };
  }

  // ─── AI-Enhanced Rendering ─────────────────────────────────────────────

  // ─── Basic Node Rendering ──────────────────────────────────────────────

  private renderNode(node: AstNode, theme: ITheme, stats: Writeable<RenderStats>): string | null {
    switch (node.type) {
      case "paragraph": {
        stats.paragraphs++;
        return theme.renderParagraph(node.segments);
      }
      case "heading": {
        if (node.depth === 3) return theme.renderSubHeading(node.text);
        return null;
      }
      case "blockquote": {
        return theme.renderBlockquote(node.segments);
      }
      case "code": {
        stats.codeBlocks++;
        return theme.renderCodeBlock(node.lang, node.content);
      }
      case "image": {
        stats.images++;
        return theme.renderImage(node.src, node.alt);
      }
      case "list": {
        const items = node.items.map((item) => [...item.segments]);
        return theme.renderList(items, node.ordered);
      }
      case "hr": {
        return theme.renderDivider();
      }
      case "mermaid": {
        // Output mermaid code block for client-side rendering (no HTML escaping)
        return `<section style="margin:20px 0;text-align:center;"><pre class="mermaid" style="background:transparent;text-align:left;">${node.content}</pre></section>`;
      }
      default:
        return null;
    }
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private fallbackHighlights(article: ParsedArticle): readonly string[] {
    return article.sections
      .filter((s) => s.heading)
      .map((s) => s.heading)
      .slice(0, 3);
  }

  private isEndingSection(heading: string): boolean {
    const endingKeywords = ["结语", "总结", "写在最后", "最后", "结尾", "尾声"];
    return endingKeywords.some((kw) => heading.includes(kw));
  }
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] };
