/**
 * RSS 抓取服务 —— 后端抓取 + 解析 + 去重入库。
 *
 * Worker 无 DOMParser，用 fast-xml-parser 解析 XML。
 * 兼容 RSS 2.0（rss.channel.item）和 Atom（feed.entry）。
 */

import { XMLParser } from "fast-xml-parser";
import { fetchWithTimeout } from "../lib/http.js";
import { RssRepository } from "../repositories/rss-repository.js";
import { genericFetcher } from "../fetchers/generic.js";
import { marked } from "marked";
import type { NormalizedItem, RssFeed, RssArticle } from "../types/rss.js";
import type { Logger } from "../lib/log.js";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  isArray: (name) => name === "item" || name === "entry",
});

/** 取出可能是 { "#text": v } 或字符串的字段值。 */
function text(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o["#text"] === "string") return o["#text"];
    if (typeof o["#text"] === "number") return String(o["#text"]);
  }
  return "";
}

/** 去 HTML 标签，取前 N 字作为摘要。 */
export function makeSnippet(html: string, len = 200): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, len);
}

function parseDate(s: string): number | null {
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isNaN(t) ? null : t;
}

/** Atom link 可能是数组或对象，取 rel=alternate 或首个的 href。 */
function atomLink(link: unknown): string {
  if (!link) return "";
  const arr = Array.isArray(link) ? link : [link];
  const alt = arr.find((l) => (l as Record<string, unknown>)?.["@_rel"] === "alternate");
  const chosen = alt ?? arr[0];
  const href = (chosen as Record<string, unknown>)?.["@_href"];
  return typeof href === "string" ? href : text(chosen);
}

interface ParsedFeed {
  feedTitle: string;
  siteUrl: string;
  items: NormalizedItem[];
}

const opmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", isArray: (name) => name === "outline" });

/** 解析 OPML，展开嵌套 outline，返回 { xmlUrl, title, category }。分类取父 outline 的 text/title。 */
export function parseOpml(xml: string): { xmlUrl: string; title: string; category: string }[] {
  const doc = opmlParser.parse(xml) as Record<string, unknown>;
  const opml = doc.opml as Record<string, unknown> | undefined;
  const body = opml?.body as Record<string, unknown> | undefined;
  if (!body) return [];
  const out: { xmlUrl: string; title: string; category: string }[] = [];

  const walk = (nodes: Record<string, unknown>[], category: string): void => {
    for (const n of nodes) {
      const xmlUrl = typeof n["@_xmlUrl"] === "string" ? (n["@_xmlUrl"] as string) : "";
      const label = (n["@_text"] as string) || (n["@_title"] as string) || "";
      const children = n.outline as Record<string, unknown>[] | undefined;
      if (xmlUrl) {
        out.push({ xmlUrl, title: label || xmlUrl, category: category || "未分类" });
      } else if (children) {
        // 无 xmlUrl 的 outline 视为分类节点
        walk(children, label || category);
      }
    }
  };

  const top = body.outline as Record<string, unknown>[] | undefined;
  if (top) walk(top, "");
  return out;
}

/** 解析 XML 文本为归一化的源 + 条目。 */
export function parseFeedXml(xml: string): ParsedFeed {
  const doc = parser.parse(xml) as Record<string, unknown>;

  // RSS 2.0
  const rss = doc.rss as Record<string, unknown> | undefined;
  if (rss?.channel) {
    const ch = rss.channel as Record<string, unknown>;
    const rawItems = (ch.item as Record<string, unknown>[]) ?? [];
    const items = rawItems.map((it): NormalizedItem => {
      const link = text(it.link);
      const guid = text(it.guid) || link || text(it.title);
      const content = text(it["content:encoded"]) || text(it.description);
      const enc = it.enclosure as Record<string, unknown> | undefined;
      const enclosure = enc && typeof enc["@_url"] === "string" ? (enc["@_url"] as string) : "";
      return {
        guid,
        title: text(it.title),
        link,
        author: text(it["dc:creator"]) || text(it.author),
        content,
        snippet: makeSnippet(content),
        enclosure,
        pubDate: parseDate(text(it.pubDate) || text(it["dc:date"])),
      };
    });
    return { feedTitle: text(ch.title), siteUrl: text(ch.link), items };
  }

  // Atom
  const feed = doc.feed as Record<string, unknown> | undefined;
  if (feed) {
    const rawEntries = (feed.entry as Record<string, unknown>[]) ?? [];
    const items = rawEntries.map((e): NormalizedItem => {
      const link = atomLink(e.link);
      const guid = text(e.id) || link || text(e.title);
      const content = text(e.content) || text(e.summary);
      const author = e.author as Record<string, unknown> | undefined;
      return {
        guid,
        title: text(e.title),
        link,
        author: author ? text(author.name) : "",
        content,
        snippet: makeSnippet(content),
        enclosure: "",
        pubDate: parseDate(text(e.updated) || text(e.published)),
      };
    });
    return { feedTitle: text(feed.title), siteUrl: atomLink(feed.link), items };
  }

  return { feedTitle: "", siteUrl: "", items: [] };
}

/** 抓取单个源并入库。返回新增文章数；失败抛错（由调用方记录 error）。 */
export async function fetchFeed(feed: RssFeed, repo: RssRepository): Promise<number> {
  const now = Date.now();
  try {
    const resp = await fetchWithTimeout(feed.xml_url, {
      timeoutMs: 15_000,
      headers: { "user-agent": "msgflow-rss/1.0", accept: "application/rss+xml, application/atom+xml, application/xml, text/xml, */*" },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const xml = await resp.text();
    const parsed = parseFeedXml(xml);
    const inserted = await repo.upsertArticles(feed.id, parsed.items);
    const total = await repo.countArticles(feed.id);
    await repo.updateFeedMeta(feed.id, {
      lastFetch: now,
      lastSuccess: now,
      error: null,
      articleCount: total,
      title: parsed.feedTitle || undefined,
    });
    return inserted;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    await repo.updateFeedMeta(feed.id, { lastFetch: now, error: msg });
    throw e;
  }
}

/** 判断正文是否够“实”（RSS 常只给标题/等长描述，需回源抓全文）。 */
function hasRealContent(article: RssArticle): boolean {
  const plain = (article.content ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const title = (article.title ?? "").trim();
  // 空、过短、或正文≈标题（description==title 的常见情况）都算“不实”。
  if (plain.length < 200) return false;
  if (title && plain.slice(0, title.length) === title && plain.length < title.length + 80) return false;
  return true;
}

/**
 * 确保文章有可用全文：若 RSS 只给了标题/短描述，回源用 genericFetcher 抓全文，
 * 抓到则缓存回 D1（content/snippet）并返回更新后的文章。抓取失败则原样返回。
 */
export async function ensureArticleContent(
  article: RssArticle,
  repo: RssRepository,
  env: Env,
  log: Logger,
): Promise<RssArticle> {
  if (hasRealContent(article)) return article;
  if (!article.link) return article;
  try {
    const result = await genericFetcher.fetch(article.link, env, log);
    const raw = result.html?.trim() ?? "";
    if (raw.length < 200) {
      log.warn("rss_fulltext_too_short", { id: String(article.id), chars: String(raw.length) });
      return article;
    }
    // genericFetcher 返回 markdown；转成 HTML 以便阅读器 iframe 渲染。
    const looksHtml = /<(p|div|article|section|h[1-6]|ul|ol|pre|img)[\s>]/i.test(raw);
    const content = looksHtml ? raw : await marked.parse(raw);
    const snippet = makeSnippet(content);
    await repo.updateArticleContent(article.id, content, snippet);
    log.info("rss_fulltext_ok", { id: String(article.id), chars: String(content.length) });
    return { ...article, content, snippet };
  } catch (e) {
    log.warn("rss_fulltext_failed", { id: String(article.id), error: e instanceof Error ? e.message : "unknown" });
    return article;
  }
}

/** 小并发池执行。 */
async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (item === undefined) break;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

/** cron/手动触发：抓取最久未更新的 N 个源，小并发轮转。 */
export async function refreshDueFeeds(env: Env, log: Logger, limit = 40): Promise<{ ok: number; failed: number }> {
  const repo = new RssRepository(env.DB);
  const feeds = await repo.getDueFeeds(limit);
  let ok = 0;
  let failed = 0;
  await pool(feeds, 6, async (feed) => {
    try {
      const n = await fetchFeed(feed, repo);
      ok += 1;
      log.info("rss_fetch_ok", { feed: String(feed.id), inserted: String(n) });
    } catch (e) {
      failed += 1;
      log.warn("rss_fetch_failed", { feed: String(feed.id), url: feed.xml_url, error: e instanceof Error ? e.message : "unknown" });
    }
  });
  return { ok, failed };
}
