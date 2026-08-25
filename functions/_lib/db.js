// Small D1 helpers shared across API routes.

// There is only one idea bank ("kept") — archived/"Set Aside" was removed.
export async function listIdeas(db) {
  const { results } = await db.prepare("SELECT * FROM ideas ORDER BY created_at DESC").all();
  return results || [];
}

export async function recentIdeas(db, limit = 12) {
  const { results } = await db
    .prepare("SELECT * FROM ideas ORDER BY created_at DESC LIMIT ?1")
    .bind(limit)
    .all();
  return results || [];
}

export async function insertIdea(db, { id, premise, thread, tension, created_at }) {
  await db
    .prepare(
      "INSERT INTO ideas (id, premise, thread, tension, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
    )
    .bind(id, premise, thread || null, tension || null, created_at)
    .run();
}

export async function deleteIdea(db, id) {
  const res = await db.prepare("DELETE FROM ideas WHERE id = ?1").bind(id).run();
  return res.meta && res.meta.changes > 0;
}

const PROFILE_KEYS = ["disciplines", "philosophies", "obsessions", "inspirations", "extra"];

export async function getProfile(db) {
  const { results } = await db.prepare("SELECT key, value FROM profile").all();
  const byKey = Object.fromEntries((results || []).map((r) => [r.key, r.value]));
  const out = {};
  for (const key of PROFILE_KEYS) out[key] = byKey[key] || "";
  return out;
}

export async function getProfileRows(db) {
  const { results } = await db.prepare("SELECT key, value FROM profile").all();
  return results || [];
}

export async function upsertProfileField(db, key, value, updated_at) {
  if (!PROFILE_KEYS.includes(key)) {
    throw new Error(`Unknown profile key: ${key}`);
  }
  await db
    .prepare(
      `INSERT INTO profile (key, value, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(key, value, updated_at)
    .run();
}

export async function getKomorebiTopics(db, start, end) {
  let stmt;
  if (start && end) {
    stmt = db
      .prepare(
        "SELECT sunday_date, topic FROM komorebi_topics WHERE sunday_date >= ?1 AND sunday_date <= ?2"
      )
      .bind(start, end);
  } else {
    stmt = db.prepare("SELECT sunday_date, topic FROM komorebi_topics");
  }
  const { results } = await stmt.all();
  const out = {};
  for (const row of results || []) out[row.sunday_date] = row.topic;
  return out;
}

export async function upsertKomorebiTopic(db, sunday_date, topic) {
  await db
    .prepare(
      `INSERT INTO komorebi_topics (sunday_date, topic) VALUES (?1, ?2)
       ON CONFLICT(sunday_date) DO UPDATE SET topic = excluded.topic`
    )
    .bind(sunday_date, topic)
    .run();
}

// Calendar card production status, keyed by (entry_date, pillar). Returns
// a flat map of "date|pillar" -> status; an absent key means not_started.
export async function getCardStatuses(db, start, end) {
  let stmt;
  if (start && end) {
    stmt = db
      .prepare(
        "SELECT entry_date, pillar, status FROM card_status WHERE entry_date >= ?1 AND entry_date <= ?2"
      )
      .bind(start, end);
  } else {
    stmt = db.prepare("SELECT entry_date, pillar, status FROM card_status");
  }
  const { results } = await stmt.all();
  const out = {};
  for (const row of results || []) out[`${row.entry_date}|${row.pillar}`] = row.status;
  return out;
}

export async function upsertCardStatus(db, entry_date, pillar, status, updated_at) {
  await db
    .prepare(
      `INSERT INTO card_status (entry_date, pillar, status, updated_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(entry_date, pillar) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`
    )
    .bind(entry_date, pillar, status, updated_at)
    .run();
}

// Every Komorebi Sunday whose card status is "posted", joined against its
// saved topic text. Reference list only — nothing writes to this, it's
// derived entirely from card_status + komorebi_topics.
export async function getPostedKomorebiTopics(db) {
  const { results } = await db
    .prepare(
      `SELECT cs.entry_date AS date, kt.topic AS topic
       FROM card_status cs
       JOIN komorebi_topics kt ON kt.sunday_date = cs.entry_date
       WHERE cs.pillar = 'komorebi' AND cs.status = 'posted'
         AND kt.topic IS NOT NULL AND kt.topic != ''
       ORDER BY cs.entry_date DESC`
    )
    .all();
  return results || [];
}
