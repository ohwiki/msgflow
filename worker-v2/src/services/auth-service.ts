/**
 * Auth Service — password login + session management.
 *
 * Phase 1: password auth (stored as SHA-256 hash in KV)
 * Phase 2: Google OAuth (future, same interface)
 */

import { ConfigRepository } from "../repositories/config-repository.js";
import { Res } from "../lib/response.js";
import { HTTP_STATUS } from "../lib/constants.js";

const SESSION_COOKIE = "msgflow_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export class AuthService {
  private configRepo: ConfigRepository;

  constructor(private env: Env) {
    this.configRepo = new ConfigRepository(env.KV);
  }

  /** Verify password and create session. Returns session token or null. */
  async login(password: string): Promise<string | null> {
    const config = await this.configRepo.getAuthConfig();
    const hash = await this.hashPassword(password);

    if (hash !== config.password_hash) return null;

    // Create session
    const token = crypto.randomUUID();
    const expires = Date.now() + SESSION_TTL_MS;
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

  /** Hash password with SHA-256. */
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

/** Extract session token from cookie header. */
export function getSessionToken(request: Request): string | null {
  const cookie = request.headers.get("Cookie") ?? "";
  const match = cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

/** Create Set-Cookie header for session. */
export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`;
}

/** Create expired cookie to clear session. */
export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`;
}

/** Auth middleware — returns redirect Response if not authenticated, or null if OK. */
export async function authMiddleware(request: Request, env: Env): Promise<Response | null> {
  const token = getSessionToken(request);
  if (!token) return Res.redirect("/login", HTTP_STATUS.MOVED);

  const auth = new AuthService(env);
  const valid = await auth.validateSession(token);
  if (!valid) return Res.redirect("/login", HTTP_STATUS.MOVED);

  return null; // Authenticated
}
