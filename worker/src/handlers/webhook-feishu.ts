/**
 * Handler: POST /webhook/feishu — Feishu Bot webhook.
 *
 * Users send a URL in chat → Worker fetches the article.
 */

import { Res } from "../lib/response.js";
import { HTTP_STATUS, EXTERNAL_URL } from "../lib/constants.js";
import { parseCommand, HELP_TEXT } from "../lib/command.js";
import { checkRateLimit } from "../lib/rate-limit.js";
import { FetchService } from "../services/fetch-service.js";
import { ArticleRepository } from "../repositories/article-repository.js";
import { fetchWithTimeout } from "../lib/http.js";
import type { Logger } from "../lib/log.js";

interface FeishuWebhookPayload {
  type?: string;
  challenge?: string;
  header?: {
    token?: string;
    event_id?: string;
    event_type?: string;
  };
  event?: {
    message?: {
      chat_id?: string;
      content?: string;
      message_type?: string;
    };
    sender?: {
      sender_id?: { open_id?: string };
    };
  };
}

export async function handleFeishuWebhook(request: Request, env: Env, log: Logger): Promise<Response> {
  const body = await request.json<FeishuWebhookPayload>();

  // URL 验证（飞书首次配置回调时）
  if (body.type === "url_verification") {
    return Res.json({ challenge: body.challenge });
  }

  // 验证 token
  const header = body.header;
  if (!header || header.token !== env.FEISHU_VERIFICATION_TOKEN) {
    return Res.text("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
  }

  // 事件去重（Cache API，5 分钟内同一事件不重复处理）
  if (header.event_id) {
    const dedup = new Request(`https://dedup/feishu:${header.event_id}`);
    if (await caches.default.match(dedup)) return Res.text("OK");
    await caches.default.put(dedup, new Response("1", { headers: { "Cache-Control": "max-age=300" } }));
  }

  if (header.event_type !== "im.message.receive_v1") return Res.text("OK");

  const event = body.event;
  const message = event?.message;
  if (!message || message.message_type !== "text" || !message.chat_id) return Res.text("OK");

  let text: string;
  try {
    text = (JSON.parse(message.content ?? "{}") as { text?: string }).text?.trim() ?? "";
  } catch {
    return Res.text("OK");
  }

  const chatId = message.chat_id;
  const command = parseCommand(text);

  if (!command || command.action === "help") {
    await sendFeishu(env, chatId, HELP_TEXT);
    return Res.text("OK");
  }

  if (command.action === "list") {
    const repo = new ArticleRepository(env.DB);
    const articles = await repo.list({ limit: 5 });
    const reply = articles.length > 0
      ? articles.map((a, i) => `${i + 1}. ${a.title} [${a.status}]`).join("\n")
      : "暂无文章";
    await sendFeishu(env, chatId, reply);
    return Res.text("OK");
  }

  if (command.action === "fetch" && command.target) {
    if (!await checkRateLimit("feishu", chatId)) {
      await sendFeishu(env, chatId, "⚠️ 操作太频繁，请稍后再试");
      return Res.text("OK");
    }

    await sendFeishu(env, chatId, `收到，正在抓取... ⏳\n${command.target}`);

    try {
      const service = new FetchService(env, log);
      const result = await service.fetchUrl(command.target);
      await sendFeishu(env, chatId, `✅ 抓取成功\n标题: ${result.title}\n状态: ${result.status}\n来源: ${result.sourceType}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "未知错误";
      await sendFeishu(env, chatId, `❌ 抓取失败: ${msg}`);
    }

    return Res.text("OK");
  }

  await sendFeishu(env, chatId, "🤔 无法识别指令，发送 /help 查看帮助");
  return Res.text("OK");
}

async function sendFeishu(env: Env, chatId: string, text: string): Promise<void> {
  const appId = env.FEISHU_APP_ID;
  const appSecret = env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) return;

  // Get tenant token
  const tokenResp = await fetchWithTimeout(EXTERNAL_URL.FEISHU_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const tokenData = await tokenResp.json() as { tenant_access_token: string };

  await fetchWithTimeout(`${EXTERNAL_URL.FEISHU_API_BASE}/im/v1/messages?receive_id_type=chat_id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenData.tenant_access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receive_id: chatId,
      msg_type: "text",
      content: JSON.stringify({ text }),
    }),
  });
}
