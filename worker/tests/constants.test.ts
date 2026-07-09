import { describe, it, expect } from "vitest";
import { detectSourceType, SOURCE_TYPE, URL_PATTERN, urlMatches } from "../src/lib/constants.js";

describe("detectSourceType", () => {
  it("detects weixin URLs", () => {
    expect(detectSourceType("https://mp.weixin.qq.com/s/abc123")).toBe(SOURCE_TYPE.WEIXIN);
  });

  it("detects feishu URLs", () => {
    expect(detectSourceType("https://xxx.feishu.cn/docx/abc")).toBe(SOURCE_TYPE.FEISHU);
    expect(detectSourceType("https://xxx.larksuite.com/wiki/abc")).toBe(SOURCE_TYPE.FEISHU);
  });

  it("detects twitter URLs", () => {
    expect(detectSourceType("https://twitter.com/user/status/123")).toBe(SOURCE_TYPE.TWITTER);
    expect(detectSourceType("https://x.com/user/status/123")).toBe(SOURCE_TYPE.TWITTER);
  });

  it("detects RSS URLs", () => {
    expect(detectSourceType("https://example.com/feed.xml")).toBe(SOURCE_TYPE.RSS);
    expect(detectSourceType("https://example.com/feed")).toBe(SOURCE_TYPE.RSS);
    expect(detectSourceType("https://example.com/rss")).toBe(SOURCE_TYPE.RSS);
  });

  it("defaults to web for unknown URLs", () => {
    expect(detectSourceType("https://example.com/article")).toBe(SOURCE_TYPE.WEB);
  });
});

describe("urlMatches", () => {
  it("returns true when URL contains any pattern", () => {
    expect(urlMatches("https://mp.weixin.qq.com/s/abc", URL_PATTERN.WEIXIN)).toBe(true);
  });

  it("returns false when URL matches no pattern", () => {
    expect(urlMatches("https://example.com", URL_PATTERN.WEIXIN)).toBe(false);
  });
});
