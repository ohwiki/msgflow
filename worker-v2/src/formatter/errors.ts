/**
 * GZH Formatter — Error definitions.
 * Follows the same pattern as msgflow's lib/errors.ts.
 */

import { AppError } from "../lib/errors.js";
import { HTTP_STATUS } from "../lib/constants.js";

/** Thrown when markdown input is empty or invalid */
export class ParseError extends AppError {
  constructor(message: string) {
    super(message, "PARSE_ERROR", HTTP_STATUS.BAD_REQUEST);
  }
}

/** Thrown when a requested theme does not exist */
export class ThemeNotFoundError extends AppError {
  constructor(themeId: string) {
    super(`Theme '${themeId}' not found`, "THEME_NOT_FOUND", HTTP_STATUS.BAD_REQUEST);
  }
}

/** Thrown when rendered HTML fails critical validation */
export class RenderError extends AppError {
  constructor(message: string) {
    super(message, "RENDER_ERROR", HTTP_STATUS.INTERNAL_ERROR);
  }
}
