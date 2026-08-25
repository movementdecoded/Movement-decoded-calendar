-- Migration: remove the archived/"Set Aside" concept, add card_status.
-- Run this ONCE against the existing live database. It is not safe to
-- re-run (the first DELETE/rebuild step will error on a second pass,
-- since `ideas.status` will already be gone).
--
-- Run it either:
--   wrangler d1 execute movement_decoded_db --remote --file=migrations/0002_remove_archived_status.sql
-- or paste this file's contents into the Cloudflare dashboard's
-- Workers & Pages -> D1 -> movement_decoded_db -> Console tab and execute
-- it there (no terminal needed).

-- Set Aside is being removed entirely — a kept idea that doesn't work out
-- just gets deleted going forward, no intermediate "maybe" state. Drop
-- whatever's currently archived along with the concept itself.
DELETE FROM ideas WHERE status = 'archived';

-- SQLite can't drop/alter a column with a CHECK constraint in place, so
-- rebuild the table without `status`.
CREATE TABLE ideas_new (
  id TEXT PRIMARY KEY,
  premise TEXT NOT NULL,
  thread TEXT,
  tension TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO ideas_new (id, premise, thread, tension, created_at)
SELECT id, premise, thread, tension, created_at FROM ideas;

DROP TABLE ideas;
ALTER TABLE ideas_new RENAME TO ideas;

DROP INDEX IF EXISTS idx_ideas_status_created;
CREATE INDEX IF NOT EXISTS idx_ideas_created ON ideas (created_at DESC);

-- New: per-card production status for the calendar.
CREATE TABLE IF NOT EXISTS card_status (
  entry_date TEXT NOT NULL,
  pillar TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started'
    CHECK(status IN ('not_started', 'drafted', 'scripted', 'posted')),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entry_date, pillar)
);

CREATE INDEX IF NOT EXISTS idx_card_status_pillar_status
  ON card_status (pillar, status);
