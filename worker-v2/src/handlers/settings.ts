/**
 * Handler: GET/POST /settings — system settings including password change.
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN, HTTP_STATUS } from "../lib/constants.js";
import { AuthService } from "../services/auth-service.js";
import { ConfigRepository } from "../repositories/config-repository.js";
import type { Logger } from "../lib/log.js";

const settingsTpl = `<div class="max-w-lg">
  <h1 class="text-2xl font-bold mb-6">设置</h1>
  {{#success}}<div class="alert alert-success text-sm mb-4">{{success}}</div>{{/success}}
  {{#error}}<div class="alert alert-error text-sm mb-4">{{error}}</div>{{/error}}
  <div class="card bg-base-100 shadow">
    <div class="card-body">
      <h2 class="card-title text-lg">修改密码</h2>
      <form method="POST" action="/settings">
        <input type="hidden" name="action" value="change_password"/>
        <div class="form-control mt-2">
          <label class="label"><span class="label-text">当前密码</span></label>
          <input type="password" name="current_password" class="input input-bordered" required/>
        </div>
        <div class="form-control mt-2">
          <label class="label"><span class="label-text">新密码</span></label>
          <input type="password" name="new_password" class="input input-bordered" required minlength="6"/>
        </div>
        <div class="form-control mt-2">
          <label class="label"><span class="label-text">确认新密码</span></label>
          <input type="password" name="confirm_password" class="input input-bordered" required minlength="6"/>
        </div>
        <div class="form-control mt-4">
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  </div>
</div>`;

import layoutTpl from "../templates/layout.mustache";

const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

export async function pageSettings(request: Request, env: Env, log: Logger): Promise<Response> {
  const content = Mustache.render(settingsTpl, {});
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "设置", content });
  return Res.html(html);
}

export async function handleSettingsSubmit(request: Request, env: Env, log: Logger): Promise<Response> {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "change_password") {
    const currentPassword = formData.get("current_password") as string ?? "";
    const newPassword = formData.get("new_password") as string ?? "";
    const confirmPassword = formData.get("confirm_password") as string ?? "";

    // Validate
    if (newPassword !== confirmPassword) {
      return renderSettings({ error: "两次输入的新密码不一致" }, env);
    }
    if (newPassword.length < 6) {
      return renderSettings({ error: "新密码至少 6 位" }, env);
    }

    // Verify current password
    const auth = new AuthService(env);
    const configRepo = new ConfigRepository(env.KV);
    const config = await configRepo.getAuthConfig();
    const currentHash = await auth.hashPassword(currentPassword);

    if (currentHash !== config.password_hash) {
      log.warn("password_change_failed");
      return renderSettings({ error: "当前密码错误" }, env);
    }

    // Update password
    const newHash = await auth.hashPassword(newPassword);
    await configRepo.setAuthConfig({ ...config, password_hash: newHash });

    log.info("password_changed");
    return renderSettings({ success: "密码修改成功" }, env);
  }

  return renderSettings({}, env);
}

function renderSettings(data: { success?: string; error?: string }, env: Env): Response {
  const content = Mustache.render(settingsTpl, data);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "设置", content });
  return Res.html(html);
}
