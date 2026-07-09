/**
 * GZH Formatter — Markdown Parser.
 *
 * Converts raw Markdown text into a structured ParsedArticle.
 * Uses `marked` for tokenization, then maps tokens to our AST.
 */

import { marked, type Token, type Tokens } from "marked";
import type {
  IParser,
  ParsedArticle,
  ArticleSection,
  ArticleType,
  AstNode,
  InlineSegment,
  InlineMarkType,
  HeadingNode,
  ParagraphNode,
  BlockquoteNode,
  CodeNode,
  ImageNode,
  ListNode,
  ListItemNode,
  HrNode,
} from "./types.js";
import { ParseError } from "./errors.js";

export class MarkdownParser implements IParser {
  parse(markdown: string): ParsedArticle {
    if (!markdown || !markdown.trim()) {
      throw new ParseError("Markdown content is empty");
    }

    const tokens = marked.lexer(markdown);
    const title = this.extractTitle(tokens);
    const leadQuote = this.extractLeadQuote(tokens);
    const sections = this.extractSections(tokens);
    const articleType = this.inferArticleType(tokens, sections);

    return { title, leadQuote, sections, articleType };
  }

  private extractTitle(tokens: Token[]): string {
    const h1 = tokens.find(
      (t): t is Tokens.Heading => t.type === "heading" && t.depth === 1
    );
    return h1?.text ?? "无标题";
  }

  private extractLeadQuote(tokens: Token[]): string | null {
    // Find first blockquote that appears before any h2
    for (const token of tokens) {
      if (token.type === "heading" && (token as Tokens.Heading).depth === 2) break;
      if (token.type === "blockquote") {
        return (token as Tokens.Blockquote).text?.trim() ?? null;
      }
    }
    return null;
  }

  private extractSections(tokens: Token[]): ArticleSection[] {
    const sections: ArticleSection[] = [];
    let currentNodes: AstNode[] = [];
    let currentHeading = "";
    let passedFirstH2 = false;

    for (const token of tokens) {
      if (token.type === "heading" && (token as Tokens.Heading).depth === 1) continue;

      if (token.type === "heading" && (token as Tokens.Heading).depth === 2) {
        if (passedFirstH2 && currentHeading) {
          sections.push(this.buildSection(currentHeading, currentNodes));
        }
        currentHeading = (token as Tokens.Heading).text;
        currentNodes = [];
        passedFirstH2 = true;
        continue;
      }

      if (passedFirstH2) {
        const node = this.tokenToNode(token);
        if (node) currentNodes.push(node);
      } else {
        // Nodes before first h2 go into an implicit intro section (if not lead quote)
        if (token.type !== "blockquote") {
          const node = this.tokenToNode(token);
          if (node) currentNodes.push(node);
        }
      }
    }

    // If no h2 found, wrap all content in a single section
    if (!passedFirstH2 && currentNodes.length > 0) {
      sections.push({ heading: "", englishTag: "", nodes: currentNodes });
    } else if (currentHeading) {
      sections.push(this.buildSection(currentHeading, currentNodes));
    }

    // If there were nodes before the first h2 and we have sections, prepend as intro
    if (passedFirstH2) {
      const introNodes: AstNode[] = [];
      for (const token of tokens) {
        if (token.type === "heading" && (token as Tokens.Heading).depth === 2) break;
        if (token.type === "heading" && (token as Tokens.Heading).depth === 1) continue;
        if (token.type === "blockquote") continue;
        const node = this.tokenToNode(token);
        if (node) introNodes.push(node);
      }
      if (introNodes.length > 0) {
        sections.unshift({ heading: "", englishTag: "", nodes: introNodes });
      }
    }

    return sections;
  }

  private buildSection(heading: string, nodes: AstNode[]): ArticleSection {
    return {
      heading,
      englishTag: this.generateEnglishTag(heading),
      nodes,
    };
  }

  private generateEnglishTag(heading: string): string {
    const tagMap: Record<string, string> = {
      "背景": "BACKGROUND",
      "原因": "WHY",
      "方案": "SOLUTION",
      "对比": "COMPARISON",
      "总结": "SUMMARY",
      "结论": "CONCLUSION",
      "实践": "PRACTICE",
      "教训": "LESSONS",
      "思考": "THOUGHTS",
      "未来": "FUTURE",
    };

    for (const [key, val] of Object.entries(tagMap)) {
      if (heading.includes(key)) return val;
    }
    return "INSIGHT";
  }

  private tokenToNode(token: Token): AstNode | null {
    switch (token.type) {
      case "heading":
        return this.parseHeading(token as Tokens.Heading);
      case "paragraph":
        return this.parseParagraph(token as Tokens.Paragraph);
      case "blockquote":
        return this.parseBlockquote(token as Tokens.Blockquote);
      case "code":
        return this.parseCode(token as Tokens.Code);
      case "list":
        return this.parseList(token as Tokens.List);
      case "hr":
        return { type: "hr" } as HrNode;
      default:
        return null;
    }
  }

  private parseHeading(token: Tokens.Heading): HeadingNode {
    return {
      type: "heading",
      depth: token.depth as 1 | 2 | 3 | 4 | 5 | 6,
      text: token.text,
      segments: this.parseInline(token.text),
    };
  }

  private parseParagraph(token: Tokens.Paragraph): ParagraphNode | ImageNode | null {
    // Check if it's an image-only paragraph
    const imgMatch = token.text.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return { type: "image", alt: imgMatch[1], src: imgMatch[2] } as ImageNode;
    }

    return {
      type: "paragraph",
      segments: this.parseInline(token.text),
      raw: token.text,
    };
  }

  private parseBlockquote(token: Tokens.Blockquote): BlockquoteNode {
    const text = token.text ?? "";
    return {
      type: "blockquote",
      segments: this.parseInline(text),
      raw: text,
    };
  }

  private parseCode(token: Tokens.Code): AstNode {
    // Detect mermaid blocks
    if (token.lang === "mermaid") {
      return { type: "mermaid", content: token.text };
    }
    return {
      type: "code",
      lang: token.lang ?? "",
      content: token.text,
    } as CodeNode;
  }

  private parseList(token: Tokens.List): ListNode {
    const items: ListItemNode[] = token.items.map((item) => ({
      type: "listItem",
      segments: this.parseInline(item.text),
    }));
    return { type: "list", ordered: token.ordered, items };
  }

  /** Parse inline Markdown marks into segments */
  private parseInline(text: string): InlineSegment[] {
    const segments: InlineSegment[] = [];
    // Simple regex-based inline parsing
    const pattern = /(\*\*(.+?)\*\*|`(.+?)`|==(.+?)==|\+\+(.+?)\+\+|~~(.+?)~~|\[([^\]]+)\]\([^)]+\))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(text)) !== null) {
      // Plain text before this match
      if (match.index > lastIndex) {
        segments.push({ text: text.slice(lastIndex, match.index), marks: [] });
      }

      if (match[2]) {
        segments.push({ text: match[2], marks: ["bold"] });
      } else if (match[3]) {
        segments.push({ text: match[3], marks: ["inlineCode"] });
      } else if (match[4]) {
        segments.push({ text: match[4], marks: ["highlight"] });
      } else if (match[5]) {
        segments.push({ text: match[5], marks: ["underline"] });
      } else if (match[6]) {
        segments.push({ text: match[6], marks: ["strikethrough"] });
      } else if (match[7]) {
        segments.push({ text: match[7], marks: ["link"] });
      }

      lastIndex = match.index + match[0].length;
    }

    // Remaining plain text
    if (lastIndex < text.length) {
      segments.push({ text: text.slice(lastIndex), marks: [] });
    }

    // If no marks found, return single plain segment
    if (segments.length === 0) {
      segments.push({ text, marks: [] });
    }

    return segments;
  }

  private inferArticleType(tokens: Token[], sections: ArticleSection[]): ArticleType {
    let codeCount = 0;
    let listCount = 0;
    let quoteCount = 0;
    let paragraphCount = 0;

    for (const token of tokens) {
      if (token.type === "code") codeCount++;
      if (token.type === "list") listCount++;
      if (token.type === "blockquote") quoteCount++;
      if (token.type === "paragraph") paragraphCount++;
    }

    if (codeCount >= 3) return "tutorial";
    if (listCount >= 4) return "review";
    if (quoteCount >= 3 && paragraphCount > 10) return "opinion";
    if (sections.length <= 2 && paragraphCount > 8) return "essay";
    return "opinion";
  }
}
