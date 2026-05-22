---
title: "不买服务器，用 Cloudflare 免费搭一条内容流水线"
author: "AI开工局"
date: 2026-05-20
tags: ["cloudflare", "自动化", "内容系统"]
summary: "Cloudflare 的免费五件套，确实能拼出一条最小可行的 AI 内容流水线。"
cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop"
source_type: "weixin"
source_url: "https://mp.weixin.qq.com/s/V34bJOxdiVQIVkzRCYUlqQ"
---

## 先把结论摆在前面

如果你只是想搭一个"个人能跑起来"的 AI 内容工作台，不买服务器、不长期订一堆工具，Cloudflare 这套组合很值得学。

它最大的优点不是功能多。而是从抓取到发布，几乎都能放在同一个平台里完成。

## 五件套分别在干嘛

- **Workers + Cron**：负责每天定时去外面收稿
- **Workers AI**：负责先看一遍，把内容变成中文摘要
- **R2**：负责存那些大块头原始资料
- **D1**：负责把精炼过的结果存成能查询的数据
- **Pages**：负责把这些数据变成公开页面

```javascript
export default {
  async scheduled(event, env, ctx) {
    const resp = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const storyIds = await resp.json();
    await processArticles(storyIds.slice(0, 5), env);
  },
};
```

## 结尾

这套系统最值得学的，不是每个组件本身，而是它把"抓取、AI 提炼、存储、发布"连成了一条最小可行的内容流水线。
