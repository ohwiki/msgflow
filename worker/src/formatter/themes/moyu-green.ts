/**
 * Theme: Moyu Green (摸鱼绿)
 * Rich card-based layout with emerald accents.
 * Best for: tutorials, reviews, tool roundups, info-dense articles.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class MoyuGreenTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "moyu-green",
    name: "摸鱼绿",
    description: "卡片丰富、信息密度高，适合教程、测评、清单、工具盘点",
    scenes: ["教程", "测评", "清单", "工具盘点"],
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
