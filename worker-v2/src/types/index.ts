/**
 * Shared type definitions.
 */

export interface Article {
  id: string;
  url: string;
  title: string;
  author: string;
  source_type: string;
  source_name: string;
  status: string;
  tags: string;
  summary: string;
  r2_raw_key: string | null;
  r2_md_key: string | null;
  fetched_at: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  article_id: string;
  original_url: string | null;
  telegram_file_id: string | null;
  r2_key: string | null;
  last_accessed_at: string | null;
  size_bytes: number;
}

export interface AuthConfig {
  mode: "password" | "google_oauth";
  allow_register: boolean;
  allowed_emails: string[];
  password_hash?: string;
  oauth_client_id?: string;
  oauth_client_secret?: string;
}

export type RouteHandler = (request: Request, env: Env) => Promise<Response>;

export interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}
