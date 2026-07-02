/**
 * Handler: GET/POST /settings — system settings including password change.
 */

import Mustache from "mustache";
import { Res } from "../lib/response.js";
import { CDN } from "../lib/constants.js";
import { AuthService } from "../services/auth-service.js";
import { ConfigRepository } from "../repositories/config-repository.js";
import { parseKeysText, entriesToText } from "../services/quota-service.js";
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
  const tavily_key = await env.KV.get("tavily_api_key") || "";
  const exa_key = await env.KV.get("exa_api_key") || "";
  const easyclaude_keys_text = await getEasyClaudeKeysText(env);
  return renderSettings({
    github_token_masked: github_token ? "••••••••" : "",
    github_repo,
    tavily_key_value: tavily_key,
    exa_key_value: exa_key,
    easyclaude_keys_text,
  });
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

  if (action === "save_api_keys") {
    const tavily = (formData.get("tavily_api_key") as string)?.trim();
    const exa = (formData.get("exa_api_key") as string)?.trim();

    if (tavily && !tavily.startsWith("••")) await env.KV.put("tavily_api_key", tavily);
    if (exa && !exa.startsWith("••")) await env.KV.put("exa_api_key", exa);

    log.info("api_keys_saved");
    const tavily_key = await env.KV.get("tavily_api_key") || "";
    const exa_key = await env.KV.get("exa_api_key") || "";
    return renderSettings({ success: "API 配置已保存", tavily_key_value: tavily_key, exa_key_value: exa_key });
  }

  if (action === "save_easyclaude_keys") {
    const keysText = ((formData.get("easyclaude_keys") as string) || "").trim();
    const entries = parseKeysText(keysText);
    await env.KV.put("easyclaude_keys", JSON.stringify(entries));
    log.info("easyclaude_keys_saved", { count: String(entries.length) });
    return renderSettings({ success: `EasyClaude Keys 已保存（${entries.length} 个）`, easyclaude_keys_text: keysText });
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
    const valid = await auth.verifyPassword(currentPassword, config.password_hash ?? "");

    if (!valid) {
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

function renderSettings(data: { success?: string; error?: string; github_token_masked?: string; github_repo?: string; tavily_key_value?: string; exa_key_value?: string; easyclaude_keys_text?: string }): Response {
  const content = Mustache.render(settingsTpl, data);
  const html = Mustache.render(layoutTpl, { ...baseVars, title: "设置", content });
  return Res.html(html);
}

/** 从 KV 读 easyclaude_keys JSON，转回文本格式供编辑 */
async function getEasyClaudeKeysText(env: Env): Promise<string> {
  const raw = await env.KV.get("easyclaude_keys");
  if (!raw) return "";
  try {
    return entriesToText(JSON.parse(raw));
  } catch {
    return "";
  }
}
