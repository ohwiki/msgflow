/**
 * GitHub Actions trigger — dispatch workflow with one-time token.
 * Actions will call /api/ci-config?token=xxx to get actual secrets.
 */

import { fetchWithTimeout } from "../lib/http.js";
import { EXTERNAL_URL, HTTP_STATUS } from "../lib/constants.js";
import { CiTokenService } from "./ci-token-service.js";
import type { Logger } from "../lib/log.js";

export async function triggerGitHubWorkflow(
  env: Env,
  articleId: string,
  r2RawKey: string,
  log: Logger,
): Promise<boolean> {
  const token = env.GITHUB_TOKEN || await env.KV.get("github_token");
  const repo = env.GITHUB_REPO || await env.KV.get("github_repo");
  if (!token || !repo) return false;

  // Generate two one-time CI tokens (config + download are separate)
  const ciTokenService = new CiTokenService(env.KV);
  const payload = { article_id: articleId, r2_raw_key: r2RawKey, created_at: new Date().toISOString() };
  const ciToken = await ciTokenService.generate(payload);
  const dlToken = await ciTokenService.generate(payload);

  const workerUrl = env.WORKER_URL ?? "";
  const configUrl = `${workerUrl}/api/ci-config?token=${ciToken}`;
  const downloadUrl = `${workerUrl}/api/ci-download?token=${dlToken}`;

  log.info("trigger_workflow", { articleId, repo });

  const url = `${EXTERNAL_URL.GITHUB_API}/repos/${repo}/actions/workflows/fetch-article.yml/dispatches`;
  const resp = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "msgflow-worker",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: {
        article_id: articleId,
        config_url: configUrl,
        download_url: downloadUrl,
      },
    }),
    timeoutMs: 10_000,
  });

  return resp.status === HTTP_STATUS.NO_CONTENT;
}
