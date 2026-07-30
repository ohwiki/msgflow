/**
 * Theme: Magazine Emerald (摸鱼杂志绿)
 * Editorial magazine layout on the emerald palette — cover card, scrolling
 * table-of-contents, PART-numbered chapter headings, yellow-marker highlights.
 * Best for: reviews, tool round-ups, opinion long-reads.
 */

import { BaseTheme } from "./base-theme.js";
import type {
  ThemeColors,
  ThemeMeta,
  InlineSegment,
  CoverOptions,
  TocEntry,
} from "../types.js";

export class MagazineEmeraldTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "magazine-emerald",
    name: "摸鱼杂志绿",
    description: "杂志封面卡+目录滑动条+PART编号大标题+荧光笔高亮，适合测评、工具盘点、观点长文",
    scenes: ["测评", "工具盘点", "观点长文", "深度"],
  };

  readonly colors: ThemeColors = {
    primary: "#059669",
    primaryDark: "#065F46",
    primaryLight: "#A7F3D0",
    primaryBg: "#ECFDF5",
    title: "#111827",
    body: "#374151",
    muted: "#9CA3AF",
    border: "#E5E7EB",
    underline: "border-bottom:2px solid #A7F3D0;font-weight:600;",
  };

  /** Accent gradient endpoints and the marker-highlight yellow. */
  private readonly gradientEnd = "#10B981";
  private readonly gradientEndLight = "#34D399";
  private readonly marker = "#FDE68A";
  private readonly faint = "#D1D5DB";

  private readonly typeTag: Record<CoverOptions["articleType"], string> = {
    tutorial: "TUTORIAL · 教程",
    review: "REVIEW · 测评",
    opinion: "OPINION · 观点",
    story: "STORY · 故事",
    data: "DATA · 数据",
    essay: "ESSAY · 随笔",
  };

  renderContainerOpen(): string {
    return `<section style="max-width:677px;margin:0 auto;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;color:${this.colors.body};line-height:1.75;letter-spacing:0.5px;overflow-x:hidden;">`;
  }

  renderCover(opts: CoverOptions): string {
    if (!opts.title) return "";
    const tag = this.typeTag[opts.articleType] ?? "ARTICLE";
    const subtitle = opts.subtitle
      ? `<p style="font-size:13px;color:${this.colors.muted};margin:12px 0 0;line-height:1.7;letter-spacing:0.5px;"><span leaf="">${this.escapeHtml(opts.subtitle)}</span></p>`
      : "";
    return `<section style="margin:0 0 32px;border:1.5px solid ${this.hexToRgba(this.colors.primary, 0.15)};border-radius:20px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);">
  <section style="padding:32px 28px 28px;">
    <section style="display:flex;align-items:center;gap:8px;margin-bottom:28px;">
      <span style="font-size:11px;font-weight:700;letter-spacing:3px;color:${this.colors.primary};"><span leaf="">${this.escapeHtml(tag)}</span></span>
      <section style="flex:1;height:1px;overflow:hidden;background:linear-gradient(to right,${this.hexToRgba(this.colors.primary, 0.12)},transparent);"><span leaf=""><br></span></section>
    </section>
    <section>
      <p style="font-size:24px;font-weight:900;color:${this.colors.title};margin:0 0 12px;line-height:1.1;letter-spacing:-1px;"><span leaf="">${this.escapeHtml(opts.title)}</span></p>
      <section style="width:48px;height:3px;background:linear-gradient(to right,${this.colors.primary},${this.gradientEndLight});border-radius:2px;"><span leaf=""><br></span></section>
      ${subtitle}
    </section>
  </section>
  <section style="background:linear-gradient(135deg,${this.colors.primary},${this.gradientEnd});padding:12px 28px;">
    <p style="font-size:12px;color:rgba(255,255,255,0.9);margin:0;font-weight:600;letter-spacing:0.5px;"><span leaf="">${this.escapeHtml(tag)}</span></p>
  </section>
</section>`;
  }

  renderToc(entries: readonly TocEntry[]): string {
    const cards = entries.map((e, i) => {
      const first = i === 0;
      const bg = first
        ? `background:linear-gradient(135deg,${this.colors.primary},${this.gradientEnd});`
        : `background:#ffffff;border:1px solid ${this.colors.border};box-shadow:0 2px 6px rgba(0,0,0,0.04);`;
      const partColor = first ? "rgba(255,255,255,0.7)" : this.colors.muted;
      const headColor = first ? "#ffffff" : this.colors.title;
      const tagColor = first ? "rgba(255,255,255,0.7)" : this.colors.muted;
      const tag = e.englishTag
        ? `<p style="font-size:10px;color:${tagColor};margin:0;"><span leaf="">${this.escapeHtml(e.englishTag)}</span></p>`
        : "";
      return `<section style="display:inline-block;white-space:normal;vertical-align:top;width:110px;${bg}border-radius:12px;padding:12px;margin-right:8px;">
      <p style="font-size:9px;font-weight:700;color:${partColor};letter-spacing:1px;margin:0 0 5px;"><span leaf="">PART ${e.num}</span></p>
      <p style="font-size:13px;font-weight:800;color:${headColor};margin:0 0 3px;line-height:1.3;"><span leaf="">${this.escapeHtml(e.heading)}</span></p>
      ${tag}
    </section>`;
    });
    return `<section style="margin:0 0 32px;">
  <section style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
    <p style="font-size:10px;color:${this.colors.muted};margin:0;text-transform:uppercase;letter-spacing:2px;font-weight:600;"><span leaf="">📦 ${entries.length} Parts</span></p>
    <p style="font-size:10px;color:${this.colors.muted};margin:0;"><span leaf="">👉 滑动</span></p>
  </section>
  <section style="overflow-x:scroll;white-space:nowrap;padding-bottom:8px;">${cards.join("\n    ")}</section>
</section>`;
  }

  renderChapterHeading(num: string, englishTag: string, title: string, isFirst: boolean): string {
    const mt = isFirst ? "16px" : "48px";
    const tag = englishTag
      ? `<p style="margin:0;font-size:11px;font-weight:600;color:${this.colors.muted};letter-spacing:1.5px;"><span leaf="">${this.escapeHtml(englishTag)}</span></p>`
      : "";
    return `<section style="display:flex;align-items:center;gap:16px;margin-top:${mt};margin-bottom:24px;padding:0 10px;">
  <section style="text-align:center;flex-shrink:0;">
    <p style="margin:0;font-size:28px;font-weight:900;color:${this.colors.primary};line-height:1;letter-spacing:-2px;"><span leaf="">${this.escapeHtml(num)}</span></p>
    <p style="margin:0;font-size:8px;font-weight:700;color:${this.faint};letter-spacing:2px;"><span leaf="">PART</span></p>
  </section>
  <span style="width:1px;height:36px;background:${this.colors.border};flex-shrink:0;"><span leaf=""><br></span></span>
  <section>
    <h3 data-fs="h2" style="margin:0 0 1px;font-size:17px;font-weight:900;color:${this.colors.title};letter-spacing:0.3px;"><span leaf="">${this.escapeHtml(title)}</span></h3>
    ${tag}
  </section>
</section>`;
  }

  renderDivider(): string {
    return "";
  }

  renderEnding(quote: string): string {
    return `<section style="border:1px dashed ${this.colors.primaryLight};border-radius:8px;padding:14px 16px;margin:32px 20px;text-align:center;">
  <p style="margin:0 16px;line-height:1.6;"><span style="font-size:15px;color:${this.colors.primary};font-weight:bold;border-bottom:3px solid ${this.marker};padding-bottom:2px;"><span leaf="">${this.escapeHtml(quote)}</span></span></p>
</section>`;
  }

  protected renderSegment(seg: InlineSegment): string {
    const html = this.escapeHtml(seg.text);
    if (seg.marks.includes("bold")) {
      return `<strong style="color:${this.colors.primary};"><span leaf="">${html}</span></strong>`;
    }
    if (seg.marks.includes("inlineCode")) {
      return this.renderInlineCode(seg.text);
    }
    if (seg.marks.includes("highlight")) {
      return `<span style="background:linear-gradient(transparent 65%,${this.marker} 65%);padding:0 4px;"><span leaf="">${html}</span></span>`;
    }
    if (seg.marks.includes("underline")) {
      return `<span style="${this.colors.underline}"><span leaf="">${html}</span></span>`;
    }
    if (seg.marks.includes("strikethrough")) {
      return `<span style="text-decoration:line-through;"><span leaf="">${html}</span></span>`;
    }
    return `<span leaf="">${html}</span>`;
  }

  renderMarkedParagraph(segments: readonly { t: string; m: string }[]): string {
    const inner = segments.map((s) => {
      switch (s.m) {
        case "u":
          return `<span style="${this.colors.underline}"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        case "h":
          return `<span style="background:linear-gradient(transparent 65%,${this.marker} 65%);padding:0 4px;"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        case "b":
          return `<span style="color:${this.colors.primary};font-weight:700;"><span leaf="">${this.escapeHtml(s.t)}</span></span>`;
        default:
          return `<span leaf="">${this.escapeHtml(s.t)}</span>`;
      }
    }).join("");
    return `<p data-fs="body" style="margin:0 10px 20px;font-size:15px;line-height:1.8;text-align:justify;">${inner}</p>`;
  }
}
