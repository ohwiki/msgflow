/**
 * Router — pure request dispatch by hostname + path.
 */

import { Res } from "./lib/response.js";
import type { Logger } from "./lib/log.js";
import { apiFetch } from "./handlers/api-fetch.js";
import { apiArticles, apiArticleDetail, apiArticleDelete, apiArticlePublish } from "./handlers/api-articles.js";
import { apiCallback } from "./handlers/api-callback.js";
import { apiCiConfig } from "./handlers/api-ci-config.js";
import { pageHome, pageFetch } from "./views/admin.js";

type RouteHandler = (request: Request, env: Env, log: Logger) => Promise<Response>;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

const adminRoutes: Route[] = [
  { method: "GET", path: "/", handler: pageHome },
  { method: "GET", path: "/fetch", handler: pageFetch },
  { method: "POST", path: "/api/fetch", handler: apiFetch },
  { method: "POST", path: "/api/callback", handler: apiCallback },
  { method: "GET", path: "/api/ci-config", handler: apiCiConfig },
  { method: "GET", path: "/api/articles", handler: apiArticles },
];

const publicRoutes: Route[] = [
  { method: "GET", path: "/api/articles", handler: apiArticles },
];

export async function router(
  path: string,
  hostname: string,
  method: string,
  request: Request,
  env: Env,
  log: Logger,
): Promise<Response> {
  const adminHost = env.ADMIN_HOST ?? "";
  const isAdmin = adminHost
    ? hostname === adminHost
    : hostname.startsWith("admin") || hostname.includes("localhost") || hostname.includes("127.0.0.1");
  const routes = isAdmin ? adminRoutes : publicRoutes;

  const route = routes.find((r) => r.method === method && r.path === path);
  if (route) return route.handler(request, env, log);

  // Dynamic routes
  if (isAdmin) {
    if (method === "GET" && path.match(/^\/api\/articles\/[^/]+$/)) return apiArticleDetail(request, env, log);
    if (method === "DELETE" && path.match(/^\/api\/articles\/[^/]+$/)) return apiArticleDelete(request, env, log);
    if (method === "POST" && path.match(/^\/api\/articles\/[^/]+\/publish$/)) return apiArticlePublish(request, env, log);
  }
  if (!isAdmin) {
    if (method === "GET" && path.match(/^\/article\/[^/]+$/)) return apiArticleDetail(request, env, log);
  }

  return Res.notFound();
}
