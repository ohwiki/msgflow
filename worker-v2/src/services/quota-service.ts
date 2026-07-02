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

const MAX_CONCURRENT_KEYS = 10;

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
      return { label: entry.label, masked, ok: true, key_info: keyInfo };
    } catch (e) {
      const info = e instanceof AppError ? e.message : (e instanceof Error ? e.message : "未知错误");
      this.log.warn("quota_query_failed", { label: entry.label, masked, error: info });
      return { label: entry.label, masked, ok: false, info };
    }
  }

  /** Query multiple keys concurrently (capped at MAX_CONCURRENT_KEYS). */
  async queryAll(entries: QuotaKeyEntry[]): Promise<QuotaResult[]> {
    const batch = entries.slice(0, MAX_CONCURRENT_KEYS);
    this.log.info("quota_query_batch", { count: String(batch.length) });
    return Promise.all(batch.map((entry) => this.queryOne(entry)));
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
    remaining_time: String(raw.remaining_time ?? ""),
    status: Number(raw.status ?? 0),
    created_time: String(raw.created_time ?? ""),
    expired_time: String(raw.expired_time ?? ""),
  };
}
