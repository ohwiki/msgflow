/**
 * RSS 阅读器页面 view —— 渲染 rss-reader.mustache + 注入编译产物客户端脚本。
 * 仿 format-editor.ts。
 */

import Mustache from "mustache";
import { BASE_TEMPLATE_VARS } from "../lib/constants.js";
import readerTpl from "../templates/rss-reader.mustache";
import clientScript from "../templates/rss-reader.client.js";

export function rssReaderPage(): string {
  return Mustache.render(readerTpl, {
    script: clientScript,
    cdnDaisyui: BASE_TEMPLATE_VARS.cdnDaisyui,
    cdnDaisyuiThemes: BASE_TEMPLATE_VARS.cdnDaisyuiThemes,
    cdnTailwind: BASE_TEMPLATE_VARS.cdnTailwind,
  });
}
