/**
 * Router — pure request dispatch by hostname + path.
 */

import { Res } from "./lib/response.js";
import type { Logger } from "./lib/log.js";
import { apiFetch } from "./handlers/api-fetch.js";
import { apiArticles, apiArticleDetail, apiArticleDelete, apiArticlePublish } from "./handlers/api-articles.js";
import { apiCallback } from "./handlers/api-callback.js";
import { apiCiConfig } from "./handlers/api-ci-config.js";
import { apiAiConfig } from "./handlers/api-ai-config.js";
import { apiCiDownload } from "./handlers/api-ci-download.js";
import { handleLoginPage, handleLoginSubmit, handleLogout } from "./handlers/auth.js";
import { handleGoogleLogin, handleGoogleCallback } from "./handlers/auth-google.js";
import { handleTelegramWebhook } from "./handlers/webhook-telegram.js";
import { handleFeishuWebhook } from "./handlers/webhook-feishu.js";
import { apiFeishuTokenStatus } from "./handlers/api-feishu-token.js";
import { pageSettings, handleSettingsSubmit } from "./handlers/settings.js";
import { authMiddleware } from "./services/auth-service.js";
import { handleImageResize } from "./handlers/image-resize.js";
import { apiShorten, handleShortRedirect } from "./handlers/short-url.js";
import { pageArticlePreview } from "./handlers/article-preview.js";
import { apiNotePublish, apiNoteUpdateCookie } from "./handlers/api-note.js";
import { pageHome, pageFetch, pageNote } from "./views/admin.js";
import { pageDomain, apiDomainCheck } from "./handlers/domain-check.js";
import { pageQuota, apiQuotaCheck } from "./handlers/quota-check.js";
import { apiFormat, apiThemes, pageFormat, apiFormatDebug } from "./handlers/api-format.js";
import { apiFormatHistory, apiFormatHistoryGet, apiFormatHistoryDelete, apiFormatHistoryPatch } from "./handlers/api-format-history.js";

type RouteHandler = (request: Request, env: Env, log: Logger) => Promise<Response>;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

// Public routes (no auth required)
const publicRoutes: Route[] = [
  { method: "GET", path: "/login", handler: handleLoginPage },
  { method: "POST", path: "/login", handler: handleLoginSubmit },
  { method: "GET", path: "/logout", handler: handleLogout },
  { method: "GET", path: "/auth/google", handler: handleGoogleLogin },
  { method: "GET", path: "/auth/google/callback", handler: handleGoogleCallback },
  { method: "POST", path: "/webhook/telegram", handler: handleTelegramWebhook },
  { method: "POST", path: "/webhook/feishu", handler: handleFeishuWebhook },
  { method: "POST", path: "/api/callback", handler: apiCallback },
  { method: "GET", path: "/api/ci-config", handler: apiCiConfig },
  { method: "GET", path: "/api/ai-config", handler: apiAiConfig },
  { method: "GET", path: "/api/ci-download", handler: apiCiDownload },
];

// Protected admin routes (auth required)
const adminRoutes: Route[] = [
  { method: "GET", path: "/", handler: pageHome },
  { method: "GET", path: "/fetch", handler: pageFetch },
  { method: "GET", path: "/note", handler: pageNote },
  { method: "GET", path: "/settings", handler: pageSettings },
  { method: "POST", path: "/settings", handler: handleSettingsSubmit },
  { method: "POST", path: "/api/fetch", handler: apiFetch },
  { method: "POST", path: "/api/shorten", handler: apiShorten },
  { method: "GET", path: "/api/articles", handler: apiArticles },
  { method: "GET", path: "/api/feishu/token-status", handler: apiFeishuTokenStatus },
  { method: "POST", path: "/api/note/publish", handler: apiNotePublish },
  { method: "POST", path: "/api/note/cookie", handler: apiNoteUpdateCookie },
  { method: "GET", path: "/domain", handler: pageDomain },
  { method: "POST", path: "/api/domain/check", handler: apiDomainCheck },
  { method: "GET", path: "/quota", handler: pageQuota },
  { method: "POST", path: "/api/quota/check", handler: apiQuotaCheck },
  { method: "GET", path: "/format", handler: pageFormat },
  { method: "POST", path: "/api/format", handler: apiFormat },
  { method: "GET", path: "/api/themes", handler: apiThemes },
  { method: "GET", path: "/api/format-debug", handler: apiFormatDebug },
  { method: "GET", path: "/api/format-history", handler: apiFormatHistory },
  { method: "POST", path: "/api/format-history", handler: apiFormatHistory },
  { method: "DELETE", path: "/api/format-history", handler: apiFormatHistoryDelete },
  { method: "PATCH", path: "/api/format-history", handler: apiFormatHistoryPatch },
];

// Public reader routes (read.xxx.com, no auth)
const readerRoutes: Route[] = [
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

  // Public routes (login, callback, ci-config) — no auth
  const pubRoute = publicRoutes.find((r) => r.method === method && r.path === path);
  if (pubRoute) return pubRoute.handler(request, env, log);

  // Short URL redirect — no auth
  if (method === "GET" && path.startsWith("/s/")) return handleShortRedirect(request, env, log);

  // Reader site — no auth
  if (!isAdmin) {
    const route = readerRoutes.find((r) => r.method === method && r.path === path);
    if (route) return route.handler(request, env, log);
    if (method === "GET" && path.startsWith("/resize/")) return handleImageResize(request, env, log);
    if (method === "GET" && path.match(/^\/article\/[^/]+$/)) return apiArticleDetail(request, env, log);
    if (method === "GET" && path.match(/^\/article\/[^/]+\/preview$/)) return pageArticlePreview(request, env, log);
    return Res.notFound();
  }

  // Admin routes — require auth
  const denied = await authMiddleware(request, env);
  if (denied) return denied;

  const route = adminRoutes.find((r) => r.method === method && r.path === path);
  if (route) return route.handler(request, env, log);

  // Dynamic admin routes
  if (method === "GET" && path.match(/^\/article\/[^/]+\/preview$/)) return pageArticlePreview(request, env, log);
  if (method === "GET" && path.match(/^\/api\/articles\/[^/]+$/)) return apiArticleDetail(request, env, log);
  if (method === "DELETE" && path.match(/^\/api\/articles\/[^/]+$/)) return apiArticleDelete(request, env, log);
  if (method === "POST" && path.match(/^\/api\/articles\/[^/]+\/publish$/)) return apiArticlePublish(request, env, log);

  // Format history — prefix match for :id routes (auth required)
  if (path.startsWith("/api/format-history/")) {
    if (method === "GET") return apiFormatHistoryGet(request, env, log);
    if (method === "DELETE") return apiFormatHistoryDelete(request, env, log);
    if (method === "PATCH") return apiFormatHistoryPatch(request, env, log);
  }

  return Res.notFound();
}
