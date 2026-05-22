export const SITE_NAME = 'msgflow';
export const SITE_URL = import.meta.env.SITE || 'https://read.yourdomain.com';
export const SITE_DESCRIPTION = '内容采集 · 清洗 · 展示';
export const POSTS_PER_PAGE = 10;
export const DEFAULT_LOCALE = 'zh' as const;
export const IMAGE_CDN = import.meta.env.PUBLIC_IMAGE_CDN || 'https://r2.yourdomain.com';

export const COLLECTIONS = {
  zh: 'articles',
  en: 'articles-en',
} as const;
