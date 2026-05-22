/**
 * Constants — all magic strings, URLs, patterns centralized here.
 */

// ─── KV Keys ────────────────────────────────────────────
export const KV_KEY = {
  AUTH_CONFIG: "auth_config",
  SESSION_PREFIX: "session:",
  RSS_SOURCES: "rss_sources",
  CRON_CONFIG: "cron_config",
} as const;

// ─── Article Status ─────────────────────────────────────
export const ARTICLE_STATUS = {
  RAW: "raw",
  CLEANED: "cleaned",
  REWRITTEN: "rewritten",
  PUBLISHED: "published",
} as const;

// ─── Source Types ───────────────────────────────────────
export const SOURCE_TYPE = {
  WEIXIN: "weixin",
  FEISHU: "feishu",
  RSS: "rss",
  TWITTER: "twitter",
  WEB: "web",
} as const;

// ─── External Service URLs ──────────────────────────────
export const EXTERNAL_URL = {
  JINA_PROXY: "https://r.jina.ai",
  DEFUDDLE_PROXY: "https://md.dhr.wtf",
  FEISHU_API_BASE: "https://open.feishu.cn/open-apis",
  FEISHU_TOKEN_ENDPOINT: "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal",
  GITHUB_API: "https://api.github.com",
  GITLAB_API: "https://gitlab.com/api/v4",
} as const;

// ─── URL Match Patterns (used by fetchers + detectSourceType) ──
export const URL_PATTERN = {
  WEIXIN: ["mp.weixin.qq.com"],
  FEISHU: ["feishu.cn", "larksuite.com"],
  TWITTER: ["twitter.com", "x.com"],
  RSS_SUFFIX: [".xml"],
  RSS_PATH: ["/feed", "/rss"],
} as const;

// ─── CDN Assets ─────────────────────────────────────────
export const CDN = {
  DAISYUI_CSS: "https://cdn.jsdelivr.net/npm/daisyui@5",
  DAISYUI_THEMES: "https://cdn.jsdelivr.net/npm/daisyui@5/themes.css",
  TAILWIND_BROWSER: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
  HTMX: "https://unpkg.com/htmx.org@2.0.4",
} as const;

// ─── HTTP Headers ───────────────────────────────────────
export const HEADERS = {
  WEIXIN_REFERER: "https://mp.weixin.qq.com",
  DEFAULT_UA: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  BOT_UA: "Mozilla/5.0 (compatible; msgflow/1.0)",
} as const;

// ─── HTTP Status Codes ──────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  MOVED: 302,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
} as const;

// ─── Defaults ───────────────────────────────────────────
export const DEFAULTS = {
  FETCH_TIMEOUT_MS: 15_000,
  PROXY_TIMEOUT_MS: 10_000,
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// ─── Helper: detect source type from URL ────────────────
export function detectSourceType(url: string): string {
  if (URL_PATTERN.WEIXIN.some((p) => url.includes(p))) return SOURCE_TYPE.WEIXIN;
  if (URL_PATTERN.FEISHU.some((p) => url.includes(p))) return SOURCE_TYPE.FEISHU;
  if (URL_PATTERN.TWITTER.some((p) => url.includes(p))) return SOURCE_TYPE.TWITTER;
  if (URL_PATTERN.RSS_SUFFIX.some((s) => url.endsWith(s))) return SOURCE_TYPE.RSS;
  if (URL_PATTERN.RSS_PATH.some((p) => url.includes(p))) return SOURCE_TYPE.RSS;
  return SOURCE_TYPE.WEB;
}

// ─── Helper: check URL matches patterns ─────────────────
export function urlMatches(url: string, patterns: readonly string[]): boolean {
  return patterns.some((p) => url.includes(p));
}
