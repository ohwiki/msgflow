/**
 * Response helpers.
 */

import { HTTP_STATUS } from "./constants.js";

export const Res = {
  json(data: unknown, status: number = HTTP_STATUS.OK) {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  },

  html(body: string, status: number = HTTP_STATUS.OK) {
    return new Response(body, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },

  text(body: string, status: number = HTTP_STATUS.OK) {
    return new Response(body, {
      status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },

  redirect(url: string, status: number = HTTP_STATUS.MOVED) {
    return new Response(null, { status, headers: { Location: url } });
  },

  notFound() {
    return new Response("Not Found", { status: HTTP_STATUS.NOT_FOUND });
  },
};
