/**
 * AI Content Analyzer — LLM-powered article analysis service.
 *
 * Design: LLM outputs ONLY semantic decisions (what to mark and how).
 * Code handles all HTML rendering from templates.
 *
 * Token optimization: LLM doesn't output any HTML/CSS, only:
 * - Text segments with mark types (n/u/h/b)
 * - Structural decisions (which paragraphs are blockquotes)
 * - Metadata (highlights, english tags, article type)
 */

import { createProvider, type ILLMProvider } from '@ouraihub/llm';
import { ContentAnalysisSchema } from './content-analysis.js';
import type { ContentAnalysis, SectionAnalysis, LeadQuoteAnalysis, MarkType } from './content-analysis.js';
import { z } from 'zod';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface IKVStore {
  get(key: string): Promise<string | null>;
}

export interface IAnalyzerLogger {
  info(message: string, data?: Record<string, unknown>): void;
  error(message: string, data?: Record<string, unknown>): void;
}

export interface AnalyzerConfig {
  readonly kv: IKVStore;
  readonly logger?: IAnalyzerLogger;
}

// ─── KV Keys ─────────────────────────────────────────────────────────────────

const KV_API_KEY = 'nullclaw_api_key';
const KV_BASE_URL = 'nullclaw_base_url';
const KV_MODEL = 'nullclaw_model';

// ─── Implementation ──────────────────────────────────────────────────────────

export class ContentAnalyzer {
  private readonly kv: IKVStore;
  private readonly logger: IAnalyzerLogger;
  private provider: ILLMProvider | null = null;

  constructor(config: AnalyzerConfig) {
    this.kv = config.kv;
    this.logger = config.logger ?? { info: () => {}, error: () => {} };
  }

  async analyze(markdown: string): Promise<ContentAnalysis | null> {
    try {
      const provider = await this.getProvider();
      if (!provider) {
        this.logger.info('content_analyzer_skip', { reason: 'no_llm_config' });
        return null;
      }

      this.logger.info('content_analyzer_start', { contentLength: markdown.length });

      const prompt = this.buildPrompt(markdown);
      const raw = await provider.complete(prompt, ContentAnalysisSchema);

      // Transform LLM output to ContentAnalysis interface
      const result = this.transformResult(raw);

      this.logger.info('content_analyzer_done', {
        highlights: result.highlights.length,
        sections: result.markedSections.length,
        articleType: result.articleType,
      });

      return result;
    } catch (err) {
      this.logger.error('content_analyzer_failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  }

  // ─── Private ─────────────────────────────────────────────────────────────

  private transformResult(raw: unknown): ContentAnalysis {
    // raw is already validated by Zod in complete(), use inferred type
    type ParsedData = z.infer<typeof ContentAnalysisSchema>;
    const data = raw as ParsedData;

    const leadQuoteMarked: LeadQuoteAnalysis = {
      segments: data.leadQuote.segments.map(s => ({ t: s.t, m: s.m as MarkType })),
    };

    const markedSections: SectionAnalysis[] = data.sections.map(s => ({
      heading: s.heading,
      englishTag: s.englishTag,
      paragraphKeywords: [],
      paragraphs: s.paragraphs.map(p => p.map(seg => ({ t: seg.t, m: seg.m as MarkType }))),
      blockquotes: s.blockquotes,
    }));

    return {
      leadQuote: leadQuoteMarked.segments.map(s => s.t).join(''),
      endingQuote: data.endingQuote,
      highlights: data.highlights,
      articleType: data.articleType as ContentAnalysis['articleType'],
      sections: markedSections,
      leadQuoteMarked,
      markedSections,
    };
  }

  private async getProvider(): Promise<ILLMProvider | null> {
    if (this.provider) return this.provider;

    const [apiKey, baseUrl, model] = await Promise.all([
      this.kv.get(KV_API_KEY),
      this.kv.get(KV_BASE_URL),
      this.kv.get(KV_MODEL),
    ]);

    if (!apiKey || !baseUrl) return null;

    this.provider = createProvider({
      apiKey,
      baseUrl,
      model: model ?? 'gpt-4o-mini',
      timeoutMs: 120_000, // 2 minutes for long articles
    });

    return this.provider;
  }

  private buildPrompt(markdown: string): { system: string; user: string } {
    return {
      system: SYSTEM_PROMPT,
      user: `分析以下文章，输出JSON：\n\n${markdown}`,
    };
  }
}

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `你是公众号排版编辑。分析文章内容，输出JSON标记数据。

你不输出任何HTML/CSS。你只输出"文本+标记类型"，代码会根据你的标记渲染成对应样式。

## 标记类型（m字段）
- "n" = 普通文本（无标记）
- "u" = 下划线标记（核心观点、结论、关键数据、专有名词，每段1-3处，4-15字）
- "h" = 高亮标签（重要术语/产品名/核心概念，全文≤5处，2-8字）
- "b" = 加粗强调（极少使用，全文≤3处）

## 输出JSON结构

{
  "leadQuote": {
    "segments": [
      {"t": "普通文字部分", "m": "n"},
      {"t": "高亮关键词", "m": "h"},
      {"t": "剩余文字", "m": "n"}
    ]
  },
  "endingQuote": "结尾收束金句（15-40字）",
  "highlights": ["看点一(10-20字)", "看点二", "看点三"],
  "articleType": "opinion",
  "sections": [
    {
      "heading": "章节标题原文",
      "englishTag": "BREACH",
      "paragraphs": [
        [
          {"t": "前文", "m": "n"},
          {"t": "关键短语", "m": "u"},
          {"t": "后文", "m": "n"}
        ]
      ],
      "blockquotes": [3]
    }
  ]
}

## 规则

1. leadQuote：从文章提炼一句有张力的金句（15-40字），关键词用"h"标记（1-2个高亮词）
2. highlights：恰好3个，是精选看点，不是章节标题的复制
3. englishTag：全大写（BREACH/ADAPTATION/IMPLICATIONS/TUTORIAL/SUMMARY/THOUGHTS/INSIGHT/PRACTICE等）
4. paragraphs：按原文段落顺序，每段拆成segments。每段标1-3个"u"短语。无要点的段落全部"n"
5. blockquotes：数组中存放应该渲染为"引用块"的段落索引（0-based）。原文中的引用性质段落（如专家语录、报告引文）标记为blockquote
6. 高亮(h)全文≤5处，只用于最核心的术语/产品名
7. 不要遗漏任何段落。sections中的paragraphs数量必须和原文各章节的段落数一致

输出纯JSON。`;
