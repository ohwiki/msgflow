import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { toCardViewModels, parseDateStr, formatDate } from "../src/services/quota-service.js";
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

  it("reads an expiry later today as 今天到期, not 1 天", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "2026-07-30 23:59:59")]);
    expect(vm.daysToday).toBe(true);
    expect(vm.daysWarning).toBe(false);
    expect(vm.isExpired).toBe(false);
  });

  it("distinguishes tomorrow from later today even when both are under 24h away", () => {
    const today = toCardViewModels([result("2026-07-01 00:00:00", "2026-07-30 23:59:59")])[0]!;
    const tomorrow = toCardViewModels([result("2026-07-01 15:33:15", "2026-07-31 15:33:15")])[0]!;
    expect(today.daysToday).toBe(true);
    expect(tomorrow.daysLeft).toBe(1);
    expect(tomorrow.daysToday).toBe(false);
  });

  it("marks a past expiry as expired", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "2026-07-29 23:59:59")]);
    expect(vm.isExpired).toBe(true);
    expect(vm.daysToday).toBe(false);
    expect(vm.daysLeft).toBe(0);
  });

  it("counts full calendar days for a distant expiry", () => {
    const [vm] = toCardViewModels([result("2026-07-01 00:00:00", "2026-08-09 10:00:00")]);
    expect(vm.daysLeft).toBe(10);
    expect(vm.daysNormal).toBe(true);
  });

  it("computes timeline progress across the service window", () => {
    const [vm] = toCardViewModels([result("2026-07-01 00:00:00", "2026-07-31 00:00:00")]);
    expect(vm.timelinePct).toBe(99);
  });

  it("flags unknown timeline when expiry is missing", () => {
    const [vm] = toCardViewModels([result("2026-05-29 18:17:33", "")]);
    expect(vm.daysUnknown).toBe(true);
    expect(vm.daysLeft).toBeUndefined();
  });
});

describe("formatDate", () => {
  it("normalizes to slash-separated local display", () => {
    expect(formatDate("2026-07-02 18:17:33")).toBe("2026/7/2 18:17:33");
  });
});
