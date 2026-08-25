-- A log of content that's actually gone out, distinct from `ideas` (which
-- is drafted/scripted but not necessarily posted). Fed into idea/script
-- generation two ways: `topic` so new ideas don't retread already-
-- published ground, and `script` as a tone reference (real published
-- writing, a stronger voice signal than an unpublished premise).
CREATE TABLE IF NOT EXISTS published_content (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  script TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_published_content_created
  ON published_content (created_at DESC);
