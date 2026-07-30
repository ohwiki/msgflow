/**
 * GZH Formatter — Editor page view.
 *
 * Renders the format-editor.mustache template with theme list, CDN URLs, and
 * the esbuild-compiled client script. HTML lives in the template file; the
 * client logic lives in src/client/format-editor.ts (compiled via build:client).
 */

import Mustache from "mustache";
import { listThemes, getDefaultThemeId } from "../formatter/themes/registry.js";
import { BASE_TEMPLATE_VARS } from "../lib/constants.js";
import editorTpl from "../templates/format-editor.mustache";
import clientScript from "../templates/format-editor.client.js";

export function formatEditorPage(): string {
  const defaultId = getDefaultThemeId();
  const themes = listThemes().map((t) => ({
    id: t.id,
    name: t.name,
    isDefault: t.id === defaultId,
    defaultGrid: t.defaultGrid === true,
  }));

  return Mustache.render(editorTpl, {
    themes,
    script: clientScript,
    cdnDaisyui: BASE_TEMPLATE_VARS.cdnDaisyui,
    cdnDaisyuiThemes: BASE_TEMPLATE_VARS.cdnDaisyuiThemes,
    cdnTailwind: BASE_TEMPLATE_VARS.cdnTailwind,
  });
}
