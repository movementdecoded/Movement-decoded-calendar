import { getProfile, upsertProfileField } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

const VALID_KEYS = ["disciplines", "philosophies", "obsessions", "inspirations", "extra"];

export async function onRequestGet({ env }) {
  const profile = await getProfile(env.DB);
  return jsonResponse({ profile });
}

export async function onRequestPut({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { key, value } = body;

  if (!VALID_KEYS.includes(key)) {
    return jsonResponse({ error: `key must be one of: ${VALID_KEYS.join(", ")}` }, { status: 400 });
  }

  await upsertProfileField(env.DB, key, typeof value === "string" ? value : "", new Date().toISOString());
  return jsonResponse({ ok: true });
}
