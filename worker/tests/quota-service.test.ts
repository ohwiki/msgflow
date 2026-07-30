import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { toCardViewModels, parseDateStr, formatDate, formatRemaining } from "../src/services/quota-service.js";
import type { QuotaResult } from "../src/types/quota.js";

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
    },
  };
}

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
