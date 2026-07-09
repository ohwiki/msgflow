/**
 * Structured logging — context passed explicitly, no shared mutable state.
 */

export interface LogContext {
  rid: string;
  [key: string]: string;
}

function emit(level: string, ctx: LogContext, event: string, data?: Record<string, string>) {
  const entry = { level, event, ...ctx, ...data, ts: new Date().toISOString() };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export function createLogger(ctx: LogContext) {
  return {
    info: (event: string, data?: Record<string, string>) => emit("info", ctx, event, data),
    warn: (event: string, data?: Record<string, string>) => emit("warn", ctx, event, data),
    error: (event: string, data?: Record<string, string>) => emit("error", ctx, event, data),
  };
}

export type Logger = ReturnType<typeof createLogger>;
