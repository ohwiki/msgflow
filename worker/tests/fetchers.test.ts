import { describe, it, expect } from "vitest";
import { weixinFetcher } from "../src/fetchers/weixin.js";
import { feishuFetcher } from "../src/fetchers/feishu.js";
import { twitterFetcher } from "../src/fetchers/twitter.js";
import { rssFetcher } from "../src/fetchers/rss.js";
import { genericFetcher } from "../src/fetchers/generic.js";

describe("Fetcher.canHandle", () => {
  describe("weixinFetcher", () => {
    it("handles weixin URLs", () => {
      expect(weixinFetcher.canHandle("https://mp.weixin.qq.com/s/abc")).toBe(true);
    });
    it("rejects non-weixin URLs", () => {
      expect(weixinFetcher.canHandle("https://example.com")).toBe(false);
    });
  });

  describe("feishuFetcher", () => {
    it("handles feishu.cn URLs", () => {
      expect(feishuFetcher.canHandle("https://xxx.feishu.cn/docx/abc")).toBe(true);
    });
    it("handles larksuite URLs", () => {
      expect(feishuFetcher.canHandle("https://xxx.larksuite.com/wiki/abc")).toBe(true);
    });
    it("rejects non-feishu URLs", () => {
      expect(feishuFetcher.canHandle("https://example.com")).toBe(false);
    });
  });

  describe("twitterFetcher", () => {
    it("handles twitter.com", () => {
      expect(twitterFetcher.canHandle("https://twitter.com/user/status/1")).toBe(true);
    });
    it("handles x.com", () => {
      expect(twitterFetcher.canHandle("https://x.com/user/status/1")).toBe(true);
    });
    it("rejects non-twitter URLs", () => {
      expect(twitterFetcher.canHandle("https://example.com")).toBe(false);
    });
  });

  describe("rssFetcher", () => {
    it("handles .xml URLs", () => {
      expect(rssFetcher.canHandle("https://example.com/feed.xml")).toBe(true);
    });
    it("handles /feed paths", () => {
      expect(rssFetcher.canHandle("https://example.com/feed")).toBe(true);
    });
    it("handles /rss paths", () => {
      expect(rssFetcher.canHandle("https://example.com/rss")).toBe(true);
    });
    it("rejects non-RSS URLs", () => {
      expect(rssFetcher.canHandle("https://example.com/article")).toBe(false);
    });
  });

  describe("genericFetcher", () => {
    it("handles everything (fallback)", () => {
      expect(genericFetcher.canHandle("https://anything.com")).toBe(true);
    });
  });
});
