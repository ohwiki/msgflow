import { Res } from "../lib/response.js";
import type { Logger } from "../lib/log.js";

const KV_PREFIX = "short:";

/** POST /api/shorten — 创建短链 { url: "https://..." } */
export async function apiShorten(request: Request, env: Env, log: Logger): Promise<Response> {
  const { url } = await request.json<{ url: string }>();
  if (!url) return Res.json({ error: "url required" }, 400);

  const code = crypto.randomUUID().slice(0, 6);
  await env.KV.put(`${KV_PREFIX}${code}`, url);
  log.info("shorten-created", { code, url });

  const shortUrl = `${env.WORKER_URL}/s/${code}`;
  return Res.json({ code, shortUrl, url });
}

/** GET /s/:code — 301 重定向 */
export async function handleShortRedirect(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const code = url.pathname.slice(3); // "/s/abc123" → "abc123"

  const target = await env.KV.get(`${KV_PREFIX}${code}`);
  if (!target) return Res.notFound();

  log.info("short-redirect", { code, target });
  return Response.redirect(target, 301);
}
