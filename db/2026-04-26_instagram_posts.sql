CREATE TABLE IF NOT EXISTS instagram_posts (
  id TEXT PRIMARY KEY,
  image_key TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
