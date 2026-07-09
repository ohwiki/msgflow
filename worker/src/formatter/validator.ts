/**
 * GZH Formatter — HTML Validator.
 *
 * Checks rendered HTML for WeChat platform compliance.
 * Mirrors the rules from validate_gzh_html.py.
 */

import type { IValidator, ValidationResult, ValidationIssue } from "./types.js";

export class GzhValidator implements IValidator {
  /** Forbidden tags/patterns in WeChat */
  private static readonly FORBIDDEN_PATTERNS = [
    { pattern: /<style[\s>]/i, message: "禁止使用 <style> 标签" },
    { pattern: /<script[\s>]/i, message: "禁止使用 <script> 标签" },
    { pattern: /class="/i, message: "禁止使用 class 属性" },
    { pattern: /\sid="/i, message: "禁止使用 id 属性" },
    { pattern: /position\s*:\s*(fixed|absolute)/i, message: "禁止使用 position:fixed/absolute" },
    { pattern: /float\s*:/i, message: "禁止使用 float" },
    { pattern: /@media/i, message: "禁止使用 @media" },
    { pattern: /@keyframes/i, message: "禁止使用 @keyframes" },
    { pattern: /display\s*:\s*grid/i, message: "禁止使用 display:grid" },
    { pattern: /<div[\s>]/i, message: "禁止使用 <div> 标签，用 <section> 替代" },
  ];

  /** Half-width punctuation that should be full-width in Chinese context */
  private static readonly HALFWIDTH_PUNCTUATION = /(?<=[一-龥。，；！？])([,;!?:])/g;

  validate(html: string): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check forbidden patterns
    for (const { pattern, message } of GzhValidator.FORBIDDEN_PATTERNS) {
      if (pattern.test(html)) {
        issues.push({ severity: "error", message });
      }
    }

    // Check span leaf wrapping
    const spanLeafCount = (html.match(/span leaf=""/g) || []).length;
    if (spanLeafCount === 0) {
      issues.push({ severity: "error", message: "未发现 <span leaf=\"\"> 包裹，文字将丢失样式" });
    }

    // Check for half-width punctuation (warning)
    const halfWidthMatches = html.match(GzhValidator.HALFWIDTH_PUNCTUATION);
    if (halfWidthMatches && halfWidthMatches.length > 0) {
      issues.push({
        severity: "warning",
        message: `发现 ${halfWidthMatches.length} 处半角标点，建议改为全角`,
      });
    }

    // Check for empty decorative elements without <span leaf=""><br></span>
    const emptyDecorative = /<section[^>]*style="[^"]*height:\s*1px[^"]*"[^>]*>\s*<\/section>/g;
    const emptyMatches = html.match(emptyDecorative);
    if (emptyMatches && emptyMatches.length > 0) {
      issues.push({
        severity: "error",
        message: `${emptyMatches.length} 个装饰性空元素缺少 <span leaf=""><br></span> 占位`,
      });
    }

    const passed = issues.filter((i) => i.severity === "error").length === 0;

    return { passed, issues, spanLeafCount };
  }
}
