-- msgflow v2 schema

CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  source_type TEXT NOT NULL,
  source_name TEXT DEFAULT '',
  status TEXT DEFAULT 'raw',
  tags TEXT DEFAULT '[]',
  summary TEXT DEFAULT '',
  r2_raw_key TEXT,
  r2_md_key TEXT,
  fetched_at TEXT NOT NULL,
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source_type);
CREATE INDEX IF NOT EXISTS idx_articles_time ON articles(fetched_at DESC);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL,
  original_url TEXT,
  telegram_file_id TEXT,
  r2_key TEXT,
  last_accessed_at TEXT,
  size_bytes INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_images_article ON images(article_id);
CREATE INDEX IF NOT EXISTS idx_images_lru ON images(last_accessed_at);
