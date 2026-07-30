/**
 * Quota Service — orchestrates key querying with proper error handling and logging.
 *
 * Responsibilities:
 * - Parse keys text ↔ JSON conversion
 * - Mask raw keys for display (never expose originals)
 * - Query upstream via IQuotaClient interface
 * - Aggregate parallel results
 */

import { AppError } from "../lib/errors.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry, QuotaKeyInfo, QuotaResult, IQuotaClient } from "../types/quota.js";

/** In-flight upstream requests. Not a cap on key count — all keys are queried, in batches. */
const QUERY_CONCURRENCY = 6;
const DAY_MS = 86_400_000;

// ─── EasyClaude Client (implements IQuotaClient) ────────

const EASYCLAUDE_UPSTREAM = "https://easyclaude.com/app/login";
const FETCH_TIMEOUT_MS = 15_000;

export class EasyClaudeClient implements IQuotaClient {
  async query(apiKey: string): Promise<QuotaKeyInfo> {
    const resp = await fetch(EASYCLAUDE_UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 msgflow-quota/1.0",
      },
      body: JSON.stringify({ api_key: apiKey }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!resp.ok) {
      throw new QuotaUpstreamError(`HTTP ${resp.status}`);
    }

    const data = await resp.json<EasyClaudeResponse>();

    if (data.status !== 0) {
      const msg = data.info || "查询失败";
      if (data.status === 100 || data.status === 401 || data.status === 403) {
        throw new QuotaAuthError(msg);
      }
      throw new QuotaUpstreamError(msg);
    }

    const raw = data.data?.key_info;
    if (!raw) {
      throw new QuotaUpstreamError("上游响应缺少 key_info");
    }

    return parseKeyInfo(raw);
  }
}

// ─── Service ────────────────────────────────────────────

export class QuotaService {
  constructor(
    private client: IQuotaClient,
    private log: Logger,
  ) {}

  /** Query a single key, returning a safe QuotaResult (never throws). */
  async queryOne(entry: QuotaKeyEntry): Promise<QuotaResult> {
    const masked = maskKey(entry.key);
    this.log.info("quota_query_start", { label: entry.label, masked });

    try {
      const keyInfo = await this.client.query(entry.key);
      this.log.info("quota_query_ok", { label: entry.label, remain: String(keyInfo.remain_quota) });
      return { label: entry.label, masked, rawKey: entry.key, ok: true, key_info: keyInfo };
    } catch (e) {
      const info = e instanceof AppError ? e.message : (e instanceof Error ? e.message : "未知错误");
      this.log.warn("quota_query_failed", { label: entry.label, masked, error: info });
      return { label: entry.label, masked, rawKey: entry.key, ok: false, info };
    }
  }

  /**
   * Query every key, at most QUERY_CONCURRENCY in flight at a time.
   * Results keep the input order regardless of which request settles first.
   */
  async queryAll(entries: QuotaKeyEntry[]): Promise<QuotaResult[]> {
    this.log.info("quota_query_batch", { count: String(entries.length) });
    const results = new Array<QuotaResult>(entries.length);
    let next = 0;
    const worker = async () => {
      while (next < entries.length) {
        const i = next++;
        results[i] = await this.queryOne(entries[i]!);
      }
    };
    const size = Math.min(QUERY_CONCURRENCY, entries.length);
    await Promise.all(Array.from({ length: size }, worker));
    return results;
  }
}

// ─── Key Parsing ────────────────────────────────────────

/** Parse "label = sk-xxx" text format into structured entries. */
export function parseKeysText(text: string): QuotaKeyEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line): QuotaKeyEntry | null => {
      if (line.includes("=")) {
        const idx = line.indexOf("=");
        const label = line.slice(0, idx).trim();
        const key = line.slice(idx + 1).trim();
        if (!key) return null;
        return { label: label || maskKey(key), key };
      }
      return { label: maskKey(line), key: line };
    })
    .filter((e): e is QuotaKeyEntry => e !== null && e.key.length > 0);
}

/** Convert structured entries back to editable text. */
export function entriesToText(entries: QuotaKeyEntry[]): string {
  return entries.map((e) => `${e.label} = ${e.key}`).join("\n");
}

/** Mask API key for safe display. Never expose the original. */
export function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 4) + "***";
  return key.slice(0, 6) + "..." + key.slice(-4);
}

// ─── Domain Errors ──────────────────────────────────────

export class QuotaUpstreamError extends AppError {
  constructor(reason: string) {
    super(reason, "QUOTA_UPSTREAM_ERROR", 502);
  }
}

export class QuotaAuthError extends AppError {
  constructor(reason: string) {
    super(reason, "QUOTA_AUTH_ERROR", 401);
  }
}

// ─── Private Helpers ────────────────────────────────────

interface EasyClaudeResponse {
  status?: number;
  info?: string;
  data?: { key_info?: Record<string, unknown> };
}

function parseKeyInfo(raw: Record<string, unknown>): QuotaKeyInfo {
  return {
    name: String(raw.name ?? ""),
    total_quota: Number(raw.total_quota ?? 0),
    used_quota: Number(raw.used_quota ?? 0),
    remain_quota: Number(raw.remain_quota ?? 0),
    usage_percentage: raw.usage_percentage != null ? Number(raw.usage_percentage) : null,
    remaining_percentage: raw.remaining_percentage != null ? Number(raw.remaining_percentage) : null,
    status: Number(raw.status ?? 0),
    created_time: String(raw.created_time ?? ""),
    expired_time: String(raw.expired_time ?? ""),
    key_flag: String(raw.key_flag ?? ""),
    group: String(raw.group ?? ""),
    upstream_id: String(raw.id ?? ""),
  };
}

// ─── View Model Helpers (data prep for Mustache) ────────

export interface QuotaCardViewModel {
  // identity
  label: string;
  masked: string;
  rawKey: string;
  ok: boolean;
  info?: string;
  // status
  statusOk?: boolean;
  // quota numbers (formatted)
  remainShort?: string;
  remainFull?: string;
  usedFull?: string;
  totalFull?: string;
  pctNum?: number;
  usagePct?: number;
  quotaName?: string;
  // timeline
  remainText?: string;
  isExpired?: boolean;
  isUrgent?: boolean;
  daysUnknown?: boolean;
  timelinePct?: number;
  timelineColor?: string;
  createdFmt?: string;
  expiredFmt?: string;
}

/** Transform raw QuotaResult[] into view models ready for Mustache. */
export function toCardViewModels(results: QuotaResult[]): QuotaCardViewModel[] {
  return results.map(toCardViewModel);
}

function toCardViewModel(r: QuotaResult): QuotaCardViewModel {
  if (!r.ok) {
    return { label: r.label, masked: r.masked, rawKey: r.rawKey, ok: false, info: r.info || "查询失败" };
  }

  const k = r.key_info!;
  const pct = k.remaining_percentage ?? (k.total_quota > 0 ? (k.remain_quota / k.total_quota) * 100 : 0);
  const pctNum = Math.min(100, Math.max(0, Math.round(pct)));
  const usagePct = 100 - pctNum;

  const start = parseDateStr(k.created_time);
  const end = parseDateStr(k.expired_time);
  const now = Date.now();

  const remainMs = end == null ? NaN : end - now;
  const expired = !isNaN(remainMs) && remainMs <= 0;

  let timelinePct = 50;
  if (start != null && end != null && end > start) {
    timelinePct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  }
  const timelineColor = timelinePct > 80 ? "#f87171" : timelinePct > 60 ? "#fbbf24" : "#3b82f6";

  return {
    label: r.label,
    masked: r.masked,
    rawKey: r.rawKey,
    ok: true,
    statusOk: k.status === 1,
    remainShort: k.remain_quota.toFixed(1),
    remainFull: k.remain_quota.toFixed(2),
    usedFull: k.used_quota.toFixed(2),
    totalFull: k.total_quota.toFixed(2),
    pctNum,
    usagePct,
    quotaName: k.name || "—",
    remainText: isNaN(remainMs) ? undefined : formatRemaining(remainMs),
    isExpired: expired,
    isUrgent: !expired && remainMs < 5 * DAY_MS,
    daysUnknown: isNaN(remainMs),
    timelinePct,
    timelineColor,
    createdFmt: formatDate(k.created_time),
    expiredFmt: formatDate(k.expired_time),
  };
}

// ─── List rows ──────────────────────────────────────────

export interface QuotaRowViewModel {
  id: string;
  label: string;
  masked: string;
  rawKey: string;
  ok: boolean;
  info?: string;
  statusOk?: boolean;
  pctNum?: number;
  pctColor?: string;
  remainFull?: string;
  totalFull?: string;
  remainText?: string;
  isExpired?: boolean;
  isUrgent?: boolean;
  daysUnknown?: boolean;
}

/** Compact one-row-per-key models for the list page. */
export function toRowViewModels(results: QuotaResult[]): QuotaRowViewModel[] {
  return results.map((r) => {
    const c = toCardViewModel(r);
    return {
      id: keyId(r.rawKey),
      label: c.label,
      masked: c.masked,
      rawKey: c.rawKey,
      ok: c.ok,
      info: c.info,
      statusOk: c.statusOk,
      pctNum: c.pctNum,
      pctColor: c.pctNum == null ? undefined : quotaColor(c.pctNum),
      remainFull: c.remainFull,
      totalFull: c.totalFull,
      remainText: c.remainText,
      isExpired: c.isExpired,
      isUrgent: c.isUrgent,
      daysUnknown: c.daysUnknown,
    };
  });
}

/** Bar colour by remaining quota — mirrors the timelineColor convention. */
function quotaColor(pctNum: number): string {
  return pctNum <= 10 ? "#f87171" : pctNum <= 30 ? "#fbbf24" : "#3b82f6";
}

// ─── Detail page ────────────────────────────────────────

export interface QuotaDetailViewModel extends QuotaCardViewModel {
  id: string;
  keyFlag?: string;
  group?: string;
  upstreamId?: string;
}

/** Full model for the detail page: everything on the card plus upstream metadata. */
export function toDetailViewModel(r: QuotaResult): QuotaDetailViewModel {
  const c = toCardViewModel(r);
  const k = r.key_info;
  return {
    ...c,
    id: keyId(r.rawKey),
    keyFlag: k?.key_flag || "—",
    group: k?.group || "—",
    upstreamId: k?.upstream_id || "—",
  };
}

/** Format "2026-07-02 18:17:33" → "2026/7/2 18:17:33" */
export function formatDate(s: string): string {
  if (!s) return "—";
  const parts = s.split(" ");
  const d = (parts[0] || "").split("-");
  const t = parts[1] || "00:00:00";
  if (d.length !== 3) return s;
  return `${d[0]}/${+(d[1] || 0)}/${+(d[2] || 0)} ${t}`;
}

/**
 * Stable short handle for a key, used as the detail-page URL segment.
 * FNV-1a-32 — synchronous by design, since the view-model layer is sync.
 * Not a secret and not a capability: the route sits behind authMiddleware.
 */
export function keyId(key: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Remaining duration as "3 天 5 小时" / "7 小时" / "42 分钟". Floors, so it never overstates. */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return "已到期";
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  if (days > 0) return hours > 0 ? `${days} 天 ${hours} 小时` : `${days} 天`;
  if (hours > 0) return `${hours} 小时`;
  return `${totalMin} 分钟`;
}

/**
 * Upstream sends wall-clock strings with no offset ("2026-07-30 23:59:59").
 * Workers run in UTC, so they must be pinned to Beijing time explicitly.
 */
export function parseDateStr(s: string): number | null {
  if (!s) return null;
  const m = s.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) {
    const loose = Date.parse(s);
    return isNaN(loose) ? null : loose;
  }
  const n = (i: number) => Number(m[i]);
  return Date.UTC(n(1), n(2) - 1, n(3), n(4) - 8, n(5), n(6));
}
