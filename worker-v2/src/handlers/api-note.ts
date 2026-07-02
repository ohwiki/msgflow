/**
 * Handler: POST /api/note/publish — translate Chinese markdown to Japanese and publish to note.com as draft.
 *
 * Request body (JSON):
 *   - content: string (markdown content, required)
 *   - title?: string (override title; defaults to first h1 in translated content)
 *   - tags?: string[] (hashtags)
 *   - lang?: string (target language, default "ja")
 *
 * KV keys used:
 *   - note:cookie — note.com session cookie (_note_session_v5)
 *   - note:api_key — AI relay API key for translation
 */

import { Res } from "../lib/response.js";
import { ValidationError, AppError } from "../lib/errors.js";
import { escapeHtml } from "../lib/http.js";
import type { Logger } from "../lib/log.js";

const NOTE_API_BASE = "https://note.com/api/v1";

// --- Translation ---

async function translateMarkdown(content: string, lang: string, apiKey: string, apiBase: string, model: string): Promise<string> {
  const prompt = `把以下中文技术教程翻译成${lang === "ja" ? "日文" : lang}。规则：
1. 保留代码块内容不翻译
2. 技术术语保留英文原文
3. 保持原文的短句风格和排版结构
4. 链接URL不翻译
5. 不要加任何解释，直接输出翻译后的 markdown

${content}`;

  let resp: Response;
  try {
    resp = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
    });
  } catch (e: unknown) {
    throw new AppError(`Translation API network error: ${e instanceof Error ? e.message : "unknown"}`, "TRANSLATE_NETWORK_ERROR", 502);
  }

  if (!resp.ok) {
    throw new AppError(`Translation API error: ${resp.status}`, "TRANSLATE_ERROR", 502);
  }

  const data = await resp.json<{ choices: { message: { content: string } }[] }>();
  return data.choices?.[0]?.message?.content ?? "";
}

// --- Markdown to HTML (note.com subset) ---

function mdToNoteHtml(md: string): string {
  const lines = md.split("\n");
  const parts: string[] = [];
  let inCode = false;
  const codeBuf: string[] = [];
  const listBuf: string[] = [];

  function flushList() {
    if (listBuf.length > 0) {
      parts.push("<ul>" + listBuf.map((l) => `<li>${inlineFormat(l)}</li>`).join("") + "</ul>");
      listBuf.length = 0;
    }
  }

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        parts.push("<pre><code>" + codeBuf.join("\n") + "</code></pre>");
        codeBuf.length = 0;
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
      continue;
    }
    if (!line.trim()) { flushList(); continue; }
    if (line.startsWith("# ")) { flushList(); parts.push(`<h1>${inlineFormat(line.slice(2))}</h1>`); continue; }
    if (line.startsWith("## ")) { flushList(); parts.push(`<h2>${inlineFormat(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("### ")) { flushList(); parts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("- ") || line.startsWith("* ")) { listBuf.push(line.slice(2)); continue; }
    if (line.startsWith("|")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.every((c) => /^[-: ]+$/.test(c))) continue;
      flushList();
      listBuf.push(cells.join(" / "));
      continue;
    }
    if (/^---$|^\*\*\*$/.test(line.trim())) { flushList(); continue; }
    flushList();
    parts.push(`<p>${inlineFormat(line)}</p>`);
  }
  flushList();
  return parts.join("\n");
}

function inlineFormat(text: string): string {
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "<p><strong>👆 ここに画像を挿入：$1</strong></p>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  return text;
}

// --- note.com API ---

async function publishToNote(title: string, bodyHtml: string, cookie: string): Promise<{ noteId: number; noteKey: string; editUrl: string }> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Origin": "https://editor.note.com",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json",
    "Cookie": `_note_session_v5=${cookie}`,
  };

  // Create note skeleton
  let createResp: Response;
  try {
    createResp = await fetch(`${NOTE_API_BASE}/text_notes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ template_key: null }),
    });
  } catch (e: unknown) {
    throw new AppError(`note.com network error: ${e instanceof Error ? e.message : "unknown"}`, "NOTE_NETWORK_ERROR", 502);
  }

  if (createResp.status !== 201) {
    const text = await createResp.text();
    throw new AppError(`note.com create failed: ${createResp.status} ${text}`, "NOTE_CREATE_ERROR", 502);
  }

  const createData = await createResp.json<{ data: { id: number; key: string } }>();
  const { id: noteId, key: noteKey } = createData.data;

  // Save draft
  const plainText = bodyHtml.replace(/<[^>]+>/g, "");
  let saveResp: Response;
  try {
    saveResp = await fetch(`${NOTE_API_BASE}/text_notes/draft_save?id=${noteId}&is_temp_saved=true`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        body: bodyHtml,
        body_length: plainText.length,
        name: title,
        index: false,
        is_lead_form: false,
        image_keys: [],
      }),
    });
  } catch (e: unknown) {
    throw new AppError(`note.com save network error: ${e instanceof Error ? e.message : "unknown"}`, "NOTE_NETWORK_ERROR", 502);
  }

  if (saveResp.status !== 200 && saveResp.status !== 201) {
    const text = await saveResp.text();
    throw new AppError(`note.com save failed: ${saveResp.status} ${text}`, "NOTE_SAVE_ERROR", 502);
  }

  return { noteId, noteKey, editUrl: `https://editor.note.com/notes/${noteKey}/edit` };
}

// --- Handler ---

export async function apiNotePublish(request: Request, env: Env, log: Logger): Promise<Response> {
  let content: string | undefined;
  let title: string | undefined;
  let tags: string[] = [];
  let lang = "ja";

  const ct = request.headers.get("Content-Type") || "";
  if (ct.includes("multipart") || ct.includes("form-data")) {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (file) {
      content = await file.text();
    }
    title = (form.get("title") as string) || undefined;
    const tagsStr = (form.get("tags") as string) || "";
    if (tagsStr) tags = tagsStr.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
    lang = (form.get("lang") as string) || "ja";
  } else {
    try {
      const body = await request.json<{ content?: string; title?: string; tags?: string[]; lang?: string }>();
      content = body.content;
      title = body.title;
      tags = body.tags || [];
      lang = body.lang || "ja";
    } catch {
      throw new ValidationError("Invalid JSON body");
    }
  }

  if (!content?.trim()) {
    throw new ValidationError("content or file is required");
  }

  // Read secrets from KV
  const apiKey = await env.KV.get("note:api_key");
  const cookie = await env.KV.get("note:cookie");

  if (!apiKey) throw new AppError("note:api_key not configured in KV", "CONFIG_ERROR", 500);
  if (!cookie) throw new AppError("note:cookie not configured in KV", "CONFIG_ERROR", 500);

  // Strip YAML frontmatter if present
  let mdContent = content!;
  if (mdContent.startsWith("---")) {
    const end = mdContent.indexOf("---", 3);
    if (end !== -1) mdContent = mdContent.slice(end + 3).trim();
  }

  // 1. Translate
  log.info("note_translate_start", { lang, contentLength: String(mdContent.length) });
  const apiBase = await env.KV.get("note:ai_api_base") || "https://api.openai.com/v1";
  const aiModel = await env.KV.get("note:ai_model") || "gpt-4o-mini";
  const translated = await translateMarkdown(mdContent, lang, apiKey, apiBase, aiModel);
  log.info("note_translate_done", { translatedLength: String(translated.length) });

  // 2. Extract title from translated content (first h1) or use provided
  const finalTitle: string = title || translated.match(/^# (.+)$/m)?.[1] || "無題";

  // 3. Convert to HTML
  const html = mdToNoteHtml(translated);

  // 4. Publish draft
  log.info("note_publish_start", { title: finalTitle });
  const result = await publishToNote(finalTitle, html, cookie);
  log.info("note_publish_done", { noteId: String(result.noteId), noteKey: result.noteKey });

  const isHtmx = request.headers.get("HX-Request") === "true";
  if (isHtmx) {
    return Res.html(`<div class="alert alert-success"><span>✅ 下書き保存成功：<strong>${escapeHtml(finalTitle)}</strong></span><br><a href="${escapeHtml(result.editUrl)}" target="_blank" class="link">→ 編集画面を開く</a></div>`);
  }
  return Res.json({
    ok: true,
    title: finalTitle,
    editUrl: result.editUrl,
    noteId: result.noteId,
  });
}

/**
 * Handler: POST /api/note/cookie — update note.com session cookie in KV.
 * Body: { cookie: string }
 */
export async function apiNoteUpdateCookie(request: Request, env: Env, log: Logger): Promise<Response> {
  let cookie: string | undefined;
  const ct = request.headers.get("Content-Type") || "";
  if (ct.includes("form")) {
    const form = await request.formData();
    cookie = (form.get("cookie") as string)?.trim();
  } else {
    try {
      const body = await request.json<{ cookie?: string }>();
      cookie = body.cookie?.trim();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }
  }
  if (!cookie) throw new ValidationError("cookie is required");

  await env.KV.put("note:cookie", cookie);
  log.info("note_cookie_updated");

  const isHtmx = request.headers.get("HX-Request") === "true";
  if (isHtmx) {
    return Res.html(`<div class="text-success text-sm">✅ Cookie 已更新</div>`);
  }
  return Res.json({ ok: true, message: "cookie updated" });
}
