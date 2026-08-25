-- Movement Decoded — D1 schema (fresh-install baseline)
-- Apply with: wrangler d1 execute movement_decoded_db --remote --file=schema.sql
--
-- For an already-deployed database, use migrations/ instead — this file
-- reflects the current end-state schema, not the upgrade path to get there.

-- The idea bank. There is only one bank ("kept") — the archived/"Set
-- Aside" concept was removed; a kept idea that doesn't work out just gets
-- deleted rather than moved to an intermediate state.
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  premise TEXT NOT NULL,
  thread TEXT,
  tension TEXT,
  script TEXT,  -- nullable JSON blob: the five-part script once "kept"
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ideas_created
  ON ideas (created_at DESC);

CREATE TABLE IF NOT EXISTS profile (
  key TEXT PRIMARY KEY,   -- 'disciplines' | 'philosophies' | 'obsessions' | 'inspirations' | 'extra'
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS komorebi_topics (
  sunday_date TEXT PRIMARY KEY,  -- ISO date (YYYY-MM-DD)
  topic TEXT
);

-- A log of content that's actually gone out, distinct from `ideas` (which
-- is drafted/scripted but not necessarily posted). Two things get pulled
-- from this at generation time: `topic` so new ideas don't retread
-- already-published ground, and `script` as a tone reference, since it's
-- real published writing rather than an unpublished premise.
CREATE TABLE IF NOT EXISTS published_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  script TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_published_content_created
  ON published_content (created_at DESC);

-- Production status per calendar card, keyed by the specific date + pillar
-- (not just the pillar, since each week's occurrence tracks independently)
-- combined into one key: "YYYY-MM-DD:pillar_kind". Absence of a row means
-- "none" (not set, the default/grey state) — rows are only written once a
-- card's status is actually touched. "none" is a distinct state from "red"
-- (not started) — moving off grey is itself a deliberate action.
CREATE TABLE IF NOT EXISTS card_status (
  card_key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'none'
    CHECK(status IN ('none', 'red', 'orange', 'yellow', 'green')),
  updated_at TEXT NOT NULL
);
