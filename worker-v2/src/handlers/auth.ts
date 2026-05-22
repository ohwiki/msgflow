/**
 * Handler: GET/POST /login — login page and form submission.
 */

import { Res } from "../lib/response.js";
import { HTTP_STATUS, CDN } from "../lib/constants.js";
import { AuthService, sessionCookie, clearSessionCookie, getSessionToken } from "../services/auth-service.js";
import type { Logger } from "../lib/log.js";

const loginPageHtml = `<!DOCTYPE html>
<html lang="zh" data-theme="light">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>登录 - msgflow</title>
  <link href="${CDN.DAISYUI_CSS}" rel="stylesheet" type="text/css"/>
  <link href="${CDN.DAISYUI_THEMES}" rel="stylesheet" type="text/css"/>
  <script src="${CDN.TAILWIND_BROWSER}"></script>
  <script>document.documentElement.setAttribute('data-theme',localStorage.getItem('theme')||'light')</script>
</head>
<body class="min-h-screen bg-base-200 flex items-center justify-center">
  <div class="card bg-base-100 shadow-xl w-full max-w-sm">
    <div class="card-body">
      <h2 class="card-title justify-center text-2xl mb-4">📄 msgflow</h2>
      {{error}}
      <form method="POST" action="/login">
        <div class="form-control">
          <label class="label"><span class="label-text">密码</span></label>
          <input type="password" name="password" class="input input-bordered" required autofocus/>
        </div>
        <div class="form-control mt-4">
          <button type="submit" class="btn btn-primary">登录</button>
        </div>
      </form>
    </div>
  </div>
</body>
</html>`;

export async function handleLoginPage(_request: Request, _env: Env, _log: Logger): Promise<Response> {
  const html = loginPageHtml.replace("{{error}}", "");
  return Res.html(html);
}

export async function handleLoginSubmit(request: Request, env: Env, log: Logger): Promise<Response> {
  const formData = await request.formData();
  const password = formData.get("password") as string ?? "";

  const auth = new AuthService(env);
  const token = await auth.login(password);

  if (!token) {
    log.warn("login_failed");
    const html = loginPageHtml.replace("{{error}}", '<div class="alert alert-error text-sm mb-4">密码错误</div>');
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
