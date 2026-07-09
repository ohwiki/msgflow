/**
 * Theme: Zen Whitespace (留白禅意风)
 * Maximum breathing room, muted green tones, contemplative feel.
 * Best for: meditation, minimalist living, deep essays, art reviews.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class ZenWhitespaceTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "zen-whitespace",
    name: "留白禅意风",
    description: "呼吸感最强，禅意留白，适合极简生活、深度随笔、艺术留白",
    scenes: ["禅意冥想", "极简生活", "深度随笔", "艺术留白"],
  };

  readonly colors: ThemeColors = {
    primary: "#4A5D52",
    primaryDark: "#2D3B34",
    primaryLight: "#B5C8BC",
    primaryBg: "#F5F8F6",
    title: "#1C1917",
    body: "#374151",
    muted: "#9CA3AF",
    border: "#E5E7EB",
    underline: "border-bottom:1.5px solid #B5C8BC;font-weight:500;",
  };
}
