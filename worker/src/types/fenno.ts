/**
 * Fenno (api.fenno.ai) usage types.
 *
 * Unlike EasyClaude's single quota pool, fenno bills against three resetting
 * spend caps (daily / weekly / monthly). `remaining` is daily_limit - daily_usage,
 * so it resets every day and must never be labelled as a lifetime balance.
 */

export interface FennoSubscription {
  daily_limit_usd: number;
  daily_usage_usd: number;
  weekly_limit_usd: number;
  weekly_usage_usd: number;
  monthly_limit_usd: number;
  monthly_usage_usd: number;
  weekly_window_start: string;
  expires_at: string;
}

export interface FennoUsageBlock {
  requests: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  total_tokens: number;
  cost: number;
  actual_cost: number;
}

export interface FennoDailyEntry extends FennoUsageBlock {
  date: string;
  cache_write_tokens: number;
}

export interface FennoModelStat extends FennoUsageBlock {
  model: string;
  account_cost: number;
}

export interface FennoUsage {
  isValid: boolean;
  mode: string;
  planName: string;
  /** Raw upstream value. Stale once a key hits its daily cap — prefer dailyRemaining. */
  remaining: number;
  unit: string;
  /**
   * Today's spend, derived from usage.today rather than subscription.daily_usage_usd.
   * Upstream stops resetting daily_usage_usd for keys that exhausted the cap, leaving
   * yesterday's total in place after midnight; usage.today resets correctly.
   */
  dailyUsed: number;
  /** max(0, daily_limit - dailyUsed). Recomputed for the same reason. */
  dailyRemaining: number;
  subscription: FennoSubscription;
  today: FennoUsageBlock;
  total: FennoUsageBlock;
  rpm: number;
  tpm: number;
  averageDurationMs: number;
  daily: FennoDailyEntry[];
  /** Absent (not empty) on some upstream responses — always guard before use. */
  models?: FennoModelStat[];
}

export interface FennoResult {
  label: string;
  masked: string;
  rawKey: string;
  ok: boolean;
  info?: string;
  usage?: FennoUsage;
}

/** Contract for the fenno upstream (enables mocking in tests). */
export interface IFennoClient {
  query(apiKey: string): Promise<FennoUsage>;
}
