/**
 * Theme: Graphite Minimal (石墨极简风)
 * Ultra-minimal, grayscale with subtle depth.
 * Best for: design critique, tech reviews, professional opinion.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class GraphiteMinimalTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "graphite-minimal",
    name: "石墨极简风",
    description: "极简克制、留白理性、全灰阶，适合设计、科技评论、专业观点",
    scenes: ["设计", "科技评论", "专业观点", "高端品牌"],
  };

  readonly colors: ThemeColors = {
    primary: "#52525B",
    primaryDark: "#27272A",
    primaryLight: "#A1A1AA",
    primaryBg: "#F4F4F5",
    title: "#18181B",
    body: "#3F3F46",
    muted: "#A1A1AA",
    border: "#E4E4E7",
    underline: "border-bottom:2px solid #52525B;font-weight:600;",
  };
}
