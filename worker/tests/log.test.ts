import { describe, it, expect, vi } from "vitest";
import { createLogger } from "../src/lib/log.js";

describe("createLogger", () => {
  it("creates logger with context", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const log = createLogger({ rid: "test-123", path: "/api/fetch", method: "POST" });

    log.info("fetch_start", { url: "https://example.com" });

    expect(spy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(output.level).toBe("info");
    expect(output.event).toBe("fetch_start");
    expect(output.rid).toBe("test-123");
    expect(output.url).toBe("https://example.com");
    expect(output.ts).toBeDefined();

    spy.mockRestore();
  });

  it("error logs to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const log = createLogger({ rid: "err-456" });

    log.error("unhandled", { error: "boom" });

    expect(spy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(output.level).toBe("error");
    expect(output.error).toBe("boom");

    spy.mockRestore();
  });
});
