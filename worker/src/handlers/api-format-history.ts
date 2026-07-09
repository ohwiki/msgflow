/**
 * Format History API — auto-save and manage formatting history.
 *
 * GET  /api/format-history      — list recent history (latest 50)
 * DELETE /api/format-history/:id — delete a history entry
 */

import { Res } from "../lib/response.js";
import type { Logger } from "../lib/log.js";

/** Save a format result to history (upsert: same title updates existing record) */
export async function saveFormatHistory(
  env: Env,
  data: { title: string; markdown: string; html?: string; theme: string; aiEnhanced: boolean; folder?: string }
): Promise<void> {
  try {
    const html = data.aiEnhanced && data.html ? data.html : '';

    const existing = await env.DB.prepare(
      `SELECT id FROM format_history WHERE title = ? LIMIT 1`
    ).bind(data.title).first();

    if (existing) {
      // Update existing — only update folder if explicitly provided
      if (data.folder) {
        await env.DB.prepare(
          `UPDATE format_history SET markdown = ?, html = ?, theme = ?, ai_enhanced = ?, folder = ?, created_at = datetime('now') WHERE id = ?`
        ).bind(data.markdown, html, data.theme, data.aiEnhanced ? 1 : 0, data.folder, existing.id).run();
      } else {
        await env.DB.prepare(
          `UPDATE format_history SET markdown = ?, html = ?, theme = ?, ai_enhanced = ?, created_at = datetime('now') WHERE id = ?`
        ).bind(data.markdown, html, data.theme, data.aiEnhanced ? 1 : 0, existing.id).run();
      }
    } else {
      // Insert new — use provided folder or default
      const folder = data.folder ?? '默认';
      await env.DB.prepare(
        `INSERT INTO format_history (title, markdown, html, theme, ai_enhanced, folder) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(data.title, data.markdown, html, data.theme, data.aiEnhanced ? 1 : 0, folder).run();
    }
  } catch {
    // Fail silently
  }
}

/** GET /api/format-history — list recent formatting history (grouped by folder) */
export async function apiFormatHistory(request: Request, env: Env, log: Logger): Promise<Response> {
  // POST — create empty folder
  if (request.method === 'POST') {
    const body = await request.json<{ folder?: string }>();
    if (!body.folder?.trim()) {
      return Res.json({ error: "folder is required" }, 400);
    }
    log.info("format_history_create_folder", { folder: body.folder });
    // Insert a folder marker (empty title/markdown)
    await env.DB.prepare(
      `INSERT INTO format_history (title, markdown, theme, ai_enhanced, folder) VALUES (?, ?, ?, 0, ?)`
    ).bind('', '', '', body.folder.trim()).run();
    return Res.json({ success: true });
  }

  log.info("format_history_list");

  const results = await env.DB.prepare(
    `SELECT id, title, folder, theme, ai_enhanced, created_at FROM format_history ORDER BY folder, created_at DESC LIMIT 200`
  ).all();

  const allRows = results.results ?? [];
  // Collect all folder names (including empty-folder markers)
  const folders = [...new Set(allRows.map(r => r.folder as string))];
  // Filter out folder markers (empty title) for display items
  const items = allRows
    .filter(row => (row.title as string) !== '')
    .map((row) => ({
      id: row.id,
      title: row.title,
      folder: row.folder,
      theme: row.theme,
      aiEnhanced: row.ai_enhanced === 1,
      createdAt: row.created_at,
    }));

  return Res.json({ items, folders });
}

/** GET /api/format-history/:id — get a single history entry with full markdown */
export async function apiFormatHistoryGet(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id || isNaN(Number(id))) {
    return Res.json({ error: "Invalid id" }, 400);
  }

  log.info("format_history_get", { id });

  const row = await env.DB.prepare(
    `SELECT id, title, markdown, html, theme, ai_enhanced, created_at FROM format_history WHERE id = ?`
  ).bind(Number(id)).first();

  if (!row) {
    return Res.json({ error: "Not found" }, 404);
  }

  return Res.json({
    id: row.id,
    title: row.title,
    markdown: row.markdown,
    html: row.html,
    theme: row.theme,
    aiEnhanced: row.ai_enhanced === 1,
    createdAt: row.created_at,
  });
}

/** DELETE /api/format-history/:id or ?folder=xxx — delete entry or entire folder */
export async function apiFormatHistoryDelete(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);

  // Delete by folder
  const folder = url.searchParams.get("folder");
  if (folder) {
    log.info("format_history_delete_folder", { folder });
    await env.DB.prepare(`DELETE FROM format_history WHERE folder = ?`).bind(folder).run();
    return Res.json({ success: true });
  }

  // Delete by id
  const id = url.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return Res.json({ error: "Invalid id" }, 400);
  }

  log.info("format_history_delete", { id });
  await env.DB.prepare(`DELETE FROM format_history WHERE id = ?`).bind(Number(id)).run();

  return Res.json({ success: true });
}

/** PATCH /api/format-history/:id — update article (folder/title) */
export async function apiFormatHistoryPatch(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);

  // Rename folder: PATCH /api/format-history?renameFolder=old&to=new
  const renameFolder = url.searchParams.get("renameFolder");
  const renameTo = url.searchParams.get("to");
  if (renameFolder && renameTo) {
    log.info("format_history_rename_folder", { from: renameFolder, to: renameTo });
    await env.DB.prepare(`UPDATE format_history SET folder = ? WHERE folder = ?`)
      .bind(renameTo.trim(), renameFolder).run();
    return Res.json({ success: true });
  }

  // Update single item: PATCH /api/format-history/:id
  const id = url.pathname.split("/").pop();
  if (!id || isNaN(Number(id))) {
    return Res.json({ error: "Invalid id" }, 400);
  }

  const body = await request.json<{ folder?: string; title?: string }>();

  if (body.title?.trim()) {
    log.info("format_history_rename", { id, title: body.title });
    await env.DB.prepare(`UPDATE format_history SET title = ? WHERE id = ?`)
      .bind(body.title.trim(), Number(id)).run();
  }

  if (body.folder?.trim()) {
    log.info("format_history_move", { id, folder: body.folder });
    await env.DB.prepare(`UPDATE format_history SET folder = ? WHERE id = ?`)
      .bind(body.folder.trim(), Number(id)).run();
  }

  return Res.json({ success: true });
}
