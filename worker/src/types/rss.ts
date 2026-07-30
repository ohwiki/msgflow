/**
 * RSS 聚合阅读器类型定义。
 */

export interface RssFeed {
  id: number;
  xml_url: string;
  title: string | null;
  site_url: string | null;
  category: string | null;
  intro: string | null;
  last_fetch: number | null;
  last_success: number | null;
  error: string | null;
  article_count: number;
  created_at: number;
}

export interface RssArticle {
  id: number;
  feed_id: number;
  guid: string;
  title: string | null;
  link: string | null;
  author: string | null;
  content: string | null;
  snippet: string | null;
  enclosure: string | null;
  pub_date: number | null;
  is_read: number;
  created_at: number;
}

/** 归一化后的抓取条目（写入 rss_articles 前的形状）。 */
export interface NormalizedItem {
  guid: string;
  title: string;
  link: string;
  author: string;
  content: string;
  snippet: string;
  enclosure: string;
  pubDate: number | null;
}

/** 订阅源列表的一个分类分组（带未读数）。 */
export interface FeedCategoryGroup {
  category: string;
  feeds: FeedWithUnread[];
}

export interface FeedWithUnread {
  id: number;
  xmlUrl: string;
  title: string;
  category: string;
  intro: string;
  unread: number;
  articleCount: number;
  error: string | null;
}

/** OPML 导入的一条源。 */
export interface OpmlFeed {
  xmlUrl: string;
  title: string;
  category: string;
}
