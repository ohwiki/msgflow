/**
 * Git Service — commit Markdown files to GitHub or GitLab repositories.
 *
 * Supports two providers:
 * - GitHub: Contents API (PUT /repos/:owner/:repo/contents/:path)
 * - GitLab: Repository Files API (POST /projects/:id/repository/files/:path)
 */

import { fetchWithTimeout } from "../lib/http.js";
import { EXTERNAL_URL } from "../lib/constants.js";

export class GitService {
  private provider: "github" | "gitlab";
  private token: string;
  private repo: string;
  private branch: string;
  private basePath: string;

  constructor(env: Env) {
    this.provider = (env.GIT_PROVIDER as "github" | "gitlab") ?? "github";
    this.token = env.GIT_TOKEN ?? "";
    this.repo = env.GIT_REPO ?? ""; // "owner/repo" for GitHub, project ID for GitLab
    this.branch = env.GIT_BRANCH ?? "main";
    this.basePath = env.GIT_BASE_PATH ?? "articles";
  }

  async commitMarkdown(title: string, markdown: string, articleId: string): Promise<void> {
    if (!this.token || !this.repo) return;

    const filename = this.slugify(title) || articleId;
    const filePath = `${this.basePath}/${filename}.md`;

    if (this.provider === "github") {
      await this.commitToGitHub(filePath, markdown, title);
    } else {
      await this.commitToGitLab(filePath, markdown, title);
    }
  }

  private async commitToGitHub(path: string, content: string, title: string): Promise<void> {
    const url = `${EXTERNAL_URL.GITHUB_API}/repos/${this.repo}/contents/${path}`;

    // Check if file exists (for update vs create)
    let sha: string | undefined;
    try {
      const existing = await fetchWithTimeout(url, {
        headers: this.githubHeaders(),
        timeoutMs: 10_000,
      });
      if (existing.ok) {
        const data = await existing.json() as { sha: string };
        sha = data.sha;
      }
    } catch {
      // File doesn't exist, will create
    }

    const body: Record<string, string> = {
      message: `Add: ${title}`,
      content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
      branch: this.branch,
    };
    if (sha) body.sha = sha;

    const resp = await fetchWithTimeout(url, {
      method: "PUT",
      headers: this.githubHeaders(),
      body: JSON.stringify(body),
      timeoutMs: 10_000,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`GitHub commit failed: ${resp.status} ${err}`);
    }
  }

  private async commitToGitLab(path: string, content: string, title: string): Promise<void> {
    const encodedPath = encodeURIComponent(path);
    const url = `${EXTERNAL_URL.GITLAB_API}/projects/${encodeURIComponent(this.repo)}/repository/files/${encodedPath}`;

    // Check if file exists
    const checkResp = await fetchWithTimeout(`${url}?ref=${this.branch}`, {
      headers: this.gitlabHeaders(),
      timeoutMs: 10_000,
    });
    const method = checkResp.ok ? "PUT" : "POST";

    const body = {
      branch: this.branch,
      content,
      commit_message: `Add: ${title}`,
    };

    const resp = await fetchWithTimeout(url, {
      method,
      headers: { ...this.gitlabHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: 10_000,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`GitLab commit failed: ${resp.status} ${err}`);
    }
  }

  private githubHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "msgflow-worker",
    };
  }

  private gitlabHeaders(): Record<string, string> {
    return {
      "PRIVATE-TOKEN": this.token,
    };
  }

  private slugify(text: string): string {
    return text
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)
      .replace(/^-|-$/g, "");
  }
}
