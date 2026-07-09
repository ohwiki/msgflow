/**
 * Rate limiter — Cache API based, per-user per-minute.
 */

import { DEFAULTS } from "./constants.js";

const MAX_PER_MINUTE = 5;

export async function checkRateLimit(channel: string, userId: string): Promise<boolean> {
  const key = new Request(`https://ratelimit/${channel}:${userId}`);
  const cache = caches.default;
  const cached = await cache.match(key);
  const count = cached ? parseInt(await cached.text()) : 0;

  if (count >= MAX_PER_MINUTE) return false;

  await cache.put(key, new Response(String(count + 1), {
    headers: { "Cache-Control": "max-age=60" },
  }));
  return true;
}
