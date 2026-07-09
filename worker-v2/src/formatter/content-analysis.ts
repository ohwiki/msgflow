/**
 * AI Content Analysis — Types and Zod schema for LLM-powered article analysis.
 *
 * Design principle: LLM only outputs "what to mark and how" (semantic decisions),
 * code handles all HTML/CSS rendering (template-based).
 *
 * Mark types:
 * - none: plain text
 * - underline: key phrase, rendered as colored bottom-border
 * - highlight: important term, rendered as colored background tag
 * - bold: strong emphasis, rendered as primary-color bold
 */

import { z } from 'zod';
import type { ArticleType, IContentAnalysis, ISectionAnalysis } from './types.js';

// ─── Zod Schema ──────────────────────────────────────────────────────────────

/** A text segment with its mark type */
const SegmentSchema = z.object({
  /** Text content */
  t: z.string(),
  /** Mark type: none(plain) / u(underline) / h(highlight tag) / b(bold) */
  m: z.enum(['n', 'u', 'h', 'b']).default('n'),
});

/** A paragraph represented as segments with marks */
const MarkedParagraphSchema = z.array(SegmentSchema);

/** Lead quote with highlighted keywords */
const LeadQuoteSchema = z.object({
  /** Segments of the lead quote (with highlight marks on key words) */
  segments: z.array(SegmentSchema),
});

/** Per-section analysis */
const SectionAnalysisSchema = z.object({
  /** Original section heading */
  heading: z.string(),
  /** English tag (BREACH, TUTORIAL, SUMMARY, THOUGHTS, etc.) */
  englishTag: z.string(),
  /** Each paragraph as marked segments (array index = paragraph order) */
  paragraphs: z.array(MarkedParagraphSchema),
  /** Blockquote texts to render as left-border quote blocks (extracted from context) */
  blockquotes: z.array(z.number()).describe('indices of paragraphs that should be rendered as blockquote'),
});

/** Full content analysis schema */
export const ContentAnalysisSchema = z.object({
  /** Lead quote with keyword highlights */
  leadQuote: LeadQuoteSchema,
  /** Ending reflection quote */
  endingQuote: z.string(),
  /** 3 core highlights for the highlights panel */
  highlights: z.array(z.string()).min(3).max(3),
  /** Article type classification */
  articleType: z.enum(['tutorial', 'review', 'opinion', 'story', 'data', 'essay']),
  /** Per-section analysis with marked paragraphs */
  sections: z.array(SectionAnalysisSchema),
});

// ─── TypeScript Types ────────────────────────────────────────────────────────

/** Mark type for inline text */
export type MarkType = 'n' | 'u' | 'h' | 'b';

/** A text segment with its semantic mark */
export interface MarkedSegment {
  readonly t: string;
  readonly m: MarkType;
}

/** Lead quote with highlighted segments */
export interface LeadQuoteAnalysis {
  readonly segments: readonly MarkedSegment[];
}

/** Analysis result for a single section */
export interface SectionAnalysis extends ISectionAnalysis {
  readonly heading: string;
  readonly englishTag: string;
  readonly paragraphKeywords: readonly (readonly string[])[];
  /** Paragraphs as marked segments */
  readonly paragraphs: readonly (readonly MarkedSegment[])[];
  /** Indices of paragraphs that should render as blockquotes */
  readonly blockquotes: readonly number[];
}

/** Full content analysis result from LLM */
export interface ContentAnalysis extends IContentAnalysis {
  readonly leadQuote: string;
  readonly endingQuote: string;
  readonly highlights: readonly string[];
  readonly articleType: ArticleType;
  readonly sections: readonly SectionAnalysis[];
  /** Structured lead quote with highlights */
  readonly leadQuoteMarked: LeadQuoteAnalysis;
  /** Sections with paragraph-level mark data */
  readonly markedSections: readonly SectionAnalysis[];
}
