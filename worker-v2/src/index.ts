/**
 * msgflow v2 — Content System Worker entry point.
 */

import { router } from "./router.js";
import { createLogger } from "./lib/log.js";
import { AppError } from "./lib/errors.js";
import { Res } from "./lib/response.js";
import { HTTP_STATUS } from "./lib/constants.js";
import { fetchWithTimeout } from "./lib/http.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, hostname } = url;
    const method = request.method;
    const log = createLogger({ rid: crypto.randomUUID().slice(0, 8), path: pathname, method });

    try {
      log.info("request");
      return await router(pathname, hostname, method, request, env, log);
    } catch (e) {
      if (e instanceof AppError) {
        log.warn("app_error", { code: e.code, error: e.message });
        return Res.json(e.toJSON(), e.status);
      }
      const msg = e instanceof Error ? e.message : "unknown";
      log.error("unhandled", { error: msg });
      return Res.json({ error: "Internal Server Error" }, HTTP_STATUS.INTERNAL_ERROR);
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshFeishuToken(env));
  },
} satisfies ExportedHandler<Env>;

interface FeishuAppTokenResponse {
  app_access_token?: string;
}

interface FeishuRefreshResponse {
  code?: number;
  msg?: string;
  data?: Record<string, unknown>;
}

async function refreshFeishuToken(env: Env): Promise<void> {
  const log = createLogger({ rid: crypto.randomUUID().slice(0, 8), trigger: "cron" });
  log.info("cron_triggered");

  try {
    const raw = await env.KV.get("feishu_user_token");
    if (!raw) return;

    const tokenData = JSON.parse(raw);
    const savedAt = tokenData._saved_at || 0;
    const expiresIn = tokenData.expires_in || 7200;
    const now = Date.now() / 1000;

    if (now - savedAt <= expiresIn - 3600) {
      log.info("feishu_token_still_valid");
      return;
    }

    log.info("feishu_token_refreshing");
    const appResp = await fetchWithTimeout("https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
    });
    const appData = await appResp.json<FeishuAppTokenResponse>();
    const appToken = appData?.app_access_token;
    if (!appToken) { log.error("feishu_app_token_failed"); return; }

    const refreshResp = await fetchWithTimeout("https://open.feishu.cn/open-apis/authen/v1/oidc/refresh_access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${appToken}` },
      body: JSON.stringify({ grant_type: "refresh_token", refresh_token: tokenData.refresh_token }),
    });
    const refreshData = await refreshResp.json<FeishuRefreshResponse>();
    if (refreshData?.code === 0 && refreshData?.data) {
      const newToken = { ...refreshData.data, _saved_at: now };
      await env.KV.put("feishu_user_token", JSON.stringify(newToken));
      log.info("feishu_token_refreshed");
    } else {
      log.error("feishu_token_refresh_failed", { msg: refreshData?.msg || "" });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    log.error("feishu_token_refresh_error", { error: msg });
  }
}
