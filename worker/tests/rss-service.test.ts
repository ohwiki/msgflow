import { describe, it, expect } from "vitest";
import { parseFeedXml } from "../src/services/rss-service.js";

describe("parseFeedXml — RSS 2.0", () => {
  const xml = `<?xml version="1.0"?>
  <rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
    <channel>
      <title>Example Feed</title>
      <link>https://example.com</link>
      <item>
        <title>First Post</title>
        <link>https://example.com/1</link>
        <guid>post-1</guid>
        <pubDate>Wed, 02 Oct 2024 08:00:00 GMT</pubDate>
        <dc:creator>Alice</dc:creator>
        <content:encoded><![CDATA[<p>Hello <b>world</b> body content</p>]]></content:encoded>
        <enclosure url="https://example.com/audio.mp3" type="audio/mpeg"/>
      </item>
      <item>
        <title>Second Post</title>
        <link>https://example.com/2</link>
        <description>Just a description</description>
      </item>
    </channel>
  </rss>`;

  it("parses channel title and site url", () => {
    const r = parseFeedXml(xml);
    expect(r.feedTitle).toBe("Example Feed");
    expect(r.siteUrl).toBe("https://example.com");
    expect(r.items).toHaveLength(2);
  });

  it("normalizes item fields", () => {
    const [a] = parseFeedXml(xml).items;
    expect(a.title).toBe("First Post");
    expect(a.link).toBe("https://example.com/1");
    expect(a.guid).toBe("post-1");
    expect(a.author).toBe("Alice");
    expect(a.content).toContain("Hello");
    expect(a.snippet).toBe("Hello world body content");
    expect(a.enclosure).toBe("https://example.com/audio.mp3");
    expect(a.pubDate).toBeTypeOf("number");
  });

  it("falls back guid to link, content to description", () => {
    const [, b] = parseFeedXml(xml).items;
    expect(b.guid).toBe("https://example.com/2");
    expect(b.content).toBe("Just a description");
    expect(b.enclosure).toBe("");
    expect(b.pubDate).toBeNull();
  });
});

describe("parseFeedXml — Atom", () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
  <feed xmlns="http://www.w3.org/2005/Atom">
    <title>Atom Example</title>
    <link href="https://atom.example.com" rel="alternate"/>
    <entry>
      <title>Atom Entry</title>
      <id>urn:uuid:1234</id>
      <link href="https://atom.example.com/e1" rel="alternate"/>
      <link href="https://atom.example.com/edit" rel="edit"/>
      <updated>2024-10-02T08:00:00Z</updated>
      <author><name>Bob</name></author>
      <summary>Atom summary text</summary>
    </entry>
  </feed>`;

  it("parses atom feed and entry", () => {
    const r = parseFeedXml(xml);
    expect(r.feedTitle).toBe("Atom Example");
    expect(r.siteUrl).toBe("https://atom.example.com");
    expect(r.items).toHaveLength(1);
    const [e] = r.items;
    expect(e.title).toBe("Atom Entry");
    expect(e.guid).toBe("urn:uuid:1234");
    expect(e.link).toBe("https://atom.example.com/e1");
    expect(e.author).toBe("Bob");
    expect(e.content).toBe("Atom summary text");
    expect(e.pubDate).toBeTypeOf("number");
  });
});

describe("parseFeedXml — edge cases", () => {
  it("returns empty for non-feed xml", () => {
    const r = parseFeedXml("<html><body>not a feed</body></html>");
    expect(r.items).toHaveLength(0);
    expect(r.feedTitle).toBe("");
  });

  it("handles single item (not array)", () => {
    const xml = `<rss version="2.0"><channel><title>T</title><item><title>Only</title><link>https://x.com/o</link></item></channel></rss>`;
    const r = parseFeedXml(xml);
    expect(r.items).toHaveLength(1);
    expect(r.items[0].title).toBe("Only");
  });
});
