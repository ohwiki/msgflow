/**
 * Theme: Olive Journal (橄榄手记)
 * Editorial internal-magazine feel, black + orange accent, high density.
 * Best for: internal newsletters, deep reviews, case studies, system docs.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class OliveJournalTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "olive-journal",
    name: "橄榄手记",
    description: "编辑部内刊质感，墨黑配橙，适合内刊手记、深度评测、案例复盘",
    scenes: ["内刊手记", "深度评测", "案例复盘", "系统性说明文档"],
  };

  readonly colors: ThemeColors = {
    primary: "#ed7b2f",
    primaryDark: "#c45a1a",
    primaryLight: "#fcd4b8",
    primaryBg: "#fef7f0",
    title: "#1e1f23",
    body: "#374151",
    muted: "#9CA3AF",
    border: "#E5E7EB",
    underline: "border-bottom:2px solid #ed7b2f;font-weight:600;",
  };
}
