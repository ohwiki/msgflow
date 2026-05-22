/**
 * Application errors — typed, structured, with HTTP status codes.
 */

import { HTTP_STATUS } from "./constants.js";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = HTTP_STATUS.INTERNAL_ERROR,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return { error: this.message, code: this.code };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} '${id}' not found`, "NOT_FOUND", HTTP_STATUS.NOT_FOUND);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", HTTP_STATUS.BAD_REQUEST);
  }
}

export class DuplicateError extends AppError {
  constructor(resource: string, key: string) {
    super(`${resource} '${key}' already exists`, "DUPLICATE", HTTP_STATUS.CONFLICT);
  }
}

export class FetchError extends AppError {
  constructor(url: string, reason: string) {
    super(`Failed to fetch '${url}': ${reason}`, "FETCH_ERROR", HTTP_STATUS.BAD_GATEWAY);
  }
}
