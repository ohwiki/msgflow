/**
 * Theme: Moyu Ticket (摸鱼票据风)
 * Ticket/stub visual metaphor with hard shadows, star ratings, numbering.
 * Best for: tool comparisons, creative reviews, ratings-based articles.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class MoyuTicketTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "moyu-ticket",
    name: "摸鱼票据风",
    description: "票据/门票视觉隐喻，星级评分+硬阴影卡片，适合测评、工具对比、创意评测",
    scenes: ["测评", "工具对比", "创意评测"],
  };

  readonly colors: ThemeColors = {
    primary: "#059669",
    primaryDark: "#065F46",
    primaryLight: "#A7F3D0",
    primaryBg: "#ECFDF5",
    title: "#1C1917",
    body: "#374151",
    muted: "#9CA3AF",
    border: "#D1FAE5",
    underline: "border-bottom:2px solid #A7F3D0;font-weight:600;",
  };
}
