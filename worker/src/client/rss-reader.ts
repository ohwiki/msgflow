/**
 * RSS 阅读器客户端逻辑（编译成 IIFE 注入页面）。
 */

interface FeedItem {
  id: number;
  xmlUrl: string;
  title: string;
  category: string;
  intro: string;
  unread: number;
  articleCount: number;
  error: string | null;
}
interface CategoryGroup {
  category: string;
  feeds: FeedItem[];
}
interface ArticleListItem {
  id: number;
  feedId: number;
  title: string | null;
  link: string | null;
  author: string | null;
  snippet: string | null;
  enclosure: string | null;
  pubDate: number | null;
  isRead: boolean;
}
interface ArticleDetail extends ArticleListItem {
  content: string | null;
}

let selectedFeedId: number | null = null;
let selectedArticleId: number | null = null;

function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}
function setStatus(msg: string): void {
  byId("status").textContent = msg;
}
function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

/** 行内格式：在已转义文本上跑，安全（原始 HTML 已被转义；链接只放行 http/https）。 */
function inlineMd(escaped: string): string {
  return escaped
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_m, text: string, url: string) => `<a href="${url}" target="_blank" rel="noopener">${text}</a>`,
    );
}

/** 轻量 markdown → HTML。先整行转义再解析，杜绝 XSS。支持标题/列表/代码块/粗斜体/行内码/链接。 */
function renderMarkdown(src: string): string {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let inCode = false;
  let listType: "ul" | "ol" | null = null;
  let para: string[] = [];
  const flushPara = (): void => {
    if (para.length) { out.push(`<p>${inlineMd(esc(para.join(" ")))}</p>`); para = []; }
  };
  const flushList = (): void => {
    if (listType) { out.push(`</${listType}>`); listType = null; }
  };
  for (const line of lines) {
    const fence = line.trim().startsWith("```");
    if (fence) {
      flushPara(); flushList();
      if (!inCode) { out.push("<pre><code>"); inCode = true; } else { out.push("</code></pre>"); inCode = false; }
      continue;
    }
    if (inCode) { out.push(esc(line)); continue; }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara(); flushList();
      const lvl = h[1]?.length ?? 1;
      out.push(`<h${lvl}>${inlineMd(esc(h[2] ?? ""))}</h${lvl}>`);
      continue;
    }
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    const item = ul?.[1] ?? ol?.[1];
    if (item !== undefined) {
      flushPara();
      const want = ul ? "ul" : "ol";
      if (listType !== want) { flushList(); out.push(`<${want}>`); listType = want; }
      out.push(`<li>${inlineMd(esc(item))}</li>`);
      continue;
    }
    para.push(line.trim());
  }
  flushPara(); flushList();
  if (inCode) out.push("</code></pre>");
  return out.join("");
}
function fmtDate(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── 订阅源树 ─────────────────────────────────────────────

async function loadFeeds(): Promise<void> {
  const res = await fetch("/api/rss/feeds");
  const data = (await res.json()) as { categories: CategoryGroup[] };
  const tree = byId("feedTree");
  if (!data.categories.length) {
    tree.innerHTML = '<p class="p-4 text-base-content/40 text-xs">还没有订阅源，点上方「+ 订阅源」或「导入 OPML」</p>';
    return;
  }
  const html = data.categories
    .map((g) => {
      const feeds = g.feeds
        .map((f) => {
          const badge = f.unread > 0 ? `<span class="badge badge-sm badge-primary">${f.unread}</span>` : "";
          const err = f.error ? '<span class="text-error" title="抓取失败">⚠</span>' : "";
          return `<li>
            <a class="flex items-center justify-between group" onclick="selectFeed(${f.id}, '${esc(f.title).replace(/'/g, "\\'")}')">
              <span class="truncate">${esc(f.title)} ${err}</span>
              <span class="flex items-center gap-1">${badge}
                <button class="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100" onclick="event.stopPropagation();deleteFeed(${f.id})">×</button>
              </span>
            </a></li>`;
        })
        .join("");
      const total = g.feeds.reduce((s, f) => s + f.unread, 0);
      return `<details open><summary class="px-3 py-1.5 text-xs font-semibold cursor-pointer flex justify-between">
          <span>${esc(g.category)}</span>${total > 0 ? `<span class="badge badge-xs">${total}</span>` : ""}
        </summary><ul class="menu menu-sm">${feeds}</ul></details>`;
    })
    .join("");
  tree.innerHTML = html;
}

async function selectFeed(id: number, title: string): Promise<void> {
  selectedFeedId = id;
  byId("articleListTitle").textContent = title;
  await reloadArticles();
}

async function reloadArticles(): Promise<void> {
  const list = byId("articleList");
  const unreadOnly = (byId("unreadOnly") as HTMLInputElement).checked ? "&unread=1" : "";
  const feedParam = selectedFeedId ? `feed=${selectedFeedId}` : "";
  list.innerHTML = '<p class="p-4 text-base-content/40 text-xs">加载中...</p>';
  const res = await fetch(`/api/rss/articles?${feedParam}${unreadOnly}`);
  const data = (await res.json()) as { items: ArticleListItem[] };
  if (!data.items.length) {
    list.innerHTML = '<p class="p-4 text-base-content/40 text-xs">没有文章</p>';
    return;
  }
  list.innerHTML = data.items
    .map(
      (a) => `<div class="px-4 py-3 border-b border-base-200 cursor-pointer hover:bg-base-200 ${a.isRead ? "opacity-50" : ""}" id="art-${a.id}" onclick="openArticle(${a.id})">
        <div class="flex items-start gap-2">
          ${a.isRead ? "" : '<span class="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0"></span>'}
          <div class="min-w-0">
            <div class="font-medium text-sm leading-snug">${esc(a.title ?? "(无标题)")}</div>
            <div class="text-xs text-base-content/50 mt-0.5">${fmtDate(a.pubDate)}${a.author ? " · " + esc(a.author) : ""}</div>
            <div class="text-xs text-base-content/60 mt-1 line-clamp-2">${esc(a.snippet ?? "")}</div>
          </div>
        </div></div>`,
    )
    .join("");
}

async function openArticle(id: number): Promise<void> {
  selectedArticleId = id;
  const res = await fetch(`/api/rss/articles/${id}`);
  const a = (await res.json()) as ArticleDetail;
  byId("articleEmpty").classList.add("hidden");
  byId("articleView").classList.remove("hidden");
  byId("avTitle").textContent = a.title ?? "(无标题)";
  const link = a.link ? `<a href="${esc(a.link)}" target="_blank" class="link">原文</a>` : "";
  byId("avMeta").innerHTML = `${fmtDate(a.pubDate)}${a.author ? " · " + esc(a.author) : ""} ${link ? "· " + link : ""}`;
  // sandboxed iframe 渲染远程 HTML，防 XSS
  const frame = byId<HTMLIFrameElement>("avFrame");
  const body = a.content ?? "<p>（无正文，点原文查看）</p>";
  const audio = a.enclosure ? `<audio controls src="${esc(a.enclosure)}" style="width:100%"></audio>` : "";
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.7;padding:8px;color:#222;max-width:100%}img{max-width:100%;height:auto}pre{overflow-x:auto;background:#f5f5f5;padding:8px;border-radius:4px}a{color:#2563eb}</style></head><body>${audio}${body}</body></html>`;
  frame.srcdoc = doc;
  // 标已读
  const card = document.getElementById(`art-${id}`);
  if (card) card.classList.add("opacity-50");
  if (!a.isRead) {
    fetch(`/api/rss/articles/${id}/read`, { method: "POST" }).then(() => loadFeeds());
  }
}

// ─── 操作 ─────────────────────────────────────────────

function showAddFeed(): void {
  (byId("dlgAddFeed") as HTMLDialogElement).showModal();
}
function showImport(): void {
  (byId("dlgImport") as HTMLDialogElement).showModal();
}

async function submitAddFeed(): Promise<void> {
  const url = (byId("addFeedUrl") as HTMLInputElement).value.trim();
  if (!url) return;
  setStatus("添加中...");
  const res = await fetch("/api/rss/feeds", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ xmlUrl: url }),
  });
  const data = (await res.json()) as { success?: boolean; error?: string };
  (byId("dlgAddFeed") as HTMLDialogElement).close();
  (byId("addFeedUrl") as HTMLInputElement).value = "";
  setStatus(data.success ? "已添加" : `失败：${data.error}`);
  await loadFeeds();
}

async function submitImport(): Promise<void> {
  const opml = (byId("importText") as HTMLTextAreaElement).value.trim();
  if (!opml) return;
  setStatus("导入中...");
  const res = await fetch("/api/rss/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ opml }),
  });
  const data = (await res.json()) as { imported?: number; error?: string };
  (byId("dlgImport") as HTMLDialogElement).close();
  (byId("importText") as HTMLTextAreaElement).value = "";
  setStatus(data.imported !== undefined ? `已导入 ${data.imported} 个源` : `失败：${data.error}`);
  await loadFeeds();
}

async function deleteFeed(id: number): Promise<void> {
  if (!confirm("删除这个订阅源及其所有文章？")) return;
  await fetch(`/api/rss/feeds/${id}`, { method: "DELETE" });
  if (selectedFeedId === id) selectedFeedId = null;
  await loadFeeds();
  await reloadArticles();
}

async function doRefresh(): Promise<void> {
  const btn = byId<HTMLButtonElement>("refreshBtn");
  btn.disabled = true;
  setStatus("抓取中...");
  const res = await fetch("/api/rss/refresh", { method: "POST" });
  const data = (await res.json()) as { ok: number; failed: number };
  btn.disabled = false;
  setStatus(`抓取完成：成功 ${data.ok}，失败 ${data.failed}`);
  await loadFeeds();
  await reloadArticles();
}

// ─── AI 助手 ─────────────────────────────────────────────

async function callAi(payload: Record<string, unknown>): Promise<void> {
  const box = byId("aiReply");
  box.classList.remove("hidden");
  box.textContent = "思考中...";
  const btn = byId<HTMLButtonElement>("aiRunBtn");
  btn.disabled = true;
  try {
    const res = await fetch("/api/rss/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { reply?: string; error?: string };
    if (data.reply) box.innerHTML = `<div class="md-body">${renderMarkdown(data.reply)}</div>`;
    else box.textContent = data.error ?? "（无回复）";
  } catch (e) {
    box.textContent = "请求失败：" + (e instanceof Error ? e.message : "unknown");
  } finally {
    btn.disabled = false;
  }
}

function runAiCommand(): void {
  const cmd = (byId("aiCommand") as HTMLSelectElement).value;
  const feedCommands = ["/digest", "/intro", "/recommend"];
  if (feedCommands.includes(cmd)) {
    if (!selectedFeedId) {
      byId("aiReply").classList.remove("hidden");
      byId("aiReply").textContent = "请先在左侧选择一个订阅源";
      return;
    }
    void callAi({ command: cmd, feedId: selectedFeedId });
  } else {
    if (!selectedArticleId) {
      byId("aiReply").classList.remove("hidden");
      byId("aiReply").textContent = "请先选择一篇文章";
      return;
    }
    void callAi({ command: cmd, articleId: selectedArticleId });
  }
}

function runAiFree(): void {
  const q = (byId("aiQuestion") as HTMLInputElement).value.trim();
  if (!q) return;
  void callAi({ command: "", question: q, articleId: selectedArticleId ?? undefined });
  (byId("aiQuestion") as HTMLInputElement).value = "";
}

// ─── 暴露到 window（供 inline handler 调用） ──────────────

Object.assign(window, {
  selectFeed,
  reloadArticles,
  openArticle,
  showAddFeed,
  showImport,
  submitAddFeed,
  submitImport,
  deleteFeed,
  doRefresh,
  runAiCommand,
  runAiFree,
});

// 初始化
void loadFeeds();
