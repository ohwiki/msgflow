/**
 * Handler: POST /webhook/telegram — Telegram Bot webhook.
 *
 * Users send a URL in chat → Worker fetches the article.
 */

import { Res } from "../lib/response.js";
import { HTTP_STATUS, EXTERNAL_URL } from "../lib/constants.js";
import { parseCommand, HELP_TEXT } from "../lib/command.js";
import { checkRateLimit } from "../lib/rate-limit.js";
import { FetchService } from "../services/fetch-service.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import type { Logger } from "../lib/log.js";

export async function handleTelegramWebhook(request: Request, env: Env, log: Logger): Promise<Response> {
  // Verify request from Telegram
  if (env.TELEGRAM_WEBHOOK_SECRET && request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
    return Res.text("Forbidden", HTTP_STATUS.UNAUTHORIZED);
  }

  const body = await request.json() as { message?: { text?: string; chat?: { id: number } } };
  const message = body.message;
  if (!message?.text || !message?.chat) return Res.text("OK");

  const chatId = message.chat.id;
  const command = parseCommand(message.text.trim());

  if (!command || command.action === "help") {
    await sendTelegram(env, chatId, HELP_TEXT);
    return Res.text("OK");
  }

  if (command.action === "list") {
    const repo = new ArticleRepository(env.DB);
    const articles = await repo.list({ limit: 5 });
    const text = articles.length > 0
      ? articles.map((a, i) => `${i + 1}. ${a.title} [${a.status}]`).join("\n")
      : "暂无文章";
    await sendTelegram(env, chatId, text);
    return Res.text("OK");
  }

  if (command.action === "fetch" && command.target) {
    // Rate limit
    if (!await checkRateLimit("telegram", String(chatId))) {
      await sendTelegram(env, chatId, "⚠️ 操作太频繁，请稍后再试");
      return Res.text("OK");
    }

    await sendTelegram(env, chatId, `收到，正在抓取... ⏳\n${command.target}`);

    try {
      const service = new FetchService(env, log);
      const result = await service.fetchUrl(command.target);
      await sendTelegram(env, chatId, `✅ 抓取成功\n标题: ${result.title}\n状态: ${result.status}\n来源: ${result.sourceType}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      await sendTelegram(env, chatId, `❌ 抓取失败: ${msg}`);
    }

    return Res.text("OK");
  }

  await sendTelegram(env, chatId, "🤔 无法识别指令，发送 /help 查看帮助");
  return Res.text("OK");
}

async function sendTelegram(env: Env, chatId: number, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  // Telegram 消息限制 4096 字符
  for (let i = 0; i < text.length; i += 4096) {
    await fetch(`${EXTERNAL_URL.TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text.substring(i, i + 4096) }),
    });
  }
}
