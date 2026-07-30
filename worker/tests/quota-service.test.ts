import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  toCardViewModels,
  toRowViewModels,
  toDetailViewModel,
  keyId,
  parseDateStr,
  formatDate,
  formatRemaining,
  QuotaService,
} from "../src/services/quota-service.js";
import type { QuotaResult, IQuotaClient } from "../src/types/quota.js";
import type { Logger } from "../src/lib/log.js";

function result(created: string, expired: string): QuotaResult {
  return {
    label: "test",
    masked: "sk-***",
    rawKey: "sk-full",
    ok: true,
    key_info: {
      name: "Pro",
      total_quota: 100,
      used_quota: 40,
      remain_quota: 60,
      usage_percentage: 40,
      remaining_percentage: 60,
      status: 1,
      created_time: created,
      expired_time: expired,
      key_flag: "双享卡",
      group: "yk_sx",
      upstream_id: "1900",
    },
  };
}

describe("QuotaService.queryAll", () => {
  const log = { info() {}, warn() {}, error() {} } as unknown as Logger;

  it("queries every key and preserves input order", async () => {
    const entries = Array.from({ length: 25 }, (_, i) => ({ label: `k${i}`, key: `sk-${i}` }));
    const client: IQuotaClient = {
      async query(apiKey) {
        // Reverse-correlated delay: without order-preserving writes, results would come back shuffled.
        await new Promise((r) => setTimeout(r, 25 - Number(apiKey.slice(3))));
        return { ...result("2026-07-01 00:00:00", "2026-08-01 00:00:00").key_info!, name: apiKey };
      },
    };
    const results = await new QuotaService(client, log).queryAll(entries);
    expect(results).toHaveLength(25);
    expect(results.map((r) => r.key_info!.name)).toEqual(entries.map((e) => e.key));
  });

  it("caps in-flight requests without dropping keys", async () => {
    let inFlight = 0;
    let peak = 0;
    const client: IQuotaClient = {
      async query() {
        peak = Math.max(peak, ++inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
        return result("2026-07-01 00:00:00", "2026-08-01 00:00:00").key_info!;
      },
    };
    const entries = Array.from({ length: 20 }, (_, i) => ({ label: `k${i}`, key: `sk-${i}` }));
    const results = await new QuotaService(client, log).queryAll(entries);
    expect(results).toHaveLength(20);
    expect(peak).toBeLessThanOrEqual(6);
  });
});

describe("parseDateStr", () => {
  it("treats offset-less timestamps as Beijing time", () => {
    expect(parseDateStr("2026-07-30 23:59:59")).toBe(Date.parse("2026-07-30T23:59:59+08:00"));
  });

  it("returns null for empty input", () => {
    expect(parseDateStr("")).toBeNull();
  });
});

describe("toCardViewModels timeline", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-07-30T15:37:00+08:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows hours only when under a day away", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "2026-07-30 23:59:59")]);
    expect(vm.remainText).toBe("8 小时");
    expect(vm.isExpired).toBe(false);
    expect(vm.isUrgent).toBe(true);
  });

  it("distinguishes two sub-24h expiries that previously both read 1 天", () => {
    const tonight = toCardViewModels([result("2026-07-01 00:00:00", "2026-07-30 23:59:59")])[0]!;
    const tomorrow = toCardViewModels([result("2026-07-01 15:33:15", "2026-07-31 15:33:15")])[0]!;
    expect(tonight.remainText).toBe("8 小时");
    expect(tomorrow.remainText).toBe("23 小时");
  });

  it("shows days and hours together for a distant expiry", () => {
    const [vm] = toCardViewModels([result("2026-07-01 00:00:00", "2026-08-09 10:00:00")]);
    expect(vm.remainText).toBe("9 天 18 小时");
    expect(vm.isUrgent).toBe(false);
  });

  it("marks a past expiry as expired", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "2026-07-29 23:59:59")]);
    expect(vm.isExpired).toBe(true);
    expect(vm.remainText).toBe("已到期");
  });

  it("computes timeline progress across the service window", () => {
    const [vm] = toCardViewModels([result("2026-07-01 00:00:00", "2026-07-31 00:00:00")]);
    expect(vm.timelinePct).toBe(99);
  });

  it("omits the hours part when it lands exactly on a day", () => {
    const [vm] = toCardViewModels([result("2026-07-01 15:37:00", "2026-08-02 15:37:00")]);
    expect(vm.remainText).toBe("3 天");
  });

  it("flags unknown timeline when expiry is missing", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "")]);
    expect(vm.daysUnknown).toBe(true);
    expect(vm.daysLeft).toBeUndefined();
  });
});

describe("keyId", () => {
  it("is deterministic for the same key", () => {
    expect(keyId("sk-abc123")).toBe(keyId("sk-abc123"));
  });

  it("differs between keys", () => {
    expect(keyId("sk-abc123")).not.toBe(keyId("sk-abc124"));
  });

  it("is always 8 lowercase hex chars", () => {
    for (const k of ["", "sk-a", "sk-" + "x".repeat(200), "键"]) {
      expect(keyId(k)).toMatch(/^[0-9a-f]{8}$/);
    }
  });
});

describe("toRowViewModels", () => {
  it("carries a detail id derived from the raw key", () => {
    const [row] = toRowViewModels([result("2026-07-01 00:00:00", "2026-08-01 00:00:00")]);
    expect(row!.id).toBe(keyId("sk-full"));
  });

  it("colours the bar by remaining quota band", () => {
    const bands: [number, string][] = [
      [8, "#f87171"],
      [10, "#f87171"],
      [11, "#fbbf24"],
      [30, "#fbbf24"],
      [31, "#3b82f6"],
    ];
    for (const [pct, color] of bands) {
      const r = result("2026-07-01 00:00:00", "2026-08-01 00:00:00");
      r.key_info!.remaining_percentage = pct;
      expect(toRowViewModels([r])[0]!.pctColor).toBe(color);
    }
  });

  it("passes through failed lookups without a percentage", () => {
    const [row] = toRowViewModels([
      { label: "bad", masked: "sk-***", rawKey: "sk-bad", ok: false, info: "HTTP 500" },
    ]);
    expect(row!.ok).toBe(false);
    expect(row!.info).toBe("HTTP 500");
    expect(row!.pctColor).toBeUndefined();
  });
});

describe("toDetailViewModel", () => {
  it("exposes the upstream metadata fields", () => {
    const vm = toDetailViewModel(result("2026-07-01 00:00:00", "2026-08-01 00:00:00"));
    expect(vm.keyFlag).toBe("双享卡");
    expect(vm.group).toBe("yk_sx");
    expect(vm.upstreamId).toBe("1900");
    expect(vm.id).toBe(keyId("sk-full"));
  });

  it("falls back to a dash when upstream omits them", () => {
    const r = result("2026-07-01 00:00:00", "2026-08-01 00:00:00");
    Object.assign(r.key_info!, { key_flag: "", group: "", upstream_id: "" });
    const vm = toDetailViewModel(r);
    expect([vm.keyFlag, vm.group, vm.upstreamId]).toEqual(["—", "—", "—"]);
  });

  it("still renders identity fields for a failed lookup", () => {
    const vm = toDetailViewModel({ label: "bad", masked: "sk-***", rawKey: "sk-bad", ok: false, info: "超时" });
    expect(vm.ok).toBe(false);
    expect(vm.keyFlag).toBe("—");
  });
});

describe("formatRemaining", () => {
  const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR;

  it("falls back to minutes under an hour", () => {
    expect(formatRemaining(42 * MIN)).toBe("42 分钟");
  });

  it("floors rather than rounding up", () => {
    expect(formatRemaining(2 * DAY + 5 * HOUR + 59 * MIN)).toBe("2 天 5 小时");
  });

  it("reports expiry for non-positive input", () => {
    expect(formatRemaining(0)).toBe("已到期");
    expect(formatRemaining(-HOUR)).toBe("已到期");
  });
});

describe("formatDate", () => {
  it("normalizes to slash-separated local display", () => {
    expect(formatDate("2026-07-02 18:17:33")).toBe("2026/7/2 18:17:33");
  });
});
