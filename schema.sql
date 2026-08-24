-- Movement Decoded — D1 schema
-- Apply with: wrangler d1 execute movement_decoded_db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  premise TEXT NOT NULL,
  thread TEXT,
  tension TEXT,
  status TEXT NOT NULL CHECK(status IN ('kept','archived')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_status_created
  ON ideas (status, created_at DESC);

CREATE TABLE IF NOT EXISTS profile (
  key TEXT PRIMARY KEY,   -- 'disciplines' | 'philosophies' | 'obsessions' | 'inspirations' | 'extra'
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS komorebi_topics (
  sunday_date TEXT PRIMARY KEY,  -- ISO date (YYYY-MM-DD)
  topic TEXT
);
