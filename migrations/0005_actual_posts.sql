-- What actually went out for a given day, independent of the fixed pillar
-- rhythm's plan for that day — a plan can be missed or swapped. One row
-- per calendar day, any day of the week, not just the fixed pillar days.
CREATE TABLE IF NOT EXISTS actual_posts (
  entry_date TEXT PRIMARY KEY,  -- ISO date (YYYY-MM-DD)
  actual TEXT
);
