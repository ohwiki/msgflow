/**
 * Quota query types — shared between service, handler, and templates.
 */

export interface QuotaKeyEntry {
  label: string;
  key: string;
}

export interface QuotaKeyInfo {
  name: string;
  total_quota: number;
  used_quota: number;
  remain_quota: number;
  usage_percentage: number | null;
  remaining_percentage: number | null;
  remaining_time: string;
  status: number;
  created_time: string;
  expired_time: string;
}

export interface QuotaResult {
  label: string;
  masked: string;
  ok: boolean;
  info?: string;
  key_info?: QuotaKeyInfo;
}

/** Contract for upstream quota providers (enables mocking / swapping). */
export interface IQuotaClient {
  query(apiKey: string): Promise<QuotaKeyInfo>;
}
