-- RSS 聚合阅读器数据表

CREATE TABLE IF NOT EXISTS rss_feeds (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  xml_url       TEXT NOT NULL UNIQUE,
  title         TEXT,
  site_url      TEXT,
  category      TEXT,
  intro         TEXT,
  last_fetch    INTEGER,
  last_success  INTEGER,
  error         TEXT,
  article_count INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rss_articles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id    INTEGER NOT NULL,
  guid       TEXT NOT NULL,
  title      TEXT,
  link       TEXT,
  author     TEXT,
  content    TEXT,
  snippet    TEXT,
  enclosure  TEXT,
  pub_date   INTEGER,
  is_read    INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  UNIQUE(feed_id, guid)
);

CREATE INDEX IF NOT EXISTS idx_rss_articles_feed   ON rss_articles(feed_id, pub_date DESC);
CREATE INDEX IF NOT EXISTS idx_rss_articles_unread ON rss_articles(is_read, pub_date DESC);
