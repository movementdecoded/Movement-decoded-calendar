// Small D1 helpers shared across API routes.

// `script` is stored as a JSON string (or NULL); parse it back out on the
// way out so callers always deal with the object form.
function parseIdeaRow(row) {
  return { ...row, script: row.script ? JSON.parse(row.script) : null };
}

// There is only one idea bank ("kept") — archived/"Set Aside" was removed.
export async function listIdeas(db) {
  const { results } = await db.prepare("SELECT * FROM ideas ORDER BY created_at DESC").all();
  return (results || []).map(parseIdeaRow);
}

export async function recentIdeas(db, limit = 12) {
  const { results } = await db
    .prepare("SELECT * FROM ideas ORDER BY created_at DESC LIMIT ?1")
    .bind(limit)
    .all();
  return (results || []).map(parseIdeaRow);
}

export async function insertIdea(db, { id, premise, thread, tension, script, created_at }) {
  await db
    .prepare(
      "INSERT INTO ideas (id, premise, thread, tension, script, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(id, premise, thread || null, tension || null, script ? JSON.stringify(script) : null, created_at)
    .run();
}

// Attaches/replaces the built script on an already-kept idea (the "Build
// it out" -> "Keep this script" flow on an existing kept row).
export async function updateIdeaScript(db, id, script) {
  const res = await db
    .prepare("UPDATE ideas SET script = ?1 WHERE id = ?2")
    .bind(JSON.stringify(script), id)
    .run();
  return res.meta && res.meta.changes > 0;
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

// Calendar card production status, keyed by a single "date:pillar" string
// (card_key) rather than a composite key — the date is always the first
// 10 characters (ISO YYYY-MM-DD), which range queries and the posted-topics
// join below rely on. Returns a flat map of card_key -> status; an absent
// key means "none" (not set, the default).
function cardKey(entry_date, pillar) {
  return `${entry_date}:${pillar}`;
}

export async function getCardStatuses(db, start, end) {
  let stmt;
  if (start && end) {
    stmt = db
      .prepare(
        "SELECT card_key, status FROM card_status WHERE substr(card_key, 1, 10) >= ?1 AND substr(card_key, 1, 10) <= ?2"
      )
      .bind(start, end);
  } else {
    stmt = db.prepare("SELECT card_key, status FROM card_status");
  }
  const { results } = await stmt.all();
  const out = {};
  for (const row of results || []) out[row.card_key] = row.status;
  return out;
}

export async function upsertCardStatus(db, entry_date, pillar, status, updated_at) {
  await db
    .prepare(
      `INSERT INTO card_status (card_key, status, updated_at) VALUES (?1, ?2, ?3)
       ON CONFLICT(card_key) DO UPDATE SET status = excluded.status, updated_at = excluded.updated_at`
    )
    .bind(cardKey(entry_date, pillar), status, updated_at)
    .run();
}

// Every Komorebi Sunday whose card status is "green" (posted), joined
// against its saved topic text. Reference list only — nothing writes to
// this, it's derived entirely from card_status + komorebi_topics.
export async function getPostedKomorebiTopics(db) {
  const { results } = await db
    .prepare(
      `SELECT substr(cs.card_key, 1, 10) AS date, kt.topic AS topic
       FROM card_status cs
       JOIN komorebi_topics kt ON kt.sunday_date = substr(cs.card_key, 1, 10)
       WHERE cs.card_key LIKE '%:komorebi' AND cs.status = 'green'
         AND kt.topic IS NOT NULL AND kt.topic != ''
       ORDER BY cs.card_key DESC`
    )
    .all();
  return results || [];
}
