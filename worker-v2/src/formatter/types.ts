/**
 * GZH Formatter — Core type definitions and interfaces.
 *
 * Design principles:
 * - Interface-first: all modules communicate through typed contracts
 * - Immutable data: parsed nodes and theme configs are readonly
 * - Discriminated unions: AST nodes use `type` as discriminant
 */

// ─── AST Node Types ──────────────────────────────────────────────────────────

/** Discriminated union of all Markdown AST node types */
export type AstNodeType =
  | "heading"
  | "paragraph"
  | "blockquote"
  | "code"
  | "image"
  | "list"
  | "listItem"
  | "hr"
  | "table"
  | "mermaid";

/** Inline mark types within a paragraph */
export type InlineMarkType =
  | "bold"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "inlineCode"
  | "link";

/** A single inline segment (text with optional marks) */
export interface InlineSegment {
  readonly text: string;
  readonly marks: readonly InlineMarkType[];
}

/** Base interface for all AST nodes */
interface BaseNode {
  readonly type: AstNodeType;
}

export interface HeadingNode extends BaseNode {
  readonly type: "heading";
  readonly depth: 1 | 2 | 3 | 4 | 5 | 6;
  readonly text: string;
  readonly segments: readonly InlineSegment[];
}

export interface ParagraphNode extends BaseNode {
  readonly type: "paragraph";
  readonly segments: readonly InlineSegment[];
  readonly raw: string;
}

export interface BlockquoteNode extends BaseNode {
  readonly type: "blockquote";
  readonly segments: readonly InlineSegment[];
  readonly raw: string;
}

export interface CodeNode extends BaseNode {
  readonly type: "code";
  readonly lang: string;
  readonly content: string;
}

export interface ImageNode extends BaseNode {
  readonly type: "image";
  readonly src: string;
  readonly alt: string;
}

export interface ListNode extends BaseNode {
  readonly type: "list";
  readonly ordered: boolean;
  readonly items: readonly ListItemNode[];
}

export interface ListItemNode extends BaseNode {
  readonly type: "listItem";
  readonly segments: readonly InlineSegment[];
}

export interface HrNode extends BaseNode {
  readonly type: "hr";
}

export interface TableNode extends BaseNode {
  readonly type: "table";
  readonly headers: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface MermaidNode extends BaseNode {
  readonly type: "mermaid";
  readonly content: string;
}

/** Union of all AST nodes */
export type AstNode =
  | HeadingNode
  | ParagraphNode
  | BlockquoteNode
  | CodeNode
  | ImageNode
  | ListNode
  | ListItemNode
  | HrNode
  | TableNode
  | MermaidNode;

// ─── Article Structure ───────────────────────────────────────────────────────

/** Article type determines component combination recipe */
export type ArticleType =
  | "tutorial"
  | "review"
  | "opinion"
  | "story"
  | "data"
  | "essay";

/** Parsed article structure */
export interface ParsedArticle {
  readonly title: string;
  readonly leadQuote: string | null;
  readonly sections: readonly ArticleSection[];
  readonly articleType: ArticleType;
}

/** A section = chapter heading + body nodes */
export interface ArticleSection {
  readonly heading: string;
  readonly englishTag: string;
  readonly nodes: readonly AstNode[];
}

// ─── Theme System ────────────────────────────────────────────────────────────

/** Theme color palette */
export interface ThemeColors {
  readonly primary: string;
  readonly primaryDark: string;
  readonly primaryLight: string;
  readonly primaryBg: string;
  readonly title: string;
  readonly body: string;
  readonly muted: string;
  readonly border: string;
  readonly underline: string;
}

/** Theme metadata */
export interface ThemeMeta {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly scenes: readonly string[];
  /** Whether this theme shows a grid-paper background by default */
  readonly defaultGrid?: boolean;
}

/** Theme interface — each theme implements this */
export interface ITheme {
  readonly meta: ThemeMeta;
  readonly colors: ThemeColors;

  /** Render the global container wrapper (open tag). grid: overlay grid-paper background */
  renderContainerOpen(grid?: boolean): string;
  /** Render the global container wrapper (close tag) */
  renderContainerClose(): string;
  /** Render the lead quote card */
  renderLeadQuote(quote: string, author?: string): string;
  /** Render the highlights panel (3 key points) */
  renderHighlights(points: readonly string[]): string;
  /** Render a section divider */
  renderDivider(): string;
  /** Render a chapter heading with number */
  renderChapterHeading(num: string, englishTag: string, title: string, isFirst: boolean): string;
  /** Render a sub-heading (###) */
  renderSubHeading(text: string): string;
  /** Render a paragraph with inline marks */
  renderParagraph(segments: readonly InlineSegment[]): string;
  /** Render a blockquote / callout */
  renderBlockquote(segments: readonly InlineSegment[]): string;
  /** Render a code block */
  renderCodeBlock(lang: string, code: string): string;
  /** Render inline code */
  renderInlineCode(text: string): string;
  /** Render an image */
  renderImage(src: string, alt: string): string;
  /** Render a list */
  renderList(items: readonly InlineSegment[][], ordered: boolean): string;
  /** Render the ending section (∞) */
  renderEnding(quote: string): string;
  /** Render the signature / author card */
  renderSignature(text: string, author: string): string;
  /** Render reference links */
  renderReferences(links: readonly { title: string; url: string }[]): string;

  // ─── AI-Enhanced Rendering (default implementations in BaseTheme) ────────

  /** Render lead quote with highlighted keyword segments */
  renderLeadQuoteMarked(segments: readonly { t: string; m: string }[]): string;
  /** Render a paragraph with marked segments (underline/highlight/bold) */
  renderMarkedParagraph(segments: readonly { t: string; m: string }[]): string;
  /** Render a blockquote as left-border quote block */
  renderBlockquoteBox(text: string): string;
}

// ─── Parser Interface ────────────────────────────────────────────────────────

/** Markdown parser — converts raw MD to structured article */
export interface IParser {
  parse(markdown: string): ParsedArticle;
}

// ─── Renderer Interface ──────────────────────────────────────────────────────

/** Render options */
export interface RenderOptions {
  readonly themeId: string;
  readonly autoNumbering?: boolean;
  readonly keywordsPerParagraph?: number;
  /** Optional AI content analysis — when provided, renderer uses AI-extracted metadata */
  readonly analysis?: IContentAnalysis | null;
  /** Include closing guide text (default: false) */
  readonly guide?: boolean;
  /** Include author signature (default: false) */
  readonly signature?: boolean;
  /** Convert links to footnotes for WeChat (default: false) */
  readonly footnotes?: boolean;
  /** Render article title in output (default: false) */
  readonly showTitle?: boolean;
  /** Custom font size in px (default: 15) */
  readonly fontSize?: number;
  /** Custom line height (default: 1.8) */
  readonly lineHeight?: number;
  /** Overlay grid-paper background. undefined = follow theme default */
  readonly grid?: boolean;
}

/** AI content analysis result (interface, not bound to specific implementation) */
export interface IContentAnalysis {
  readonly leadQuote: string;
  readonly endingQuote: string;
  readonly highlights: readonly string[];
  readonly articleType: ArticleType;
  readonly sections: readonly ISectionAnalysis[];
}

/** Per-section analysis result */
export interface ISectionAnalysis {
  readonly heading: string;
  readonly englishTag: string;
  readonly paragraphKeywords: readonly (readonly string[])[];
}

/** Renderer — assembles final HTML from parsed article + theme */
export interface IRenderer {
  render(article: ParsedArticle, options: RenderOptions): RenderResult;
}

/** Render result */
export interface RenderResult {
  readonly html: string;
  readonly stats: RenderStats;
}

/** Rendering statistics */
export interface RenderStats {
  readonly sections: number;
  readonly paragraphs: number;
  readonly keywords: number;
  readonly codeBlocks: number;
  readonly images: number;
}

// ─── Validator Interface ─────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  readonly severity: ValidationSeverity;
  readonly message: string;
  readonly line?: number;
}

export interface ValidationResult {
  readonly passed: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly spanLeafCount: number;
}

/** Validator — checks HTML compliance for WeChat platform */
export interface IValidator {
  validate(html: string): ValidationResult;
}

// ─── Formatter Facade ────────────────────────────────────────────────────────

/** Top-level formatter — orchestrates parse → render → validate */
export interface IFormatter {
  format(markdown: string, themeId?: string, opts?: { guide?: boolean; signature?: boolean; footnotes?: boolean; showTitle?: boolean; fontSize?: number; lineHeight?: number }): Promise<FormatResult>;
  getThemes(): readonly ThemeMeta[];
}

export interface FormatResult {
  readonly html: string;
  readonly validation: ValidationResult;
  readonly stats: RenderStats;
  readonly themeName: string;
}

// ─── API Types ───────────────────────────────────────────────────────────────

/** API request body */
export interface FormatRequest {
  readonly markdown: string;
  readonly theme?: string;
}

/** API response body */
export interface FormatResponse {
  readonly html: string;
  readonly validation: ValidationResult;
  readonly stats: RenderStats;
  readonly theme: ThemeMeta;
  readonly availableThemes: readonly ThemeMeta[];
}
