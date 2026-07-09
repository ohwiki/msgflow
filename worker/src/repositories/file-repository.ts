/**
 * File Repository — R2 storage for raw HTML and Markdown files.
 */

import type { IFileRepository } from "../types/repository.js";

export class FileRepository implements IFileRepository {
  constructor(private bucket: R2Bucket) {}

  async putRaw(articleId: string, html: string): Promise<string> {
    const key = `raw/${articleId}.html`;
    await this.bucket.put(key, html, { httpMetadata: { contentType: "text/html" } });
    return key;
  }

  async putMarkdown(articleId: string, markdown: string): Promise<string> {
    const key = `md/${articleId}.md`;
    await this.bucket.put(key, markdown, { httpMetadata: { contentType: "text/markdown" } });
    return key;
  }

  async putImage(imageId: string, data: ArrayBuffer, contentType: string): Promise<string> {
    const key = `img/${imageId}`;
    await this.bucket.put(key, data, { httpMetadata: { contentType } });
    return key;
  }

  async get(key: string): Promise<string | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return await obj.text();
  }

  async getImage(key: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
    const obj = await this.bucket.get(key);
    if (!obj) return null;
    return {
      data: await obj.arrayBuffer(),
      contentType: obj.httpMetadata?.contentType ?? "image/png",
    };
  }

  async delete(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}
