/**
 * Theme: Red-White (红白色系)
 * Classic editorial style — bold red accents on clean white.
 * Best for: opinion pieces, deep analysis, power topics.
 */

import { BaseTheme } from "./base-theme.js";
import type { ThemeColors, ThemeMeta } from "../types.js";

export class RedWhiteTheme extends BaseTheme {
  readonly meta: ThemeMeta = {
    id: "red-white",
    name: "红白色系",
    description: "经典编辑风，红色克制点睛，适合深度分析、观点、力量感话题",
    scenes: ["深度分析", "观点", "力量感话题"],
  };

  readonly colors: ThemeColors = {
    primary: "#DC2626",
    primaryDark: "#991B1B",
    primaryLight: "#FCA5A5",
    primaryBg: "#FEF2F2",
    title: "#1C1917",
    body: "#374151",
    muted: "#9CA3AF",
    border: "#E5E7EB",
    underline: "border-bottom:2px solid #FECACA;font-weight:600;",
  };
}
