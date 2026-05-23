/**
 * CI Token Service — one-time tokens for secure Actions ↔ Worker communication.
 *
 * Flow:
 * 1. Worker generates token when triggering Actions
 * 2. Actions calls /api/ci-config?token=xxx to get secrets
 * 3. Token is consumed (deleted) immediately after use
 */

import { DEFAULTS } from "../lib/constants.js";

const CI_TOKEN_PREFIX = "ci_token:";

export interface CiTokenPayload {
  article_id: string;
  r2_raw_key: string;
  title?: string;
  tags?: string;
  created_at: string;
}

export interface CiConfig {
  cf_account_id: string;
  cf_api_token: string;
  callback_url: string;
  callback_secret: string;
  article_id: string;
  r2_raw_key: string;
  title: string;
  tags: string;
  source_type: string;
  source_url: string;
}

export class CiTokenService {
  constructor(private kv: KVNamespace) {}

  /** Generate a one-time token and store payload in KV with TTL. */
  async generate(payload: CiTokenPayload): Promise<string> {
    const token = crypto.randomUUID();
    await this.kv.put(
      `${CI_TOKEN_PREFIX}${token}`,
      JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
      { expirationTtl: DEFAULTS.CI_TOKEN_TTL_SECONDS },
    );
    return token;
  }

  /** Consume a token: validate, return payload, then delete. Returns null if invalid. */
  async consume(token: string): Promise<CiTokenPayload | null> {
    const key = `${CI_TOKEN_PREFIX}${token}`;
    const raw = await this.kv.get(key);
    if (!raw) return null;

    // Delete immediately (one-time use)
    await this.kv.delete(key);

    return JSON.parse(raw) as CiTokenPayload;
  }
}
