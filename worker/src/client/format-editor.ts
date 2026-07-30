// Browser-side controller for the GZH format-editor page.
// Compiled by esbuild (build:client) into format-editor.client.js and injected
// into the mustache template as an inline <script>. Type-checked via tsconfig.client.json.

// ─── Types ─────────────────────────────────────────────────────────────────

type FsKind = "title" | "h2" | "h3" | "body";
type TabName = "basic" | "ai";

interface FormatStats {
  sections: number;
  paragraphs: number;
  keywords: number;
  codeBlocks: number;
  images: number;
}

interface FormatData {
  html: string;
  stats: FormatStats;
  theme: { name: string };
  aiEnhanced?: boolean;
}

type FetchResult =
  | { ok: true; data: FormatData }
  | { ok: false; error: string };

interface FormatPayload {
  markdown: string;
  theme: string;
  ai?: boolean;
  guide?: boolean;
  signature?: boolean;
  footnotes?: boolean;
  showTitle?: boolean;
  grid?: boolean;
  fontSize?: number;
  lineHeight?: number;
  folder?: string;
}

interface HistoryItem {
  id: number;
  title: string;
  folder: string;
  createdAt: string;
  aiEnhanced?: boolean;
}

interface HistoryDoc {
  markdown: string;
  theme?: string;
  html?: string;
  aiEnhanced?: boolean;
}

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function byId<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ─── State ─────────────────────────────────────────────────────────────────

let htmlBasic = "";
let htmlAI = "";
let htmlBasicRaw = "";
let htmlAIRaw = "";
let activeTab: TabName = "basic";

// Per-type absolute font-size in px. null = keep each element's original size.
let fsAbsolute: Record<FsKind, number | null> = { title: null, h2: null, h3: null, body: null };

// Apply chosen absolute font-sizes to a raw formatted-HTML string, return adjusted HTML.
// Keeps a data-fs-base attr so "默认/重置" can always restore the original size.
function applyFontSizes(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc || !doc.body) return html;
  const nodes = doc.querySelectorAll<HTMLElement>("[data-fs]");
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]!;
    const kind = el.getAttribute("data-fs");
    if (!kind || !(kind in fsAbsolute)) continue;
    let base = el.getAttribute("data-fs-base");
    if (base === null) {
      const cur = parseFloat(el.style.fontSize) || 15;
      base = String(cur);
      el.setAttribute("data-fs-base", base);
    }
    const override = fsAbsolute[kind as FsKind];
    const target = override != null ? override : parseFloat(base);
    el.style.fontSize = target + "px";
  }
  return doc.body.innerHTML;
}

// Recompute htmlBasic/htmlAI from their raw versions and re-render the preview frames.
function updatePreview(which?: TabName): void {
  if ((!which || which === "basic") && htmlBasicRaw) {
    htmlBasic = applyFontSizes(htmlBasicRaw);
    renderFrame("previewBasic", htmlBasic);
  }
  if ((!which || which === "ai") && htmlAIRaw) {
    htmlAI = applyFontSizes(htmlAIRaw);
    renderFrame("previewAI", htmlAI);
  }
}

// value: '' → 默认（用原始字号）; 否则为具体 px 数值字符串
function setFontSize(kind: FsKind, value: string): void {
  fsAbsolute[kind] = value === "" ? null : parseFloat(value);
  updatePreview();
}

function resetFontSize(): void {
  fsAbsolute = { title: null, h2: null, h3: null, body: null };
  ["fsSelBody", "fsSelTitle", "fsSelH2"].forEach(function (id) {
    const el = document.getElementById(id) as HTMLSelectElement | null;
    if (el) el.value = "";
  });
  updatePreview();
}

function switchTab(tab: TabName): void {
  if (tab === "ai" && !htmlAI) return; // Can't switch to AI if no result
  activeTab = tab;
  const tabBasic = byId("tabBasic");
  const tabAI = byId("tabAI");
  const frameBasic = byId("previewBasic");
  const frameAI = byId("previewAI");

  if (tab === "basic") {
    tabBasic.className = "tab tab-active";
    tabAI.className = htmlAI ? "tab" : "tab tab-disabled";
    frameBasic.classList.remove("invisible");
    frameAI.classList.add("invisible");
  } else {
    tabBasic.className = "tab";
    tabAI.className = "tab tab-active";
    frameBasic.classList.add("invisible");
    frameAI.classList.remove("invisible");
  }
}

async function runFormat(): Promise<void> {
  const md = byId<HTMLTextAreaElement>("md").value;
  const theme = byId<HTMLSelectElement>("theme").value;
  const useAI = byId<HTMLInputElement>("enableAI").checked;
  const status = byId("status");
  const copyBtn = byId<HTMLButtonElement>("copyBtn");

  if (!md.trim()) { status.innerHTML = '<span class="text-error">请输入 Markdown 内容</span>'; return; }

  htmlBasic = "";
  htmlAI = "";
  htmlBasicRaw = "";
  htmlAIRaw = "";
  copyBtn.disabled = true;

  const aiLabel = useAI ? " + AI分析（约10-30秒）" : "";
  status.innerHTML = "<span>排版中..." + aiLabel + "</span>";
  byId("badgeBasic").textContent = "";
  byId("badgeAI").textContent = useAI ? "加载中..." : "未启用";
  byId("tabAI").className = useAI ? "tab" : "tab tab-disabled";

  if (useAI) {
    renderFrame("previewAI", '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:sans-serif;color:#7C3AED;"><p>✨ AI 正在分析文章结构...</p></div>');
  }

  // Always run basic
  const basicPromise = fetchFormat(md, theme, false);

  // Only run AI if checked
  const aiPromise = useAI ? fetchFormat(md, theme, true) : null;

  // Basic result
  const basicResult = await basicPromise;
  if (basicResult.ok) {
    htmlBasicRaw = basicResult.data.html;
    htmlBasic = applyFontSizes(htmlBasicRaw);
    renderFrame("previewBasic", htmlBasic);
    byId("badgeBasic").textContent = basicResult.data.stats.sections + "章";
    copyBtn.disabled = false;
  } else {
    status.innerHTML = '<span class="text-error">排版失败：' + escHtml(basicResult.error) + "</span>";
    return;
  }

  if (!useAI) {
    // Done - only basic
    switchTab("basic");
    const s = basicResult.data.stats;
    status.innerHTML = '<span class="text-success">✅ 排版完成</span><span>章节 ' + s.sections + " · 段落 " + s.paragraphs + '</span><span>主题：' + basicResult.data.theme.name + "</span>";
    loadHistory();
    return;
  }

  // Wait for AI result
  const aiResult = await aiPromise!;
  if (aiResult.ok && aiResult.data.aiEnhanced) {
    htmlAIRaw = aiResult.data.html;
    htmlAI = applyFontSizes(htmlAIRaw);
    renderFrame("previewAI", htmlAI);
    const k = aiResult.data.stats.keywords;
    byId("badgeAI").textContent = k + "处标记";
    switchTab("ai");
    status.innerHTML = '<span class="text-success">✅ 普通排版完成</span><span style="color:#7C3AED">✨ AI排版完成（' + k + " 处标记）</span><span>主题：" + basicResult.data.theme.name + "</span>";
  } else {
    byId("badgeAI").textContent = "未增强";
    const errMsg = aiResult.ok ? "LLM返回格式异常" : aiResult.error;
    const errMsgEsc = escHtml(errMsg);
    renderFrame("previewAI", '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#DC2626;font-family:sans-serif;"><p>AI排版未成功：' + errMsgEsc + "</p></div>");
    status.innerHTML = '<span class="text-success">✅ 普通排版完成</span><span style="color:#9CA3AF">AI未增强（' + errMsgEsc + "）</span>";
  }

  // Refresh history list
  loadHistory();
}

async function fetchFormat(md: string, theme: string, useAI: boolean): Promise<FetchResult> {
  try {
    const payload: FormatPayload = { markdown: md, theme: theme };
    if (useAI) payload.ai = true;
    if (byId<HTMLInputElement>("enableGuide").checked) payload.guide = true;
    if (byId<HTMLInputElement>("enableSignature").checked) payload.signature = true;
    if (byId<HTMLInputElement>("enableFootnotes").checked) payload.footnotes = true;
    if (byId<HTMLInputElement>("enableTitle").checked) payload.showTitle = true;
    payload.grid = byId<HTMLInputElement>("enableGrid").checked;
    payload.fontSize = parseInt(byId<HTMLSelectElement>("fontSize").value);
    payload.lineHeight = parseFloat(byId<HTMLSelectElement>("lineHeight").value);
    const resp = await fetch("/api/format", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || "请求失败" };
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: errMessage(e) };
  }
}

function renderFrame(id: string, html: string): void {
  const iframe = byId<HTMLIFrameElement>(id);
  const doc = iframe.contentDocument || iframe.contentWindow!.document;
  doc.open();
  doc.write('<html><head><meta charset="utf-8"><style>body{margin:16px auto;max-width:677px;} .mermaid{text-align:center;} .mermaid svg{max-width:100%;}</style></head><body>' + html + '<script type="module">import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";mermaid.initialize({startOnLoad:false,theme:"default"});await mermaid.run({nodes:document.querySelectorAll(".mermaid")});<\/script></body></html>');
  doc.close();
}

function doCopy(): void {
  const html = activeTab === "ai" && htmlAI ? htmlAI : htmlBasic;
  if (!html) return;
  const status = byId("status");

  const container = document.createElement("div");
  container.innerHTML = html;
  container.style.position = "fixed";
  container.style.left = "-9999px";
  document.body.appendChild(container);

  const range = document.createRange();
  range.selectNodeContents(container);
  const sel = window.getSelection()!;
  sel.removeAllRanges();
  sel.addRange(range);

  try {
    document.execCommand("copy");
    const which = activeTab === "ai" ? "AI排版" : "普通排版";
    status.innerHTML = '<span class="text-success">✅ 已复制「' + which + "」到剪贴板，去公众号编辑器 Ctrl+V 粘贴</span>";
  } catch (e) {
    status.innerHTML = '<span class="text-error">复制失败，请手动全选预览区域复制</span>';
  }

  sel.removeAllRanges();
  document.body.removeChild(container);
}

// Keyboard shortcut
byId("md").addEventListener("keydown", function (e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { runFormat(); }
});

// Sync grid checkbox to the selected theme's default (user can then override)
function syncGridToTheme(): void {
  const sel = byId<HTMLSelectElement>("theme");
  const opt = sel.options[sel.selectedIndex];
  byId<HTMLInputElement>("enableGrid").checked = !!opt && opt.getAttribute("data-grid") === "true";
}

// Theme change — sync grid default, then auto re-render if there's content
byId("theme").addEventListener("change", function () {
  syncGridToTheme();
  const md = byId<HTMLTextAreaElement>("md").value;
  if (md.trim() && htmlBasic) { runFormat(); }
});

// Checkbox changes — auto re-render
["enableAI", "enableGuide", "enableSignature", "enableFootnotes", "enableTitle", "enableGrid"].forEach(function (id) {
  byId(id).addEventListener("change", function () {
    const md = byId<HTMLTextAreaElement>("md").value;
    if (md.trim()) { runFormat(); }
  });
});

// Font size / line height changes — auto re-render
["fontSize", "lineHeight"].forEach(function (id) {
  byId(id).addEventListener("change", function () {
    const md = byId<HTMLTextAreaElement>("md").value;
    if (md.trim()) { runFormat(); }
  });
});

// Real-time preview — debounced input + auto save
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
byId("md").addEventListener("input", function (this: HTMLTextAreaElement) {
  if (debounceTimer !== null) clearTimeout(debounceTimer);
  const md = this.value;
  if (!md.trim()) return;
  debounceTimer = setTimeout(function () {
    const theme = byId<HTMLSelectElement>("theme").value;
    // fetchFormat already triggers auto-save on backend
    fetchFormat(md, theme, false).then(function (res) {
      if (res.ok) {
        htmlBasicRaw = res.data.html;
        htmlBasic = applyFontSizes(htmlBasicRaw);
        renderFrame("previewBasic", htmlBasic);
        byId("badgeBasic").textContent = res.data.stats.sections + "章";
        byId<HTMLButtonElement>("copyBtn").disabled = false;
        loadHistory();
      }
    });
  }, 1500);
});

// ─── History ─────────────────────────────────────────────────────────────

async function loadHistory(): Promise<void> {
  try {
    const resp = await fetch("/api/format-history");
    const data = await resp.json();
    const list = byId("historyList");
    const items: HistoryItem[] = data.items || [];
    const folders: string[] = data.folders || ["默认"];
    cachedFolders = folders;
    byId("historyCount").textContent = items.length + "篇";

    if (items.length === 0) {
      list.innerHTML = '<p class="p-4 text-base-content/40 text-xs">暂无排版记录</p>';
      return;
    }

    // Group by folder
    let html = "";
    for (const folder of folders) {
      const folderItems = items.filter(function (i) { return i.folder === folder; });
      const safeFolder = escHtml(folder).replace(/'/g, "\\'");
      html += '<div class="border-b border-base-300">';
      html += '<div class="flex items-center gap-1.5 px-3 py-2 cursor-pointer text-xs font-semibold text-base-content/60 bg-base-200 hover:bg-base-300" onclick="window.currentFolder=\'' + safeFolder + "';this.nextElementSibling.classList.toggle('hidden')\">";
      html += '<span class="text-sm">📁</span><span class="flex-1" ondblclick="event.stopPropagation();renameFolder(this,\'' + safeFolder + "')\">" + escHtml(folder) + "</span>";
      html += '<span class="badge badge-xs badge-ghost">' + folderItems.length + "</span>";
      html += '<button class="btn btn-ghost btn-xs btn-square text-base-content/30 hover:text-error" onclick="event.stopPropagation();deleteFolder(\'' + safeFolder + "')\" title=\"删除文件夹\">×</button>";
      html += "</div>";
      html += "<div>";
      if (folderItems.length === 0) {
        html += '<p class="px-3.5 py-2 text-base-content/40 text-xs">空文件夹</p>';
      } else {
        html += folderItems.map(function (item) {
          const date = new Date(item.createdAt + "Z").toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
          const aiBadge = item.aiEnhanced ? '<span class="badge badge-xs badge-primary">AI</span>' : "";
          return '<div class="history-item group relative px-3.5 py-2.5 border-b border-base-200 cursor-pointer hover:bg-base-200" data-id="' + item.id + '" onclick="loadHistoryItem(' + item.id + ')">' +
            '<div class="text-sm font-medium text-base-content truncate pr-6" ondblclick="event.stopPropagation();renameItem(this,' + item.id + ')">' + escHtml(item.title) + "</div>" +
            '<div class="flex gap-1.5 items-center text-xs text-base-content/40 mt-1"><span>' + date + "</span>" + aiBadge + "</div>" +
            '<button class="btn btn-ghost btn-xs btn-square absolute top-1.5 right-1.5 text-base-content/30 hover:text-error opacity-0 group-hover:opacity-100" onclick="event.stopPropagation();deleteHistoryItem(' + item.id + ')" title="删除">×</button>' +
          "</div>";
        }).join("");
      }
      html += "</div></div>";
    }
    list.innerHTML = html;
  } catch (e) {
    byId("historyList").innerHTML = '<p class="p-4 text-error text-xs">加载失败</p>';
  }
}

async function loadHistoryItem(id: number): Promise<void> {
  try {
    const resp = await fetch("/api/format-history/" + id);
    const data: HistoryDoc = await resp.json();
    if (data.markdown) {
      byId<HTMLTextAreaElement>("md").value = data.markdown;
      if (data.theme) {
        const sel = byId<HTMLSelectElement>("theme");
        for (let i = 0; i < sel.options.length; i++) {
          if (sel.options[i]!.value === data.theme) { sel.selectedIndex = i; break; }
        }
        syncGridToTheme();
      }
      // Highlight active
      document.querySelectorAll(".history-item").forEach(function (el) {
        el.classList.remove("bg-primary/10", "border-l-4", "border-l-primary");
      });
      const active = document.querySelector('.history-item[data-id="' + id + '"]');
      if (active) active.classList.add("bg-primary/10", "border-l-4", "border-l-primary");

      // Render preview
      if (data.aiEnhanced && data.html) {
        // AI result cached — show directly
        htmlAIRaw = data.html;
        htmlAI = applyFontSizes(htmlAIRaw);
        renderFrame("previewAI", htmlAI);
        byId("badgeAI").textContent = "已缓存";
        byId("tabAI").className = "tab tab-active";
        switchTab("ai");
      }
      // Always render basic via real-time format
      byId("badgeBasic").textContent = "渲染中...";
      const fmtResp = await fetchFormat(data.markdown, data.theme || "", false);
      if (fmtResp.ok) {
        htmlBasicRaw = fmtResp.data.html;
        htmlBasic = applyFontSizes(htmlBasicRaw);
        renderFrame("previewBasic", htmlBasic);
        byId("badgeBasic").textContent = fmtResp.data.stats.sections + "章";
        if (!data.aiEnhanced || !data.html) switchTab("basic");
      }
      byId<HTMLButtonElement>("copyBtn").disabled = false;
    }
  } catch (e) {
    // ignore
  }
}

async function deleteHistoryItem(id: number): Promise<void> {
  if (!confirm("删除这条排版记录？")) return;
  try {
    await fetch("/api/format-history/" + id, { method: "DELETE" });
    loadHistory();
  } catch (e) {
    // ignore
  }
}

async function deleteFolder(folderName: string): Promise<void> {
  if (!confirm("删除文件夹「" + folderName + "」及其中所有文章？")) return;
  try {
    await fetch("/api/format-history?folder=" + encodeURIComponent(folderName), { method: "DELETE" });
    loadHistory();
  } catch (e) {
    // ignore
  }
}

function renameFolder(el: HTMLElement, oldName: string): void {
  const input = document.createElement("input");
  input.className = "inline-input";
  input.value = oldName;
  input.style.width = "100%";
  el.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const newName = input.value.trim();
    if (newName && newName !== oldName) {
      fetch("/api/format-history?renameFolder=" + encodeURIComponent(oldName) + "&to=" + encodeURIComponent(newName), { method: "PATCH" })
        .then(function () { loadHistory(); });
    } else {
      loadHistory();
    }
  }
  input.onkeydown = function (e) { if (e.key === "Enter") commit(); if (e.key === "Escape") loadHistory(); };
  input.onblur = commit;
}

function renameItem(el: HTMLElement, id: number): void {
  const oldTitle = el.textContent || "";
  const input = document.createElement("input");
  input.className = "inline-input";
  input.value = oldTitle;
  input.style.width = "100%";
  el.replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const newTitle = input.value.trim();
    if (newTitle && newTitle !== oldTitle) {
      fetch("/api/format-history/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      }).then(function () { loadHistory(); });
    } else {
      loadHistory();
    }
  }
  input.onkeydown = function (e) { if (e.key === "Enter") commit(); if (e.key === "Escape") loadHistory(); };
  input.onblur = commit;
}

function escHtml(text: unknown): string {
  return String(text == null ? "" : text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── Inline create (folder / doc) ────────────────────────────────────────────

let inlineMode: "" | "folder" | "doc" = "";
let cachedFolders: string[] = ["默认"];

function showInlineInput(mode: "folder" | "doc"): void {
  inlineMode = mode;
  const box = byId("inlineInputBox");
  const input = byId<HTMLInputElement>("inlineInput");
  const folderSelect = byId<HTMLSelectElement>("inlineFolderSelect");
  box.style.display = "flex";
  input.value = "";

  if (mode === "doc") {
    // Show folder selector for doc creation
    folderSelect.style.display = "block";
    folderSelect.innerHTML = cachedFolders.map(function (f) {
      return '<option value="' + escHtml(f) + '"' + (f === window.currentFolder ? " selected" : "") + ">" + escHtml(f) + "</option>";
    }).join("");
    input.placeholder = "文章标题...";
  } else {
    folderSelect.style.display = "none";
    input.placeholder = "文件夹名称...";
  }
  input.focus();
}

function hideInlineInput(): void {
  byId("inlineInputBox").style.display = "none";
  inlineMode = "";
}

function confirmInlineInput(): void {
  if (inlineMode === "folder") createFolder();
  else if (inlineMode === "doc") createDoc();
}

function createFolder(): void {
  const name = byId<HTMLInputElement>("inlineInput").value.trim();
  if (!name) return;
  hideInlineInput();
  // Create empty folder marker
  fetch("/api/format-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: name }),
  }).then(function () { loadHistory(); });
}

function createDoc(): void {
  const title = byId<HTMLInputElement>("inlineInput").value.trim();
  if (!title) return;
  const folder = byId<HTMLSelectElement>("inlineFolderSelect").value || "默认";
  hideInlineInput();
  const md = "# " + title + "\n\n## 第一章\n\n在此开始写作，可修改章节标题和内容...\n\n## 第二章\n\n继续添加更多章节...\n";
  byId<HTMLTextAreaElement>("md").value = md;
  byId("md").focus();
  // Save to history immediately in selected folder
  fetch("/api/format", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ markdown: md, theme: byId<HTMLSelectElement>("theme").value, folder: folder }),
  }).then(function () { loadHistory(); });
}

// ─── Global exposure (inline HTML handlers call these on window) ──────────────

export {}; // mark as module so `declare global` is allowed

declare global {
  interface Window {
    currentFolder: string;
    runFormat: typeof runFormat;
    doCopy: typeof doCopy;
    switchTab: typeof switchTab;
    setFontSize: typeof setFontSize;
    resetFontSize: typeof resetFontSize;
    showInlineInput: typeof showInlineInput;
    hideInlineInput: typeof hideInlineInput;
    confirmInlineInput: typeof confirmInlineInput;
    createFolder: typeof createFolder;
    createDoc: typeof createDoc;
    loadHistoryItem: typeof loadHistoryItem;
    renameItem: typeof renameItem;
    deleteHistoryItem: typeof deleteHistoryItem;
    renameFolder: typeof renameFolder;
    deleteFolder: typeof deleteFolder;
  }
}

window.currentFolder = "默认";
Object.assign(window, {
  runFormat, doCopy, switchTab, setFontSize, resetFontSize,
  showInlineInput, hideInlineInput, confirmInlineInput, createFolder, createDoc,
  loadHistoryItem, renameItem, deleteHistoryItem, renameFolder, deleteFolder,
});

// ─── Boot ────────────────────────────────────────────────────────────────────

syncGridToTheme();
loadHistory();
