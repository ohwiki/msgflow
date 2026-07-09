/**
 * GZH Formatter — API Handler.
 *
 * POST /api/format — accepts markdown + theme, returns formatted HTML.
 *   - Optional: ai=true enables AI-enhanced formatting (LLM analysis)
 * GET  /api/themes — returns available themes list.
 * GET  /format    — serves the editor UI page.
 */

import type { Logger } from "../lib/log.js";
import { Res } from "../lib/response.js";
import { ValidationError } from "../lib/errors.js";
import { GzhFormatter } from "../formatter/index.js";
import type { FormatResponse } from "../formatter/types.js";
import { formatEditorPage } from "../views/format-editor.js";
import { saveFormatHistory } from "./api-format-history.js";
import { z } from "zod";

const formatter = new GzhFormatter();

/** Zod schema for API request body validation */
const FormatRequestSchema = z.object({
  markdown: z.string().min(1, "markdown field is required"),
  theme: z.string().optional(),
  ai: z.boolean().optional(),
  guide: z.boolean().optional(),
  signature: z.boolean().optional(),
  footnotes: z.boolean().optional(),
  showTitle: z.boolean().optional(),
  fontSize: z.number().min(12).max(24).optional(),
  lineHeight: z.number().min(1.2).max(3.0).optional(),
  grid: z.boolean().optional(),
  folder: z.string().optional(),
});

/** POST /api/format — Format markdown into WeChat HTML */
export async function apiFormat(request: Request, env: Env, log: Logger): Promise<Response> {
  const raw = await request.json();
  const parsed = FormatRequestSchema.safeParse(raw);

  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const body = parsed.data;
  const useAI = body.ai === true;
  log.info("format_start", { theme: body.theme || "default", ai: String(useAI) });

  let result;
  let aiEnhanced = false;

  if (useAI) {
    // AI-enhanced mode: uses LLM to extract gold quotes, keywords, highlights
    const aiResult = await formatter.formatWithAI({
      markdown: body.markdown,
      themeId: body.theme,
      kv: env.KV,
      guide: body.guide,
      signature: body.signature,
      footnotes: body.footnotes,
      showTitle: body.showTitle,
      fontSize: body.fontSize,
      lineHeight: body.lineHeight,
      grid: body.grid,
      logger: {
        info: (msg, data) => log.info(msg, data as Record<string, string>),
        error: (msg, data) => log.error(msg, data as Record<string, string>),
      },
    });
    result = aiResult;
    aiEnhanced = aiResult.aiEnhanced;
  } else {
    // Basic mode: deterministic, no AI
    result = await formatter.format(body.markdown, body.theme, { guide: body.guide, signature: body.signature, footnotes: body.footnotes, showTitle: body.showTitle, fontSize: body.fontSize, lineHeight: body.lineHeight, grid: body.grid });
  }

  log.info("format_done", {
    theme: result.themeName,
    sections: String(result.stats.sections),
    keywords: String(result.stats.keywords),
    passed: String(result.validation.passed),
    aiEnhanced: String(aiEnhanced),
  });

  const themes = formatter.getThemes();
  const currentTheme = themes.find((t) => t.name === result.themeName) ?? themes[0]!;

  // Auto-save to history (await to ensure completion before response)
  const title = extractTitle(body.markdown);
  await saveFormatHistory(env, {
    title,
    markdown: body.markdown,
    html: aiEnhanced ? result.html : undefined,
    theme: currentTheme.id,
    aiEnhanced,
    folder: body.folder,
  });

  const response: FormatResponse & { aiEnhanced: boolean } = {
    html: result.html,
    validation: result.validation,
    stats: result.stats,
    theme: currentTheme,
    availableThemes: themes,
    aiEnhanced,
  };

  return Res.json(response);
}

/** Extract title from markdown (first # heading or first line) */
function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m) ?? markdown.match(/^##\s+(.+)$/m);
  if (match) return match[1]!.trim().slice(0, 100);
  const firstLine = markdown.trim().split('\n')[0] ?? '';
  return firstLine.slice(0, 100) || '未命名文章';
}

/** GET /api/themes — List available themes */
export async function apiThemes(_request: Request, _env: Env, log: Logger): Promise<Response> {
  log.info("themes_list");
  return Res.json({ themes: formatter.getThemes() });
}

/** GET /api/format-debug — Diagnose AI formatting (requires auth) */
export async function apiFormatDebug(request: Request, env: Env, _log: Logger): Promise<Response> {
  // Require secret param for access
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  if (!secret || secret !== env.CALLBACK_SECRET) {
    return Res.json({ error: "Unauthorized" }, 401);
  }
  const apiKey = await env.KV.get("nullclaw_api_key");
  const baseUrl = await env.KV.get("nullclaw_base_url");
  const model = await env.KV.get("nullclaw_model");

  const info: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
    baseUrl,
    model,
  };

  if (apiKey && baseUrl) {
    try {
      // Raw fetch test — bypass @ouraihub/llm to isolate the issue
      const url = `${baseUrl}/chat/completions`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model ?? 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'say OK' }],
          max_tokens: 50,
        }),
      });
      const text = await resp.text();
      info.rawStatus = resp.status;
      info.rawResponse = text.slice(0, 300);
    } catch (err) {
      info.rawFetchError = err instanceof Error ? err.message : String(err);
    }
  }

  return Res.json(info);
}

/** GET /format — Serve editor UI page */
export async function pageFormat(_request: Request, _env: Env, log: Logger): Promise<Response> {
  log.info("format_page");
  return new Response(formatEditorPage(), {
    headers: { "Content-Type": "text/html;charset=utf-8" },
  });
}
