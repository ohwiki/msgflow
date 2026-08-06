/**
 * Fenno Service — queries api.fenno.ai usage and builds view models.
 *
 * Mirrors QuotaService's shape (queryOne never throws, queryAll bounds concurrency
 * and preserves input order) and reuses its formatters, but keeps its own parsing:
 * fenno's error envelope is {code, message} where EasyClaude's is {status, info}.
 */

import { AppError } from "../lib/errors.js";
import type { Logger } from "../lib/log.js";
import type { QuotaKeyEntry } from "../types/quota.js";
import type {
  FennoDailyEntry,
  FennoModelStat,
  FennoResult,
  FennoSubscription,
  FennoUsage,
  FennoUsageBlock,
  IFennoClient,
} from "../types/fenno.js";
import { formatRemaining, keyId, maskKey } from "./quota-service.js";

const FENNO_UPSTREAM = "https://api.fenno.ai/v1/usage";
const FETCH_TIMEOUT_MS = 15_000;
const QUERY_CONCURRENCY = 6;
const DAY_MS = 86_400_000;

// ─── Domain Errors ──────────────────────────────────────

export class FennoUpstreamError extends AppError {
  constructor(reason: string) {
    super(reason, "FENNO_UPSTREAM_ERROR", 502);
  }
}

export class FennoAuthError extends AppError {
  constructor(reason: string) {
    super(reason, "FENNO_AUTH_ERROR", 401);
  }
}

// ─── Client ─────────────────────────────────────────────

export class FennoClient implements IFennoClient {
  async query(apiKey: string): Promise<FennoUsage> {
    const resp = await fetch(FENNO_UPSTREAM, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "msgflow-quota/1.0",
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    // Upstream replies with content-type: text/plain, so parse the body ourselves.
    const text = await resp.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new FennoUpstreamError(`响应非 JSON (HTTP ${resp.status})`);
    }

    if (!resp.ok) {
      const err = data as { code?: string; message?: string };
      const msg = err.message || err.code || `HTTP ${resp.status}`;
      if (resp.status === 401 || resp.status === 403) throw new FennoAuthError(msg);
      throw new FennoUpstreamError(msg);
    }

    return parseUsage(data as Record<string, unknown>);
  }
}

// ─── Service ────────────────────────────────────────────

export class FennoService {
  constructor(
    private client: IFennoClient,
    private log: Logger,
  ) {}

  /** Query a single key, returning a safe FennoResult (never throws). */
  async queryOne(entry: QuotaKeyEntry): Promise<FennoResult> {
    const masked = maskKey(entry.key);
    this.log.info("fenno_query_start", { label: entry.label, masked });

    try {
      const usage = await this.client.query(entry.key);
      this.log.info("fenno_query_ok", { label: entry.label, remaining: String(usage.dailyRemaining) });
      return { label: entry.label, masked, rawKey: entry.key, ok: true, usage };
    } catch (e) {
      const info = e instanceof AppError ? e.message : e instanceof Error ? e.message : "未知错误";
      this.log.warn("fenno_query_failed", { label: entry.label, masked, error: info });
      return { label: entry.label, masked, rawKey: entry.key, ok: false, info };
    }
  }

  /** Query every key, at most QUERY_CONCURRENCY in flight. Order follows the input. */
  async queryAll(entries: QuotaKeyEntry[]): Promise<FennoResult[]> {
    this.log.info("fenno_query_batch", { count: String(entries.length) });
    const results = new Array<FennoResult>(entries.length);
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

// ─── Parsing ────────────────────────────────────────────

const num = (v: unknown): number => {
  const n = Number(v ?? 0);
  return isFinite(n) ? n : 0;
};

function parseBlock(raw: Record<string, unknown> | undefined): FennoUsageBlock {
  const r = raw ?? {};
  return {
    requests: num(r.requests),
    input_tokens: num(r.input_tokens),
    output_tokens: num(r.output_tokens),
    // Daily entries call this cache_write_tokens; per-model and today/total use cache_creation_tokens.
    cache_creation_tokens: num(r.cache_creation_tokens ?? r.cache_write_tokens),
    cache_read_tokens: num(r.cache_read_tokens),
    total_tokens: num(r.total_tokens),
    cost: num(r.cost),
    actual_cost: num(r.actual_cost),
  };
}

function parseSubscription(raw: Record<string, unknown> | undefined): FennoSubscription {
  const s = raw ?? {};
  return {
    daily_limit_usd: num(s.daily_limit_usd),
    daily_usage_usd: num(s.daily_usage_usd),
    weekly_limit_usd: num(s.weekly_limit_usd),
    weekly_usage_usd: num(s.weekly_usage_usd),
    monthly_limit_usd: num(s.monthly_limit_usd),
    monthly_usage_usd: num(s.monthly_usage_usd),
    weekly_window_start: String(s.weekly_window_start ?? ""),
    expires_at: String(s.expires_at ?? ""),
  };
}

export function parseUsage(raw: Record<string, unknown>): FennoUsage {
  const usage = (raw.usage ?? {}) as Record<string, unknown>;
  const rawModels = raw.model_stats;
  const subscription = parseSubscription(raw.subscription as Record<string, unknown> | undefined);
  const today = parseBlock(usage.today as Record<string, unknown> | undefined);

  // Derive today's spend from usage.today, not subscription.daily_usage_usd: once a key
  // exhausts its daily cap, upstream leaves daily_usage_usd (and the `remaining` it feeds)
  // frozen at yesterday's total past midnight, while usage.today resets to 0 on schedule.
  const dailyUsed = today.cost;
  const dailyRemaining = Math.max(0, subscription.daily_limit_usd - dailyUsed);

  return {
    isValid: raw.isValid === true,
    mode: String(raw.mode ?? ""),
    planName: String(raw.planName ?? ""),
    remaining: num(raw.remaining),
    unit: String(raw.unit ?? "USD"),
    dailyUsed,
    dailyRemaining,
    subscription,
    today,
    total: parseBlock(usage.total as Record<string, unknown> | undefined),
    rpm: num(usage.rpm),
    tpm: num(usage.tpm),
    averageDurationMs: num(usage.average_duration_ms),
    daily: Array.isArray(raw.daily_usage)
      ? raw.daily_usage.map((d): FennoDailyEntry => {
          const e = d as Record<string, unknown>;
          return { ...parseBlock(e), date: String(e.date ?? ""), cache_write_tokens: num(e.cache_write_tokens) };
        })
      : [],
    ...(Array.isArray(rawModels)
      ? {
          models: rawModels.map((m): FennoModelStat => {
            const e = m as Record<string, unknown>;
            return { ...parseBlock(e), model: String(e.model ?? ""), account_cost: num(e.account_cost) };
          }),
        }
      : {}),
  };
}

// ─── Formatting helpers ─────────────────────────────────

/** Bar colour by remaining percentage — same bands as the quota list. */
function pctColorOf(pct: number): string {
  return pct <= 10 ? "#f87171" : pct <= 30 ? "#fbbf24" : "#3b82f6";
}

/** Thousands separators, no decimals — for token counts. */
function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Fenno timestamps carry an explicit offset ("...+08:00"), unlike EasyClaude's
 * bare wall-clock strings. Date.parse honours the offset, so don't route these
 * through parseDateStr — it force-pins +08:00 and would misread any other offset.
 */
export function parseIso(s: string): number | null {
  if (!s) return null;
  const ms = Date.parse(s);
  return isNaN(ms) ? null : ms;
}

/** ISO-8601 with offset → "2026/9/4 15:33:44" in Beijing time. */
export function formatIsoDate(s: string): string {
  const ms = parseIso(s);
  if (ms == null) return "—";
  const d = new Date(ms + 8 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

// ─── List rows ──────────────────────────────────────────

/** Field-compatible with QuotaRowViewModel so both providers share quota-rows.mustache. */
export interface FennoRowViewModel {
  provider: string;
  id: string;
  label: string;
  masked: string;
  rawKey: string;
  ok: boolean;
  info?: string;
  statusOk?: boolean;
  pctNum?: number;
  pctColor?: string;
  /** Renders before the percentage. fenno's percentage is a daily figure, not a balance. */
  pctLabel?: string;
  remainText?: string;
  isExpired?: boolean;
  isUrgent?: boolean;
  daysUnknown?: boolean;
}

export function toFennoRowViewModels(results: FennoResult[]): FennoRowViewModel[] {
  return results.map((r) => {
    const base = { provider: "fenno", id: keyId(r.rawKey), label: r.label, masked: r.masked, rawKey: r.rawKey };
    if (!r.ok) return { ...base, ok: false, info: r.info || "查询失败" };

    const u = r.usage!;
    const limit = u.subscription.daily_limit_usd;
    const pctNum = limit > 0 ? Math.min(100, Math.max(0, Math.round((u.dailyRemaining / limit) * 100))) : 0;
    const end = parseIso(u.subscription.expires_at);
    const remainMs = end == null ? NaN : end - Date.now();
    const expired = !isNaN(remainMs) && remainMs <= 0;

    return {
      ...base,
      ok: true,
      statusOk: u.isValid,
      pctNum,
      pctColor: pctColorOf(pctNum),
      pctLabel: limit > 0 ? "今日" : "不限",
      remainText: isNaN(remainMs) ? undefined : formatRemaining(remainMs),
      isExpired: expired,
      isUrgent: !expired && remainMs < 5 * DAY_MS,
      daysUnknown: isNaN(remainMs),
    };
  });
}

// ─── Detail page ────────────────────────────────────────

export interface SpendCapViewModel {
  name: string;
  usedFmt: string;
  limitFmt: string;
  pct: number;
  color: string;
  /** True when the upstream limit is 0, which means "no cap" rather than "no budget". */
  unlimited: boolean;
}

export interface UsageBlockViewModel {
  requests: string;
  inputTokens: string;
  outputTokens: string;
  cacheReadTokens: string;
  totalTokens: string;
  costFmt: string;
}

export interface FennoModelRowViewModel {
  model: string;
  requests: string;
  totalTokens: string;
  costFmt: string;
}

export interface FennoDailyRowViewModel {
  date: string;
  requests: string;
  totalTokens: string;
  costFmt: string;
}

export interface FennoDetailViewModel {
  id: string;
  label: string;
  masked: string;
  rawKey: string;
  ok: boolean;
  info?: string;
  statusOk?: boolean;
  planName?: string;
  mode?: string;
  unit?: string;
  remainingFmt?: string;
  caps?: SpendCapViewModel[];
  remainText?: string;
  isExpired?: boolean;
  isUrgent?: boolean;
  daysUnknown?: boolean;
  expiresFmt?: string;
  weekStartFmt?: string;
  today?: UsageBlockViewModel;
  total?: UsageBlockViewModel;
  rpm?: string;
  tpm?: string;
  avgDuration?: string;
  hasModels?: boolean;
  models?: FennoModelRowViewModel[];
  hasDaily?: boolean;
  daily?: FennoDailyRowViewModel[];
}

function toBlockVm(b: FennoUsageBlock, unit: string): UsageBlockViewModel {
  return {
    requests: fmtInt(b.requests),
    inputTokens: fmtInt(b.input_tokens),
    outputTokens: fmtInt(b.output_tokens),
    cacheReadTokens: fmtInt(b.cache_read_tokens),
    totalTokens: fmtInt(b.total_tokens),
    costFmt: `${b.cost.toFixed(2)} ${unit}`,
  };
}

function toCap(name: string, used: number, limit: number, unit: string): SpendCapViewModel {
  const pct = limit > 0 ? Math.min(100, Math.max(0, Math.round((used / limit) * 100))) : 0;
  return {
    name,
    usedFmt: `${used.toFixed(2)} ${unit}`,
    limitFmt: limit > 0 ? `${limit.toFixed(2)} ${unit}` : "未设置",
    pct,
    // Higher pct means closer to the cap, so the bands invert relative to the list.
    color: pct >= 90 ? "#f87171" : pct >= 70 ? "#fbbf24" : "#3b82f6",
    unlimited: limit <= 0,
  };
}

export function toFennoDetailViewModel(r: FennoResult): FennoDetailViewModel {
  const base = { id: keyId(r.rawKey), label: r.label, masked: r.masked, rawKey: r.rawKey };
  if (!r.ok) return { ...base, ok: false, info: r.info || "查询失败" };

  const u = r.usage!;
  const s = u.subscription;
  const unit = u.unit;
  const end = parseIso(s.expires_at);
  const remainMs = end == null ? NaN : end - Date.now();
  const expired = !isNaN(remainMs) && remainMs <= 0;

  return {
    ...base,
    ok: true,
    statusOk: u.isValid,
    planName: u.planName || "—",
    mode: u.mode || "—",
    unit,
    remainingFmt: u.dailyRemaining.toFixed(2),
    caps: [
      toCap("今日", u.dailyUsed, s.daily_limit_usd, unit),
      toCap("本周", s.weekly_usage_usd, s.weekly_limit_usd, unit),
      toCap("本月", s.monthly_usage_usd, s.monthly_limit_usd, unit),
    ],
    remainText: isNaN(remainMs) ? undefined : formatRemaining(remainMs),
    isExpired: expired,
    isUrgent: !expired && remainMs < 5 * DAY_MS,
    daysUnknown: isNaN(remainMs),
    expiresFmt: formatIsoDate(s.expires_at),
    weekStartFmt: formatIsoDate(s.weekly_window_start),
    today: toBlockVm(u.today, unit),
    total: toBlockVm(u.total, unit),
    rpm: fmtInt(u.rpm),
    tpm: fmtInt(u.tpm),
    avgDuration: `${(u.averageDurationMs / 1000).toFixed(2)}s`,
    hasModels: (u.models?.length ?? 0) > 0,
    models: (u.models ?? []).map((m) => ({
      model: m.model || "—",
      requests: fmtInt(m.requests),
      totalTokens: fmtInt(m.total_tokens),
      costFmt: m.cost.toFixed(2),
    })),
    hasDaily: u.daily.length > 0,
    daily: u.daily.map((d) => ({
      date: d.date || "—",
      requests: fmtInt(d.requests),
      totalTokens: fmtInt(d.total_tokens),
      costFmt: d.cost.toFixed(2),
    })),
  };
}
