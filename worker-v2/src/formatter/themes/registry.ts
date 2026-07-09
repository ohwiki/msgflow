/**
 * GZH Formatter — Theme registry.
 *
 * Single source of truth for available themes.
 * New themes: create a class extending BaseTheme, register here.
 */

import type { ITheme, ThemeMeta } from "../types.js";
import { ThemeNotFoundError } from "../errors.js";
import { RedWhiteTheme } from "./red-white.js";
import { GraphiteMinimalTheme } from "./graphite-minimal.js";
import { MoyuGreenTheme } from "./moyu-green.js";
import { ZenWhitespaceTheme } from "./zen-whitespace.js";
import { MoyuTicketTheme } from "./moyu-ticket.js";
import { OliveJournalTheme } from "./olive-journal.js";
import { MdnicePurpleTheme } from "./mdnice-purple.js";

/** All registered theme instances */
const themes: Map<string, ITheme> = new Map();

function register(theme: ITheme): void {
  themes.set(theme.meta.id, theme);
}

// ─── Register all themes (order matches theme-index.md) ──────────────────────
register(new MoyuGreenTheme());         // 默认推荐
register(new RedWhiteTheme());
register(new GraphiteMinimalTheme());
register(new ZenWhitespaceTheme());
register(new MoyuTicketTheme());
register(new OliveJournalTheme());
register(new MdnicePurpleTheme());

// ─── Public API ──────────────────────────────────────────────────────────────

export function getTheme(id: string): ITheme {
  const theme = themes.get(id);
  if (!theme) throw new ThemeNotFoundError(id);
  return theme;
}

export function listThemes(): readonly ThemeMeta[] {
  return Array.from(themes.values()).map((t) => t.meta);
}

export function getDefaultThemeId(): string {
  return "moyu-green";
}
