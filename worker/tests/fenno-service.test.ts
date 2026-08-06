import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseUsage,
  formatIsoDate,
  parseIso,
  toFennoRowViewModels,
  toFennoDetailViewModel,
} from "../src/services/fenno-service.js";
import type { FennoResult } from "../src/types/fenno.js";

const RAW = {
  isValid: true,
  mode: "unrestricted",
  planName: "coding-plan/spec-A",
  remaining: 98.28415312,
  unit: "USD",
  subscription: {
    daily_limit_usd: 100,
    daily_usage_usd: 1.71584688,
    weekly_limit_usd: 0,
    weekly_usage_usd: 3.91308263,
    monthly_limit_usd: 1800,
    monthly_usage_usd: 3.91308263,
    weekly_window_start: "2026-08-04T00:00:00+08:00",
    expires_at: "2026-09-04T15:33:44.581867+08:00",
  },
  usage: {
    today: { requests: 31, input_tokens: 188948, output_tokens: 20768, cache_creation_tokens: 0, cache_read_tokens: 1699072, total_tokens: 1908788, cost: 1.71584688, actual_cost: 1.71584688 },
    total: { requests: 100, input_tokens: 576165, output_tokens: 49119, cache_creation_tokens: 0, cache_read_tokens: 3737344, total_tokens: 4362628, cost: 3.91308263, actual_cost: 3.91308263 },
    rpm: 3,
    tpm: 272387,
    average_duration_ms: 11958.79,
  },
  daily_usage: [
    { date: "2026-08-04", requests: 69, input_tokens: 387217, output_tokens: 28351, cache_read_tokens: 2038272, cache_write_tokens: 0, total_tokens: 2453840, cost: 2.19723575, actual_cost: 2.19723575 },
  ],
  model_stats: [
    { model: "gpt-5.6-sol", requests: 46, input_tokens: 221131, output_tokens: 23910, cache_creation_tokens: 0, cache_read_tokens: 2093056, total_tokens: 2338097, cost: 2.869483, actual_cost: 2.869483, account_cost: 2.869483 },
  ],
};

function result(raw: object = RAW): FennoResult {
  return { label: "主号", masked: "sk-abc...1234", rawKey: "sk-abcdefghijklmnop1234", ok: true, usage: parseUsage(raw as Record<string, unknown>) };
}

describe("parseIso", () => {
  it("honours the explicit offset instead of assuming Beijing time", () => {
    expect(parseIso("2026-09-04T15:33:44+08:00")).toBe(Date.parse("2026-09-04T07:33:44Z"));
    expect(parseIso("2026-09-04T15:33:44Z")).toBe(Date.parse("2026-09-04T15:33:44Z"));
  });

  it("returns null for empty or unparseable input", () => {
    expect(parseIso("")).toBeNull();
    expect(parseIso("nonsense")).toBeNull();
  });
});

describe("formatIsoDate", () => {
  it("renders in Beijing time", () => {
    expect(formatIsoDate("2026-09-04T15:33:44.581867+08:00")).toBe("2026/9/4 15:33:44");
  });

  it("converts a UTC timestamp to Beijing time", () => {
    expect(formatIsoDate("2026-09-04T00:00:00Z")).toBe("2026/9/4 08:00:00");
  });

  it("falls back to a dash when missing", () => {
    expect(formatIsoDate("")).toBe("—");
  });
});

describe("parseUsage", () => {
  it("maps the documented payload", () => {
    const u = parseUsage(RAW as Record<string, unknown>);
    expect(u.planName).toBe("coding-plan/spec-A");
    expect(u.isValid).toBe(true);
    expect(u.remaining).toBeCloseTo(98.28415312);
    expect(u.subscription.daily_limit_usd).toBe(100);
    expect(u.today.requests).toBe(31);
    expect(u.total.total_tokens).toBe(4362628);
    expect(u.averageDurationMs).toBeCloseTo(11958.79);
    expect(u.daily).toHaveLength(1);
    expect(u.models).toHaveLength(1);
  });

  it("leaves models undefined when model_stats is absent", () => {
    const { model_stats, ...withoutModels } = RAW;
    expect(parseUsage(withoutModels as Record<string, unknown>).models).toBeUndefined();
  });

  it("reads cache_write_tokens for daily entries, which use a different field name", () => {
    const u = parseUsage(RAW as Record<string, unknown>);
    expect(u.daily[0]!.cache_write_tokens).toBe(0);
    expect(u.daily[0]!.cache_read_tokens).toBe(2038272);
  });

  it("derives today's spend from usage.today, ignoring a stale daily_usage_usd", () => {
    // Real upstream state seen on 2026-08-06: a key that exhausted its cap the previous
    // day still reported daily_usage_usd=100.07 and remaining=0, while usage.today was 0.
    const stale = {
      ...RAW,
      remaining: 0,
      subscription: { ...RAW.subscription, daily_usage_usd: 100.06854288 },
      usage: { ...RAW.usage, today: { ...RAW.usage.today, requests: 0, total_tokens: 0, cost: 0, actual_cost: 0 } },
    };
    const u = parseUsage(stale as Record<string, unknown>);
    expect(u.dailyUsed).toBe(0);
    expect(u.dailyRemaining).toBe(100);
    expect(u.remaining).toBe(0); // raw value preserved, just not used for display
  });

  it("never reports negative remaining when spend overshoots the cap", () => {
    const over = {
      ...RAW,
      usage: { ...RAW.usage, today: { ...RAW.usage.today, cost: 100.07 } },
    };
    expect(parseUsage(over as Record<string, unknown>).dailyRemaining).toBe(0);
  });

  it("survives an empty object without throwing", () => {
    const u = parseUsage({});
    expect(u.isValid).toBe(false);
    expect(u.remaining).toBe(0);
    expect(u.unit).toBe("USD");
    expect(u.daily).toEqual([]);
    expect(u.models).toBeUndefined();
  });
});

describe("view models", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-08-05T12:00:00+08:00"));
  });
  afterEach(() => vi.useRealTimers());

  describe("toFennoRowViewModels", () => {
    it("derives the percentage from the daily cap and labels it as such", () => {
      const [row] = toFennoRowViewModels([result()]);
      // (100 - today.cost 1.716) / 100 → 98%, and the label must say 今日
      // so it isn't read as a lifetime balance.
      expect(row!.pctNum).toBe(98);
      expect(row!.pctLabel).toBe("今日");
      expect(row!.pctColor).toBe("#3b82f6");
      expect(row!.provider).toBe("fenno");
      expect(row!.id).toMatch(/^[0-9a-f]{8}$/);
    });

    it("computes remaining time from expires_at", () => {
      const [row] = toFennoRowViewModels([result()]);
      expect(row!.remainText).toBe("30 天 3 小时");
      expect(row!.isExpired).toBe(false);
      expect(row!.isUrgent).toBe(false);
    });

    it("marks an elapsed subscription as expired", () => {
      const raw = { ...RAW, subscription: { ...RAW.subscription, expires_at: "2026-08-01T00:00:00+08:00" } };
      const [row] = toFennoRowViewModels([result(raw)]);
      expect(row!.isExpired).toBe(true);
    });

    it("reports 不限 with 0% rather than dividing by a zero daily cap", () => {
      const raw = { ...RAW, subscription: { ...RAW.subscription, daily_limit_usd: 0 } };
      const [row] = toFennoRowViewModels([result(raw)]);
      expect(row!.pctLabel).toBe("不限");
      expect(row!.pctNum).toBe(0);
    });

    it("passes failures through without touching usage", () => {
      const [row] = toFennoRowViewModels([{ label: "坏号", masked: "sk-x***", rawKey: "sk-x", ok: false, info: "INVALID_API_KEY" }]);
      expect(row!.ok).toBe(false);
      expect(row!.info).toBe("INVALID_API_KEY");
      expect(row!.pctNum).toBeUndefined();
    });
  });

  describe("toFennoDetailViewModel", () => {
    it("builds the three spend caps in order", () => {
      const vm = toFennoDetailViewModel(result());
      expect(vm.caps!.map((c) => c.name)).toEqual(["今日", "本周", "本月"]);
      expect(vm.caps![0]!).toMatchObject({ usedFmt: "1.72 USD", limitFmt: "100.00 USD", pct: 2, unlimited: false });
    });

    it("shows a reset day as 0 used / full remaining despite a stale daily_usage_usd", () => {
      const stale = {
        ...RAW,
        remaining: 0,
        subscription: { ...RAW.subscription, daily_usage_usd: 100.06854288 },
        usage: { ...RAW.usage, today: { ...RAW.usage.today, requests: 0, total_tokens: 0, cost: 0, actual_cost: 0 } },
      };
      const vm = toFennoDetailViewModel(result(stale));
      expect(vm.remainingFmt).toBe("100.00");
      expect(vm.caps![0]!).toMatchObject({ usedFmt: "0.00 USD", pct: 0 });
      // The cumulative windows keep their upstream values — only the daily figure is rebuilt.
      expect(vm.caps![2]!.usedFmt).toBe("3.91 USD");
    });

    it("treats a zero weekly limit as 未设置 rather than a spent budget", () => {
      const weekly = toFennoDetailViewModel(result()).caps![1]!;
      expect(weekly.unlimited).toBe(true);
      expect(weekly.limitFmt).toBe("未设置");
      expect(weekly.pct).toBe(0);
    });

    it("colours a cap red once it nears the limit", () => {
      const raw = { ...RAW, usage: { ...RAW.usage, today: { ...RAW.usage.today, cost: 95 } } };
      expect(toFennoDetailViewModel(result(raw)).caps![0]!.color).toBe("#f87171");
    });

    it("formats usage blocks and live metrics", () => {
      const vm = toFennoDetailViewModel(result());
      expect(vm.today).toMatchObject({ requests: "31", totalTokens: "1,908,788", costFmt: "1.72 USD" });
      expect(vm.total).toMatchObject({ requests: "100", totalTokens: "4,362,628" });
      expect(vm.tpm).toBe("272,387");
      expect(vm.avgDuration).toBe("11.96s");
    });

    it("hides the model table when model_stats is absent", () => {
      const { model_stats, ...withoutModels } = RAW;
      const vm = toFennoDetailViewModel(result(withoutModels));
      expect(vm.hasModels).toBe(false);
      expect(vm.models).toEqual([]);
    });

    it("keeps the id consistent with the list row so the detail link resolves", () => {
      const r = result();
      expect(toFennoDetailViewModel(r).id).toBe(toFennoRowViewModels([r])[0]!.id);
    });

    it("passes failures through", () => {
      const vm = toFennoDetailViewModel({ label: "坏号", masked: "sk-x***", rawKey: "sk-x", ok: false, info: "401" });
      expect(vm.ok).toBe(false);
      expect(vm.caps).toBeUndefined();
    });
  });
});
