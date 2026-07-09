/**
 * Handler: GET/POST /login — login page and form submission.
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN, HTTP_STATUS, BASE_TEMPLATE_VARS } from "../lib/constants.js";
import { AuthService, sessionCookie, clearSessionCookie, getSessionToken } from "../services/auth-service.js";
import type { Logger } from "../lib/log.js";
import loginTpl from "../templates/login.mustache";

const baseVars = BASE_TEMPLATE_VARS;

export async function handleLoginPage(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  const html = Mustache.render(loginTpl, { ...baseVars });
  return Res.html(html);
}

export async function handleLoginSubmit(request: Request, env: Env, log: Logger): Promise<Response> {
  const formData = await request.formData();
  const password = formData.get("password") as string ?? "";

  const auth = new AuthService(env);
  const token = await auth.login(password);

  if (!token) {
    log.warn("login_failed");
    const html = Mustache.render(loginTpl, { ...baseVars, error: "密码错误" });
    return Res.html(html, HTTP_STATUS.UNAUTHORIZED);
  }

  log.info("login_success");
  return new Response(null, {
    status: HTTP_STATUS.MOVED,
    headers: {
      Location: "/",
      "Set-Cookie": sessionCookie(token),
    },
  });
}

export async function handleLogout(request: Request, env: Env, log: Logger): Promise<Response> {
  const token = getSessionToken(request);
  if (token) {
    const auth = new AuthService(env);
    await auth.logout(token);
  }
  log.info("logout");
  return new Response(null, {
    status: HTTP_STATUS.MOVED,
    headers: {
      Location: "/login",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
