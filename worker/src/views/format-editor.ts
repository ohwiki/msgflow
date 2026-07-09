/**
 * GZH Formatter — Editor page view.
 *
 * Renders the format-editor.mustache template with theme list data.
 * HTML lives in the template file; this module only handles data injection.
 */

import Mustache from "mustache";
import { listThemes, getDefaultThemeId } from "../formatter/themes/registry.js";
import editorTpl from "../templates/format-editor.mustache";

export function formatEditorPage(): string {
  const defaultId = getDefaultThemeId();
  const themes = listThemes().map((t) => ({
    id: t.id,
    name: t.name,
    isDefault: t.id === defaultId,
    defaultGrid: t.defaultGrid === true,
  }));

  return Mustache.render(editorTpl, { themes });
}
