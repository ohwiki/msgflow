/**
 * RSS AI 助手（AskCat 式斜杠命令）。
 *
 * 复用 KV 的 nullclaw_* 配置，直连 OpenAI 兼容 /chat/completions。
 * 未配置时优雅降级（返回提示，不报错）。
 */

import { fetchWithTimeout } from "../lib/http.js";
import { RssRepository } from "../repositories/rss-repository.js";
import { ensureArticleContent } from "./rss-service.js";
import type { Logger } from "../lib/log.js";

interface AiRequest {
  command?: string;
  articleId?: number;
  feedId?: number;
  question?: string;
}

interface AiResult {
  reply?: string;
  error?: string;
  status?: number;
}

/** 斜杠命令 → 指令模板。{ctx} 由代码注入上下文。 */
const COMMANDS: Record<string, { needs: "article" | "feed" | "none"; instruction: string }> = {
  "/summary": { needs: "article", instruction: "用中文简洁总结这篇文章的核心内容，3-5 句话。" },
  "/keypoints": { needs: "article", instruction: "提取这篇文章的关键要点，用中文列成 3-6 条 bullet。" },
  "/translate": { needs: "article", instruction: "把这篇文章翻译成流畅的中文，保留技术术语原文。" },
  "/explain": { needs: "article", instruction: "解释这篇文章里出现的专业术语和概念，面向普通读者，用中文。" },
  "/opinion": { needs: "article", instruction: "对这篇文章做一段有观点的评析，指出亮点与局限，用中文。" },
  "/digest": { needs: "feed", instruction: "根据这个订阅源近期的文章标题，用中文概括它最近在关注什么。" },
  "/intro": { needs: "feed", instruction: "根据这个订阅源近期的文章，用中文介绍它是做什么的、适合谁订阅。" },
  "/recommend": { needs: "feed", instruction: "从这个订阅源近期文章里，用中文推荐最值得读的 3 篇并说明理由。" },
};

async function getConfig(env: Env): Promise<{ apiKey: string; baseUrl: string; model: string } | null> {
  const [apiKey, baseUrl, model] = await Promise.all([
    env.KV.get("nullclaw_api_key"),
    env.KV.get("nullclaw_base_url"),
    env.KV.get("nullclaw_model"),
  ]);
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl, model: model ?? "gpt-4o-mini" };
}

export async function runRssAi(env: Env, log: Logger, req: AiRequest): Promise<AiResult> {
  const cmd = req.command ?? "";
  const spec = COMMANDS[cmd];
  const isFree = !spec; // 非预设命令 → 当作自由提问

  const config = await getConfig(env);
  if (!config) {
    return { reply: "⚠️ 尚未配置 AI（KV 缺少 nullclaw_api_key / nullclaw_base_url）。请到「设置」页配置后再用。" };
  }

  const repo = new RssRepository(env.DB);
  let context = "";
  let instruction = spec?.instruction ?? "";

  if (isFree) {
    if (!req.question?.trim()) return { error: "question is required for free chat", status: 400 };
    instruction = req.question.trim();
    // 自由提问也可带文章上下文
    if (req.articleId) {
      let a = await repo.getArticle(req.articleId);
      if (a) {
        a = await ensureArticleContent(a, repo, env, log);
        context = `文章标题：${a.title}\n\n正文：\n${(a.content ?? "").replace(/<[^>]*>/g, "").slice(0, 6000)}`;
      }
    }
  } else if (spec.needs === "article") {
    if (!req.articleId) return { error: "articleId is required", status: 400 };
    let a = await repo.getArticle(req.articleId);
    if (!a) return { error: "article not found", status: 404 };
    a = await ensureArticleContent(a, repo, env, log);
    context = `文章标题：${a.title}\n\n正文：\n${(a.content ?? "").replace(/<[^>]*>/g, "").slice(0, 6000)}`;
  } else if (spec.needs === "feed") {
    if (!req.feedId) return { error: "feedId is required", status: 400 };
    const feed = await repo.getFeed(req.feedId);
    if (!feed) return { error: "feed not found", status: 404 };
    const titles = await repo.recentTitles(req.feedId, 20);
    context = `订阅源：${feed.title}\n\n近期文章：\n${titles.map((t, i) => `${i + 1}. ${t.title} — ${t.snippet}`).join("\n")}`;
  }

  const userContent = context ? `${instruction}\n\n---\n${context}` : instruction;

  let resp: Response;
  try {
    resp = await fetchWithTimeout(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      timeoutMs: 120_000,
      headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "你是 RSS 阅读助手，回答简洁、用中文、可用 Markdown。" },
          { role: "user", content: userContent },
        ],
      }),
    });
  } catch (e) {
    log.error("rss_ai_network", { error: e instanceof Error ? e.message : "unknown" });
    return { error: "AI 网络错误", status: 502 };
  }

  if (!resp.ok) {
    log.error("rss_ai_http", { status: String(resp.status) });
    return { error: `AI 接口错误 ${resp.status}`, status: 502 };
  }

  const data = await resp.json<{ choices?: { message?: { content?: string } }[] }>();
  const reply = data.choices?.[0]?.message?.content ?? "";
  log.info("rss_ai_ok", { command: cmd || "free" });
  return { reply };
}
