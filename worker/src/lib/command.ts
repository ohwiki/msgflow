/**
 * Command parser — extract intent from chat messages.
 */

export interface Command {
  action: string;
  target?: string;
}

const HELP_TEXT = `支持的指令：
• 发送 URL → 自动抓取为 Markdown
• /help → 显示帮助
• /list → 最近抓取的文章`;

export function parseCommand(text: string): Command | null {
  if (!text) return null;
  text = text.replace(/^\/start\s*/, "").trim();
  if (!text) return null;

  if (/^(?:帮助|help|\/help|\?)$/i.test(text)) return { action: "help" };
  if (/^(?:列表|list|\/list)$/i.test(text)) return { action: "list" };

  // URL detection — most common case
  const urlMatch = text.match(/(https?:\/\/\S+)/i);
  if (urlMatch) return { action: "fetch", target: urlMatch[1] };

  return null;
}

export { HELP_TEXT };
