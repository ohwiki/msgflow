#!/usr/bin/env python3
"""AI 热门话题检测器 — 从多个 RSS 源判断什么话题火了

判断逻辑：同一关键词在 24 小时内出现在 2+ 个不同源 = 热门

用法：python3 hot_topics.py [--hours 24] [--min-sources 2]
输出：Markdown 格式的热门话题列表
"""
import feedparser
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from urllib.request import urlopen, Request
from urllib.error import URLError

# AI 相关 RSS 源
SOURCES = [
    {"name": "机器之心", "url": "https://www.jiqizhixin.com/rss", "lang": "zh"},
    {"name": "量子位", "url": "https://rsshub.app/qbitai/category/资讯", "lang": "zh"},
    {"name": "HuggingFace Papers", "url": "https://rsshub.app/huggingface/daily-papers", "lang": "en"},
    {"name": "OpenAI Blog", "url": "https://openai.com/blog/rss.xml", "lang": "en"},
    {"name": "Anthropic", "url": "https://www.anthropic.com/rss.xml", "lang": "en"},
    {"name": "Google DeepMind", "url": "https://deepmind.google/blog/rss.xml", "lang": "en"},
    {"name": "Product Hunt AI", "url": "https://www.producthunt.com/feed?category=artificial-intelligence", "lang": "en"},
]

# 高频 AI 关键词（用于匹配话题）
KEYWORDS = [
    "GPT-5", "GPT-6", "Claude", "Gemini", "MiMo", "DeepSeek", "Qwen",
    "Llama", "Mistral", "Sora", "Veo", "Agent", "MCP", "RAG",
    "多模态", "推理", "开源", "Coding", "Code", "Vision", "Voice",
    "Robotics", "自动驾驶", "具身智能", "世界模型",
]


def fetch_feed(source: dict, hours: int) -> list[dict]:
    """拉取一个 RSS 源最近 N 小时的条目"""
    try:
        feed = feedparser.parse(source["url"])
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        items = []
        for entry in feed.entries[:30]:
            # 解析时间
            published = entry.get("published_parsed") or entry.get("updated_parsed")
            if published:
                pub_dt = datetime(*published[:6], tzinfo=timezone.utc)
                if pub_dt < cutoff:
                    continue
            items.append({
                "title": entry.get("title", ""),
                "link": entry.get("link", ""),
                "source": source["name"],
                "summary": entry.get("summary", "")[:200],
            })
        return items
    except Exception as e:
        print(f"⚠️ {source['name']} 拉取失败: {e}", file=sys.stderr)
        return []


def extract_topics(items: list[dict]) -> dict[str, list[dict]]:
    """从条目中提取话题关键词，按关键词分组"""
    topic_map = defaultdict(list)
    for item in items:
        text = f"{item['title']} {item['summary']}".lower()
        for kw in KEYWORDS:
            if kw.lower() in text:
                topic_map[kw].append(item)
    return topic_map


def detect_hot(topic_map: dict, min_sources: int) -> list[dict]:
    """判断热门：同一话题出现在 N+ 个不同源"""
    hot = []
    for keyword, items in topic_map.items():
        sources = set(item["source"] for item in items)
        if len(sources) >= min_sources:
            hot.append({
                "keyword": keyword,
                "source_count": len(sources),
                "sources": list(sources),
                "articles": items[:5],
            })
    hot.sort(key=lambda x: x["source_count"], reverse=True)
    return hot


def main():
    import argparse
    parser = argparse.ArgumentParser(description="AI 热门话题检测")
    parser.add_argument("--hours", type=int, default=48, help="检测时间窗口（小时）")
    parser.add_argument("--min-sources", type=int, default=2, help="最少出现在几个源")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    args = parser.parse_args()

    print(f"🔍 检测最近 {args.hours} 小时的 AI 热门话题...\n", file=sys.stderr)

    # 拉取所有源
    all_items = []
    for source in SOURCES:
        items = fetch_feed(source, args.hours)
        print(f"  ✓ {source['name']}: {len(items)} 条", file=sys.stderr)
        all_items.extend(items)

    print(f"\n  总计: {len(all_items)} 条\n", file=sys.stderr)

    # 提取话题 + 判断热门
    topic_map = extract_topics(all_items)
    hot_topics = detect_hot(topic_map, args.min_sources)

    if args.json:
        print(json.dumps(hot_topics, ensure_ascii=False, indent=2))
        return

    # Markdown 输出
    if not hot_topics:
        print("未检测到热门话题（可能是 RSS 源暂时不可用，或最近没有跨源热点）")
        return

    print(f"# AI 热门话题（最近 {args.hours} 小时）\n")
    print(f"判断标准：同一话题出现在 {args.min_sources}+ 个不同源\n")

    for i, topic in enumerate(hot_topics, 1):
        print(f"## {i}. {topic['keyword']}")
        print(f"\n**热度：** 出现在 {topic['source_count']} 个源（{', '.join(topic['sources'])}）\n")
        print("**相关文章：**\n")
        for article in topic["articles"]:
            print(f"- [{article['title']}]({article['link']}) — {article['source']}")
        print()


if __name__ == "__main__":
    main()
