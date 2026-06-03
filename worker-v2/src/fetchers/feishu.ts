/**
 * Feishu/Lark document fetcher — via Open API.
 */

import type { Fetcher, FetchResult } from "../types/fetcher.js";
import { fetchWithTimeout } from "../lib/http.js";
import { FetchError } from "../lib/errors.js";
import { URL_PATTERN, EXTERNAL_URL } from "../lib/constants.js";
import type { Logger } from "../lib/log.js";

export const feishuFetcher: Fetcher = {
  canHandle(url: string): boolean {
    return URL_PATTERN.FEISHU.some((p) => url.includes(p));
  },

  async fetch(url: string, env: Env, log: Logger): Promise<FetchResult> {
    const appId = env.FEISHU_APP_ID;
    const appSecret = env.FEISHU_APP_SECRET;
    if (!appId || !appSecret) throw new FetchError(url, "FEISHU_APP_ID and FEISHU_APP_SECRET required");

    const docMatch = url.match(/\/(docx|wiki|docs?)\/([a-zA-Z0-9]+)/);
    if (!docMatch) throw new FetchError(url, "Cannot parse document ID from URL");
    const docType = docMatch[1];
    let docId = docMatch[2]!;

    // Get tenant access token
    const tokenResp = await fetchWithTimeout(EXTERNAL_URL.FEISHU_TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    });
    const tokenData = await tokenResp.json() as { tenant_access_token: string };
    const token = tokenData.tenant_access_token;

    // Resolve wiki to actual doc ID
    if (docType === "wiki") {
      const wikiResp = await fetchWithTimeout(
        `${EXTERNAL_URL.FEISHU_API_BASE}/wiki/v2/spaces/get_node?token=${docId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const wikiData = await wikiResp.json() as { data?: { node?: { obj_token: string } } };
      docId = wikiData.data?.node?.obj_token ?? docId;
    }

    // Get document blocks
    const docResp = await fetchWithTimeout(
      `${EXTERNAL_URL.FEISHU_API_BASE}/docx/v1/documents/${docId}/blocks?page_size=500`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const docData = await docResp.json() as { data?: { items: FeishuBlock[] } };
    const blocks = docData.data?.items ?? [];

    // Get title
    const titleResp = await fetchWithTimeout(
      `${EXTERNAL_URL.FEISHU_API_BASE}/docx/v1/documents/${docId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const titleData = await titleResp.json() as { data?: { document?: { title: string } } };
    const title = titleData.data?.document?.title ?? "";

    // Convert blocks to HTML
    const htmlParts: string[] = [];
    for (const block of blocks) {
      const text = extractBlockText(block);
      if (block.block_type === 2 && block.heading) {
        htmlParts.push(`<h${block.heading.level}>${text}</h${block.heading.level}>`);
      } else if (block.block_type === 14 && block.code) {
        const code = block.code.body.elements.map((e) => e.text_run?.content ?? "").join("");
        htmlParts.push(`<pre><code>${code}</code></pre>`);
      } else if (text) {
        htmlParts.push(`<p>${text}</p>`);
      }
    }

    const html = htmlParts.join("\n");
    // 飞书文档始终走 GitHub Actions + Python（Python 版 API 解析质量更高）
    return { title, author: "", sourceName: "飞书文档", html, hasCodeBlocks: true };
  },
};

interface FeishuBlock {
  block_type: number;
  text?: { elements: Array<{ text_run?: { content: string } }> };
  heading?: { elements: Array<{ text_run?: { content: string } }>; level: number };
  code?: { body: { elements: Array<{ text_run?: { content: string } }> } };
}

function extractBlockText(block: FeishuBlock): string {
  const elements = block.text?.elements ?? block.heading?.elements ?? [];
  return elements.map((e) => e.text_run?.content ?? "").join("");
}
