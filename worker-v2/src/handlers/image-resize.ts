import type { Logger } from "../lib/log.js";

/**
 * 图片处理路由：GET /resize/w=160,h=96,fit=cover,f=auto,q=80/path/to/image.jpg
 * 从 R2 读取原图，设置缓存头返回。
 * 未来可扩展为真正的裁剪（需 wasm 或 cf.image）。
 */
export async function handleImageResize(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/resize\/([^/]+)\/(.+)$/);
  if (!match) return new Response("Bad request", { status: 400 });

  const paramsStr = match[1]!;
  const path = match[2]!;
  log.info("image-resize", { path, params: paramsStr });

  const obj = await env.R2.get(path);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set("Content-Type", obj.httpMetadata?.contentType || "image/jpeg");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("ETag", obj.etag);

  // 304 支持
  const ifNoneMatch = request.headers.get("If-None-Match");
  if (ifNoneMatch === obj.etag) {
    return new Response(null, { status: 304, headers });
  }

  return new Response(obj.body, { headers });
}
