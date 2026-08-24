// Small D1 helpers shared across API routes.

export async function listIdeas(db, status) {
  const stmt =
    status && status !== "all"
      ? db
          .prepare("SELECT * FROM ideas WHERE status = ?1 ORDER BY created_at DESC")
          .bind(status)
      : db.prepare("SELECT * FROM ideas ORDER BY created_at DESC");
  const { results } = await stmt.all();
  return results || [];
}

export async function recentIdeasByStatus(db, status, limit = 12) {
  const { results } = await db
    .prepare("SELECT * FROM ideas WHERE status = ?1 ORDER BY created_at DESC LIMIT ?2")
    .bind(status, limit)
    .all();
  return results || [];
}

export async function insertIdea(db, { id, premise, thread, tension, status, created_at }) {
  await db
    .prepare(
      "INSERT INTO ideas (id, premise, thread, tension, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)"
    )
    .bind(id, premise, thread || null, tension || null, status, created_at)
    .run();
}

export async function updateIdeaStatus(db, id, status) {
  const res = await db
    .prepare("UPDATE ideas SET status = ?1 WHERE id = ?2")
    .bind(status, id)
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
