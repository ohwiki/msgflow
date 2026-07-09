/**
 * Config Repository — KV storage for system configuration.
 */

import { KV_KEY } from "../lib/constants.js";
import type { AuthConfig } from "../types/index.js";

export class ConfigRepository {
  constructor(private kv: KVNamespace) {}

  async getAuthConfig(): Promise<AuthConfig> {
    const config = await this.kv.get<AuthConfig>(KV_KEY.AUTH_CONFIG, "json");
    return config ?? { mode: "password", allow_register: false, allowed_emails: [], password_hash: "" };
  }

  async setAuthConfig(config: AuthConfig): Promise<void> {
    await this.kv.put(KV_KEY.AUTH_CONFIG, JSON.stringify(config));
  }

  async getRssSources(): Promise<string[]> {
    const sources = await this.kv.get<string[]>(KV_KEY.RSS_SOURCES, "json");
    return sources ?? [];
  }

  async setRssSources(sources: string[]): Promise<void> {
    await this.kv.put(KV_KEY.RSS_SOURCES, JSON.stringify(sources));
  }

  async getSession(token: string): Promise<{ email: string; expires: number } | null> {
    return await this.kv.get<{ email: string; expires: number }>(`${KV_KEY.SESSION_PREFIX}${token}`, "json");
  }

  async setSession(token: string, data: { email: string; expires: number }): Promise<void> {
    const ttl = Math.floor((data.expires - Date.now()) / 1000);
    if (ttl > 0) {
      await this.kv.put(`${KV_KEY.SESSION_PREFIX}${token}`, JSON.stringify(data), { expirationTtl: ttl });
    }
  }

  async deleteSession(token: string): Promise<void> {
    await this.kv.delete(`${KV_KEY.SESSION_PREFIX}${token}`);
  }
}
