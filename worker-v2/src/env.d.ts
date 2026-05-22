/**
 * Cloudflare Worker environment bindings.
 */

interface Env {
  DB: D1Database;
  R2: R2Bucket;
  KV: KVNamespace;
  WORKER_URL: string;
  ADMIN_HOST?: string;
  CALLBACK_SECRET?: string;
  // Cloudflare API (for R2 access from Actions)
  CF_ACCOUNT_ID?: string;
  CF_R2_API_TOKEN?: string;
  // Feishu
  FEISHU_APP_ID?: string;
  FEISHU_APP_SECRET?: string;
  // Telegram (image storage)
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHANNEL_ID?: string;
  // Git repo (markdown storage)
  GIT_REPO_ENABLED?: string;
  GIT_PROVIDER?: string;       // "github" | "gitlab"
  GIT_TOKEN?: string;
  GIT_REPO?: string;           // "owner/repo" (GitHub) or project ID (GitLab)
  GIT_BRANCH?: string;
  GIT_BASE_PATH?: string;      // default: "articles"
  // GitHub Actions trigger
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;        // "owner/repo" for triggering workflows
}

declare module "*.mustache" {
  const content: string;
  export default content;
}
