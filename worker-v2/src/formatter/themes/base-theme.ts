/**
 * GZH Formatter — Theme base class.
 *
 * Provides shared rendering logic; subclasses override colors and metadata.
 * Each theme encapsulates WeChat-compatible inline-style HTML templates.
 */

import type { ITheme, ThemeColors, ThemeMeta, InlineSegment } from "../types.js";

export abstract class BaseTheme implements ITheme {
  abstract readonly meta: ThemeMeta;
  abstract readonly colors: ThemeColors;

  renderContainerOpen(): string {
    return `<section style="max-width:677px;margin:0 auto;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:${this.colors.body};line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;">`;
  }

  renderContainerClose(): string {
    return "</section>";
  }

  renderLeadQuote(quote: string, author?: string): string {
    const authorLine = author
      ? `<p style="text-align:right;font-size:12px;color:${this.colors.muted};margin:8px 0 0;letter-spacing:1px;"><span leaf="">—— ${author}</span></p>`
      : "";
    return `<section style="margin:10px 10px 32px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px -4px ${this.hexToRgba(this.colors.primary, 0.15)};padding:28px 24px 22px;overflow:hidden;">
  <p style="font-size:42px;color:${this.colors.primary};font-weight:900;margin:0;line-height:0.6;"><span leaf="">"</span></p>
  <p style="font-size:16px;font-weight:800;color:${this.colors.title};margin:12px 0 8px;line-height:1.75;padding-left:4px;"><span leaf="">${this.escapeHtml(quote)}</span></p>
  ${authorLine}
</section>`;
  }

  renderHighlights(points: readonly string[]): string {
    const cards = points.slice(0, 3).map((p, i) => {
      const num = String(i + 1).padStart(2, "0");
      return `<section style="flex:1;background:${this.colors.primaryBg};border-radius:10px;padding:16px 12px;${i < 2 ? "margin-right:8px;" : ""}text-align:center;border:1px solid ${this.colors.primaryLight};">
      <p style="display:inline-block;background:${this.colors.primary};color:#FFFFFF;font-size:12px;font-weight:800;padding:2px 10px;border-radius:4px;margin:0 0 8px;"><span leaf="">${num}</span></p>
      <p style="font-size:13px;font-weight:700;color:${this.colors.title};margin:0;"><span leaf="">${this.escapeHtml(p)}</span></p>
    </section>`;
    });
    return `<section style="padding:0 10px 32px;">
  <p style="font-size:14px;color:${this.colors.muted};margin:0 0 14px;letter-spacing:1px;"><span leaf="">📌 本文看点</span></p>
  <section style="display:flex;justify-content:space-between;">${cards.join("\n")}</section>
</section>`;
  }

  renderDivider(): string {
    return `<section style="padding:0 10px;">
  <section style="height:1px;background:linear-gradient(to right,transparent,${this.colors.primaryLight},${this.colors.primary},${this.colors.primaryLight},transparent);margin:0;"><span leaf=""><br></span></section>
</section>`;
  }

  renderChapterHeading(num: string, englishTag: string, title: string, isFirst: boolean): string {
    const mt = isFirst ? "16px" : "48px";
    return `<section style="margin-top:${mt};margin-bottom:28px;padding:0 10px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:3px solid ${this.colors.primary};">
    <section style="display:flex;align-items:center;">
      <span style="display:inline-block;background:${this.colors.primary};color:#FFFFFF;font-size:18px;font-weight:900;padding:4px 14px;border-radius:6px;margin-right:14px;line-height:1.3;"><span leaf="">${num}</span></span>
      <section>
        <p style="font-size:10px;color:${this.colors.primary};font-weight:700;letter-spacing:3px;margin:0 0 2px;text-transform:uppercase;"><span leaf="">${englishTag}</span></p>
        <h3 data-fs="h2" style="font-size:18px;font-weight:800;color:${this.colors.title};margin:0;letter-spacing:0.5px;"><span leaf="">${this.escapeHtml(title)}</span></h3>
      </section>
    </section>
  </section>`;
  }

  renderSubHeading(text: string): string {
    return `<p data-fs="h3" style="font-size:15px;font-weight:800;color:${this.colors.title};margin:28px 0 14px;padding-left:10px;border-left:3px solid ${this.colors.primary};line-height:1.4;"><span leaf="">${this.escapeHtml(text)}</span></p>`;
  }

  renderParagraph(segments: readonly InlineSegment[]): string {
    const inner = segments.map((seg) => this.renderSegment(seg)).join("");
    return `<p data-fs="body" style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:justify;">${inner}</p>`;
  }

  renderBlockquote(segments: readonly InlineSegment[]): string {
    const inner = segments.map((seg) => this.renderSegment(seg)).join("");
    return `<section style="background:${this.colors.primaryBg};border-radius:0 10px 10px 0;border-left:4px solid ${this.colors.primary};padding:18px 22px;margin-bottom:24px;">
  <p style="font-size:16px;font-weight:800;color:${this.colors.primaryDark};margin:0;line-height:1.8;">${inner}</p>
</section>`;
  }

  renderCodeBlock(lang: string, code: string): string {
    const lines = code.split("\n").map(
      (line) => `<p style="margin:0;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:13px;line-height:1.6;color:#E2E8F0;"><span leaf="">${this.escapeHtml(line).replace(/ /g, "\u3000").replace(/^ /, "\u3000")}</span></p>`
    );
    const langLabel = lang
      ? `<span style="margin-left:12px;font-size:12px;color:#64748B;font-family:Consolas,Monaco,monospace;letter-spacing:1px;"><span leaf="">${lang}</span></span>`
      : "";
    return `<section style="margin:0 0 20px;border-radius:8px;overflow:hidden;background:#1E293B;box-shadow:0 4px 16px -8px rgba(15,23,42,0.4);">
  <section style="display:flex;align-items:center;padding:9px 14px;background:#0F172A;">
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FF5F56;margin-right:7px;font-size:0;line-height:0;overflow:hidden;">.</span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#FFBD2E;margin-right:7px;font-size:0;line-height:0;overflow:hidden;">.</span>
    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#27C93F;font-size:0;line-height:0;overflow:hidden;">.</span>
    ${langLabel}
  </section>
  <section style="padding:11px 14px;">${lines.join("\n")}</section>
</section>`;
  }

  renderInlineCode(text: string): string {
    return `<span style="background:#F1F5F9;color:${this.colors.primary};padding:1px 6px;border-radius:4px;font-family:'SF Mono',Consolas,Monaco,monospace;font-size:14px;"><span leaf="">${this.escapeHtml(text)}</span></span>`;
  }

  renderImage(src: string, alt: string): string {
    const caption = alt
      ? `<p style="font-size:12px;color:${this.colors.muted};text-align:center;margin:0 0 24px;"><span leaf="">— ${this.escapeHtml(alt)}</span></p>`
      : "";
    return `<section style="background:#FFF;border-radius:12px;padding:6px;border:1px solid ${this.colors.border};box-shadow:0 4px 12px -2px rgba(0,0,0,0.08);margin-bottom:8px;">
  <section style="margin:0;border-radius:8px;overflow:hidden;">
    <span leaf=""><img src="${src}" style="max-width:100%;height:auto;display:block;margin:0 auto;"></span>
  </section>
</section>
${caption}`;
  }

  renderList(items: readonly InlineSegment[][], ordered: boolean): string {
    const listItems = items.map((segs, i) => {
      const inner = segs.map((s) => this.renderSegment(s)).join("");
      const bullet = ordered
        ? `<span style="color:${this.colors.primary};font-weight:700;">${i + 1}. </span>`
        : `<span style="color:${this.colors.primary};font-weight:700;">• </span>`;
      return `<p style="margin-bottom:10px;font-size:15px;line-height:1.8;">${bullet}${inner}</p>`;
    });
    return `<section style="padding:0 10px 16px;">${listItems.join("\n")}</section>`;
  }

  renderEnding(quote: string): string {
    return `${this.renderChapterHeading("∞", "THE END", "写在最后", false)}
${this.renderBlockquote([{ text: quote, marks: [] }])}`;
  }

  renderSignature(text: string, author: string): string {
    return `<p style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:justify;"><span leaf="">${this.escapeHtml(text)}</span></p>
<p style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:right;color:${this.colors.muted};"><span leaf="">— ${this.escapeHtml(author)}</span></p>`;
  }

  renderReferences(links: readonly { title: string; url: string }[]): string {
    const items = links.map(
      (l) => `<p style="font-size:12px;color:${this.colors.muted};margin:0 0 4px;line-height:1.6;"><span leaf="">• ${this.escapeHtml(l.title)}</span></p>`
    );
    return `<section style="padding:24px 10px 10px;">
  <p style="font-size:12px;color:${this.colors.muted};margin:0 0 8px;letter-spacing:1px;"><span leaf="">📎 参考资料</span></p>
  ${items.join("\n")}
</section>`;
  }

  // ─── Protected helpers ───────────────────────────────────────────────────

  protected renderSegment(seg: InlineSegment): string {
    let html = this.escapeHtml(seg.text);

    if (seg.marks.includes("bold")) {
      html = `<strong><span leaf="">${html}</span></strong>`;
    } else if (seg.marks.includes("inlineCode")) {
      html = this.renderInlineCode(seg.text);
    } else if (seg.marks.includes("highlight")) {
      html = `<span style="background:linear-gradient(180deg,transparent 60%,${this.colors.primaryLight} 60%);font-weight:700;color:${this.colors.title};"><span leaf="">${html}</span></span>`;
    } else if (seg.marks.includes("underline")) {
      html = `<span style="${this.colors.underline}"><span leaf="">${html}</span></span>`;
    } else if (seg.marks.includes("strikethrough")) {
      html = `<span style="text-decoration:line-through;"><span leaf="">${html}</span></span>`;
    } else {
      html = `<span leaf="">${html}</span>`;
    }

    return html;
  }

  protected escapeHtml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  protected hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ─── AI-Enhanced Rendering (default implementations) ───────────────────

  renderLeadQuoteMarked(segments: readonly { t: string; m: string }[]): string {
    const inner = segments.map(s => {
      if (s.m === 'h') {
        return `<span style="background:${this.colors.primary};color:#FFFFFF;padding:2px 8px;border-radius:4px;"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
      }
      return `<span leaf="">${this.escapeHtml(s.t)}</span>`;
    }).join('\n    ');

    return `<section style="margin:10px 10px 32px;background:#ffffff;border-radius:12px;box-shadow:0 4px 24px -4px ${this.hexToRgba(this.colors.primary, 0.15)};padding:28px 24px 22px;overflow:hidden;">
  <p style="font-size:42px;color:${this.colors.primary};font-weight:900;margin:0;line-height:0.6;">
    <span leaf="">"</span>
  </p>
  <p style="font-size:16px;font-weight:800;color:${this.colors.title};margin:12px 0 8px;line-height:1.75;padding-left:4px;">
    ${inner}
  </p>
</section>`;
  }

  renderMarkedParagraph(segments: readonly { t: string; m: string }[]): string {
    const inner = segments.map(s => {
      switch (s.m) {
        case 'u':
          return `<span style="${this.colors.underline}"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        case 'h':
          return `<span style="background:${this.colors.primaryBg};color:${this.colors.primaryDark};padding:2px 6px;border-radius:3px;font-weight:700;"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        case 'b':
          return `<span style="color:${this.colors.primary};font-weight:700;"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        default:
          return `<span leaf="">${this.escapeHtml(s.t)}</span>`;
      }
    }).join('\n    ');

    return `  <p data-fs="body" style="margin-bottom:20px;font-size:15px;line-height:1.8;text-align:justify;">
    ${inner}
  </p>`;
  }

  renderBlockquoteBox(text: string): string {
    return `  <section style="background:${this.colors.primaryBg};border-radius:0 10px 10px 0;border-left:4px solid ${this.colors.primary};padding:18px 22px;margin-bottom:24px;">
    <p style="font-size:16px;font-weight:800;color:${this.colors.primaryDark};margin:0;line-height:1.8;">
      <span leaf="">${this.escapeHtml(text)}</span>
    </p>
  </section>`;
  }
}
