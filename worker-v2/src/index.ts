/**
 * msgflow v2 — Content System Worker entry point.
 */

import { router } from "./router.js";
import { createLogger } from "./lib/log.js";
import { AppError } from "./lib/errors.js";
import { Res } from "./lib/response.js";
import { HTTP_STATUS } from "./lib/constants.js";

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

  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const log = createLogger({ rid: crypto.randomUUID().slice(0, 8), trigger: "cron" });
    log.info("cron_triggered");
    // TODO: RSS 轮询 + 图片持久化
  },
} satisfies ExportedHandler<Env>;
