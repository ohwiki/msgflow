import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, ValidationError, FetchError, DuplicateError } from "../src/lib/errors.js";

describe("AppError", () => {
  it("has correct properties", () => {
    const err = new AppError("test", "TEST_CODE", 418);
    expect(err.message).toBe("test");
    expect(err.code).toBe("TEST_CODE");
    expect(err.status).toBe(418);
    expect(err.name).toBe("AppError");
  });

  it("serializes to JSON", () => {
    const err = new AppError("oops", "FAIL", 500);
    expect(err.toJSON()).toEqual({ error: "oops", code: "FAIL" });
  });
});

describe("NotFoundError", () => {
  it("has 404 status", () => {
    const err = new NotFoundError("Article", "abc-123");
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.message).toContain("abc-123");
  });
});

describe("ValidationError", () => {
  it("has 400 status", () => {
    const err = new ValidationError("Invalid URL");
    expect(err.status).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
  });
});

describe("FetchError", () => {
  it("has 502 status", () => {
    const err = new FetchError("https://example.com", "timeout");
    expect(err.status).toBe(502);
    expect(err.code).toBe("FETCH_ERROR");
    expect(err.message).toContain("https://example.com");
  });
});

describe("DuplicateError", () => {
  it("has 409 status", () => {
    const err = new DuplicateError("Article", "https://example.com");
    expect(err.status).toBe(409);
    expect(err.code).toBe("DUPLICATE");
  });
});
