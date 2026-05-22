/**
 * Handler: GET/POST /settings — system settings including password change.
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN } from "../lib/constants.js";
import { AuthService } from "../services/auth-service.js";
import { ConfigRepository } from "../repositories/config-repository.js";
import type { Logger } from "../lib/log.js";
import layoutTpl from "../templates/layout.mustache";
import settingsTpl from "../templates/partials/settings.mustache";

const baseVars = {
  cdnDaisyui: CDN.DAISYUI_CSS,
  cdnDaisyuiThemes: CDN.DAISYUI_THEMES,
  cdnTailwind: CDN.TAILWIND_BROWSER,
  cdnHtmx: CDN.HTMX,
};

export async function pageSettings(_request: Request, env: Env, _log: Logger): Promise<Response> {
  const github_token = await env.KV.get("github_token") || "";
  const github_repo = await env.KV.get("github_repo") || "";
  return renderSettings({ github_token_masked: github_token ? "••••••••" : "", github_repo });
}

export async function handleSettingsSubmit(request: Request, env: Env, log: Logger): Promise<Response> {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "save_github") {
    const token = (formData.get("github_token") as string)?.trim();
    const repo = (formData.get("github_repo") as string)?.trim();

    if (token && !token.startsWith("••")) {
      await env.KV.put("github_token", token);
    }
    if (repo) {
      await env.KV.put("github_repo", repo);
    }

    log.info("github_config_saved", { repo });
    const github_token = await env.KV.get("github_token") || "";
    const github_repo = await env.KV.get("github_repo") || "";
    return renderSettings({ success: "GitHub 配置已保存", github_token_masked: github_token ? "••••••••" : "", github_repo });
  }

  if (action === "change_password") {
    const currentPassword = formData.get("current_password") as string ?? "";
    const newPassword = formData.get("new_password") as string ?? "";
    const confirmPassword = formData.get("confirm_password") as string ?? "";

    if (newPassword !== confirmPassword) {
      return renderSettings({ error: "两次输入的新密码不一致" });
    }
    if (newPassword.length < 6) {
      return renderSettings({ error: "新密码至少 6 位" });
    }

    const auth = new AuthService(env);
    const configRepo = new ConfigRepository(env.KV);
    const config = await configRepo.getAuthConfig();
    const currentHash = await auth.hashPassword(currentPassword);

    if (currentHash !== config.password_hash) {
      log.warn("password_change_failed");
      return renderSettings({ error: "当前密码错误" });
    }

    const newHash = await auth.hashPassword(newPassword);
    await configRepo.setAuthConfig({ ...config, password_hash: newHash });

    log.info("password_changed");
    return renderSettings({ success: "密码修改成功" });
  }

  return renderSettings({});
}

function renderSettings(data: { success?: string; error?: string; github_token_masked?: string; github_repo?: string }): Response {
  const content = Mustache.render(settingsTpl, data);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "设置", content });
  return Res.html(html);
}
