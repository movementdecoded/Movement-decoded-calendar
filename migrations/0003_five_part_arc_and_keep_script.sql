-- Migration: support "Keep this script" and the reworked status vocabulary.
-- Assumes migrations/0002_remove_archived_status.sql has already been
-- applied (ideas has no status column; card_status is keyed on
-- (entry_date, pillar) with the 4-state not_started/drafted/scripted/
-- posted enum). Run this ONCE.
--
-- Run it either:
--   wrangler d1 execute movement_decoded_db --remote --file=migrations/0003_five_part_arc_and_keep_script.sql
-- or paste this file's contents into the Cloudflare dashboard's
-- Workers & Pages -> D1 -> movement_decoded_db -> Console tab and execute
-- it there (no terminal needed).

-- 1. "Keep this script" needs somewhere to store the generated script.
ALTER TABLE ideas ADD COLUMN script TEXT;

-- 2. Restructure card_status: (entry_date, pillar) composite key with a
-- 4-state enum -> a single card_key ("date:pillar") with a 5-state enum
-- that adds an explicit "none" (not set) default distinct from "red" (not
-- started). Existing statuses are carried over under the new names —
-- nothing is lost.
CREATE TABLE card_status_new (
  card_key TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'none' CHECK(status IN ('none', 'red', 'orange', 'yellow', 'green')),
  updated_at TEXT NOT NULL
);

INSERT INTO card_status_new (card_key, status, updated_at)
SELECT
  entry_date || ':' || pillar,
  CASE status
    WHEN 'not_started' THEN 'red'
    WHEN 'drafted' THEN 'orange'
    WHEN 'scripted' THEN 'yellow'
    WHEN 'posted' THEN 'green'
    ELSE 'none'
  END,
  updated_at
FROM card_status;

DROP INDEX IF EXISTS idx_card_status_pillar_status;
DROP TABLE card_status;
ALTER TABLE card_status_new RENAME TO card_status;
