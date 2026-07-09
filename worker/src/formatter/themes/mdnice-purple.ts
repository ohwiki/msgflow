/**
 * Theme: Mdnice Purple (Mdnice紫色)
 * Purple left-bar headings on a subtle grid-paper background.
 * Best for: technical articles, tool reviews, tutorials.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta, InlineSegment } from "../types.js";

export class MdnicePurpleTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "mdnice-purple",
    name: "Mdnice紫色",
    description: "紫色左竖条+网格纸纹背景，适合技术文章和工具评测",
    scenes: ["技术", "工具评测", "教程"],
    defaultGrid: true,
  };

  readonly colors: ThemeColors = {
    primary: "#916DD5",
    primaryDark: "#6B4FA0",
    primaryLight: "#DEC6FB",
    primaryBg: "#F6EEFF",
    title: "#595959",
    body: "#595959",
    muted: "#9CA3AF",
    border: "#DEC6FB",
    underline: "border-bottom:2px solid #DEC6FB;font-weight:600;",
  };

  private readonly fontStack =
    "Optima,'Microsoft YaHei',PingFangSC-regular,serif";

  renderContainerOpen(grid?: boolean): string {
    return `<section style="margin:0;padding:0 10px;${grid ? this.gridBackground() : ""}font-family:${this.fontStack};font-size:16px;color:#000;line-height:1.5em;word-break:break-word;">`;
  }

  protected gridBackground(): string {
    return `background-image:linear-gradient(90deg,rgba(50,0,0,0.05) 0%,rgba(0,0,0,0) 6.76%),linear-gradient(360deg,rgba(50,0,0,0.05) 0%,rgba(249,247,252,0) 9.46%);background-size:20px 20px;`;
  }

  renderChapterHeading(num: string, englishTag: string, title: string, isFirst: boolean): string {
    const mt = isFirst ? "16px" : "30px";
    const tag = englishTag
      ? `<span leaf=""> · ${this.escapeHtml(englishTag)}</span>`
      : "";
    return `<h2 style="margin-top:${mt};margin-bottom:15px;">
  <span data-fs="h2" style="font-size:18px;color:${this.colors.title};line-height:1.8em;padding-left:10px;border-left:5px solid ${this.colors.primaryLight};display:block;font-weight:bold;"><span leaf="">${this.escapeHtml(num)}. ${this.escapeHtml(title)}</span>${tag}</span>
</h2>`;
  }

  renderSubHeading(text: string): string {
    return `<h3 style="margin-top:24px;margin-bottom:12px;">
  <span data-fs="h3" style="font-size:16px;color:${this.colors.title};line-height:1.8em;padding-left:8px;border-left:4px solid ${this.colors.primaryLight};display:block;font-weight:bold;"><span leaf="">${this.escapeHtml(text)}</span></span>
</h3>`;
  }

  renderDivider(): string {
    return `<hr style="margin:10px 0;border-top:2px solid #D9B8FA;border-bottom:none;border-left:none;border-right:none;height:1px;">`;
  }

  renderParagraph(segments: readonly InlineSegment[]): string {
    const inner = segments.map((seg) => this.renderSegment(seg)).join("");
    return `<p data-fs="body" style="color:${this.colors.body};font-size:15px;line-height:1.8em;letter-spacing:0.02em;text-align:left;margin:0;padding:8px 0;">${inner}</p>`;
  }

  renderBlockquote(segments: readonly InlineSegment[]): string {
    const inner = segments.map((seg) => this.renderSegment(seg)).join("");
    return `<blockquote style="margin:15px 0;padding:10px 16px;border-left:4px solid ${this.colors.primaryLight};background:${this.colors.primaryBg};">
  <p style="color:${this.colors.body};font-size:15px;line-height:1.8em;letter-spacing:0.02em;margin:0;">${inner}</p>
</blockquote>`;
  }

  renderInlineCode(text: string): string {
    return `<code style="color:${this.colors.primary};font-size:14px;background:rgba(27,31,35,0.05);padding:2px 4px;border-radius:4px;font-family:'Operator Mono',Consolas,Monaco,Menlo,monospace;word-break:break-all;"><span leaf="">${this.escapeHtml(text)}</span></code>`;
  }

  renderCodeBlock(lang: string, code: string): string {
    const lines = code.split("\n").map(
      (line) => `<p style="margin:0;font-family:'Operator Mono',Consolas,Monaco,Menlo,monospace;font-size:14px;line-height:1.6em;color:#595959;"><span leaf="">${this.escapeHtml(line).replace(/ /g, "　")}</span></p>`
    );
    return `<section style="margin:15px 0;padding:16px;border-radius:4px;background:${this.colors.primaryBg};border:1px solid ${this.colors.primaryLight};overflow-x:auto;">${lines.join("\n")}</section>`;
  }

  renderList(items: readonly InlineSegment[][], ordered: boolean): string {
    const listStyle = ordered ? "decimal" : "circle";
    const listItems = items.map((segs) => {
      const inner = segs.map((s) => this.renderSegment(s)).join("");
      return `<li><section style="margin:5px 0;color:${this.colors.body};font-size:14px;line-height:1.8em;">${inner}</section></li>`;
    });
    const tag = ordered ? "ol" : "ul";
    return `<${tag} style="list-style-type:${listStyle};margin:8px 0;padding-left:25px;">${listItems.join("\n")}</${tag}>`;
  }

  renderReferences(links: readonly { title: string; url: string }[]): string {
    const items = links.map(
      (l, i) => `<span style="display:flex;font-size:14px;line-height:1.8em;">
    <span style="color:rgba(89,89,89,0.6);width:10%;font-size:80%;"><span leaf="">[${i + 1}] </span></span>
    <p style="color:${this.colors.body};font-weight:bold;display:inline;word-break:break-all;flex:1;margin:0;"><span leaf="">${this.escapeHtml(l.title)}: </span><em style="font-style:normal;font-weight:normal;"><span leaf="">${this.escapeHtml(l.url)}</span></em></p>
  </span>`
    );
    return `<section style="margin-top:30px;margin-bottom:15px;border-bottom:1px solid rgba(222,198,251,0.4);">
  <span style="display:block;color:#000;font-size:18px;line-height:1.5em;text-align:center;font-weight:bold;"><span leaf="">Reference</span></span>
</section>
<section style="margin:0;padding:20px;border:1px solid ${this.colors.primaryLight};border-radius:4px;background:${this.colors.primaryBg};">
  ${items.join("\n  ")}
</section>`;
  }

  renderBlockquoteBox(text: string): string {
    return `  <section style="margin:15px 0;padding:10px 16px;border-left:4px solid ${this.colors.primaryLight};background:${this.colors.primaryBg};">
    <p style="color:${this.colors.body};font-size:15px;line-height:1.8em;letter-spacing:0.02em;margin:0;">
      <span leaf="">${this.escapeHtml(text)}</span>
    </p>
  </section>`;
  }
}
