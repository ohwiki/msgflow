/**
 * Auth Service — password login + session management.
 *
 * Phase 1: password auth (stored as SHA-256 hash in KV)
 * Phase 2: Google OAuth (future, same interface)
 */

import { ConfigRepository } from "../repositories/config-repository.js";
import { DEFAULTS, HTTP_STATUS } from "../lib/constants.js";
import { Res } from "../lib/response.js";

export class AuthService {
  private configRepo: ConfigRepository;

  constructor(private env: Env) {
    this.configRepo = new ConfigRepository(env.KV);
  }

  /** Verify password and create session. Returns session token or null. */
  async login(password: string): Promise<string | null> {
    const config = await this.configRepo.getAuthConfig();
    const storedHash = config.password_hash ?? "";
    if (!storedHash) return null;

    const valid = await this.verifyPassword(password, storedHash);
    if (!valid) return null;

    // Auto-migrate legacy SHA-256 hash to PBKDF2
    if (!storedHash.includes(":")) {
      const newHash = await this.hashPassword(password);
      await this.configRepo.setAuthConfig({ ...config, password_hash: newHash });
    }

    const token = crypto.randomUUID();
    const expires = Date.now() + DEFAULTS.SESSION_TTL_MS;
    await this.configRepo.setSession(token, { email: "admin", expires });

    return token;
  }

  /** Validate session token from cookie. */
  async validateSession(token: string): Promise<boolean> {
    const session = await this.configRepo.getSession(token);
    if (!session) return false;
    if (Date.now() > session.expires) return false;
    return true;
  }

  /** Destroy session. */
  async logout(token: string): Promise<void> {
    await this.configRepo.deleteSession(token);
  }

  /** Hash password with PBKDF2 + random salt. Format: salt:hash (hex). */
  async hashPassword(password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);
    return `${this.toHex(salt)}:${this.toHex(new Uint8Array(key))}`;
  }

  /** Verify password against stored hash. Supports legacy SHA-256 (auto-migrate). */
  async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    if (!storedHash.includes(":")) {
      const legacyHash = await this.legacySha256(password);
      return legacyHash === storedHash;
    }
    const parts = storedHash.split(":");
    const saltHex = parts[0] ?? "";
    const expectedHash = parts[1] ?? "";
    const salt = this.fromHex(saltHex);
    const key = await this.deriveKey(password, salt);
    return this.toHex(new Uint8Array(key)) === expectedHash;
  }

  private async deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  }

  private async legacySha256(password: string): Promise<string> {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
    return this.toHex(new Uint8Array(buf));
  }

  private toHex(bytes: Uint8Array): string {
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  private fromHex(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return bytes;
  }
}

/** Extract session token from cookie header. */
export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`${DEFAULTS.SESSION_COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

/** Create Set-Cookie header for session. */
export function sessionCookie(token: string): string {
  const maxAge = Math.floor(DEFAULTS.SESSION_TTL_MS / 1000);
  return `${DEFAULTS.SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

/** Create expired cookie to clear session. */
export function clearSessionCookie(): string {
  return `${DEFAULTS.SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
}

/** Auth middleware — returns redirect Response if not authenticated, or null if OK. */
export async function authMiddleware(request: Request, env: Env): Promise<Response | null> {
  const token = getSessionToken(request);
  if (!token) return Res.redirect("/login", HTTP_STATUS.MOVED);

  const auth = new AuthService(env);
  const valid = await auth.validateSession(token);
  if (!valid) return Res.redirect("/login", HTTP_STATUS.MOVED);

  return null;
}
