/**
 * Handler: Google OAuth 2.0 login flow.
 *
 * GET  /auth/google         → redirect to Google consent screen
 * GET  /auth/google/callback → handle callback, create session
 */

import { Res } from "../lib/response.js";
import { EXTERNAL_URL, HTTP_STATUS, DEFAULTS } from "../lib/constants.js";
import { fetchWithTimeout } from "../lib/http.js";
import { ConfigRepository } from "../repositories/config-repository.js";
import { sessionCookie } from "../services/auth-service.js";
import type { Logger } from "../lib/log.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export async function handleGoogleLogin(request: Request, env: Env, log: Logger): Promise<Response> {
  const clientId = env.GOOGLE_CLIENT_ID ?? "";
  if (!clientId) return Res.text("Google OAuth not configured", HTTP_STATUS.INTERNAL_ERROR);

  const redirectUri = `${env.WORKER_URL}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
  });

  return Res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

export async function handleGoogleCallback(request: Request, env: Env, log: Logger): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    log.warn("google_oauth_error", { error: error ?? "no code" });
    return Res.redirect("/login");
  }

  const clientId = env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = env.GOOGLE_CLIENT_SECRET ?? "";
  const redirectUri = `${env.WORKER_URL}/auth/google/callback`;

  // Exchange code for token
  const tokenResp = await fetchWithTimeout(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResp.ok) {
    log.error("google_token_exchange_failed", { status: String(tokenResp.status) });
    return Res.redirect("/login");
  }

  const tokenData = await tokenResp.json() as { access_token: string };

  // Get user info
  const userResp = await fetchWithTimeout(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResp.ok) {
    log.error("google_userinfo_failed");
    return Res.redirect("/login");
  }

  const user = await userResp.json() as { email: string; name: string };

  // Check if email is allowed
  const configRepo = new ConfigRepository(env.KV);
  const config = await configRepo.getAuthConfig();

  if (config.allowed_emails.length > 0) {
    const allowed = config.allowed_emails.some((pattern) => {
      if (pattern === "*") return true;
      if (pattern.startsWith("*@")) return user.email.endsWith(pattern.slice(1));
      return user.email === pattern;
    });
    if (!allowed) {
      log.warn("google_oauth_denied", { email: user.email });
      return Res.redirect("/login");
    }
  }

  // Create session
  const token = crypto.randomUUID();
  const expires = Date.now() + DEFAULTS.SESSION_TTL_MS;
  await configRepo.setSession(token, { email: user.email, expires });

  log.info("google_login_success", { email: user.email });

  return new Response(null, {
    status: HTTP_STATUS.MOVED,
    headers: {
      Location: "/",
      "Set-Cookie": sessionCookie(token),
    },
  });
}
