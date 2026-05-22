---
title: "用 Hermes Profile 搭建高考志愿分析团队"
author: "本来无尘"
date: 2026-05-21
tags: ["hermes", "AI", "教程"]
summary: "创建三个 Hermes Profile，让它们各司其职，协作完成高考志愿分析。"
source_type: "web"
---

## 先看完成后的样子

三个 Profile 各自的定位：

| Profile | 角色 | 干什么 |
|---------|------|--------|
| data-analyst | 数据分析师 | 搜集分数线，发现规律 |
| advisor | 择校顾问 | 综合分析，给出建议 |
| report-writer | 报告撰写员 | 把分析写成人话 |

## 第一步：创建 Profile

```bash
hermes profile create data-analyst
hermes profile create advisor
hermes profile create report-writer
```

每条命令会在 `~/.hermes/profiles/` 下生成一个目录。

## 收尾

三个 Profile 建好之后，实际使用的流程是：

1. 用 data-analyst 搜集目标院校的分数线数据
2. 把数据文件交给 advisor 做综合分析
3. 把分析结果交给 report-writer 写成家长能看懂的报告
