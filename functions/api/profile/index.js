import { getProfile, upsertProfileField } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

const VALID_KEYS = ["disciplines", "philosophies", "obsessions", "inspirations", "extra"];

export async function onRequestGet({ env }) {
  try {
    const profile = await getProfile(env.DB);
    return jsonResponse({ profile });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load profile." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { key, value } = body;

    if (!VALID_KEYS.includes(key)) {
      return jsonResponse({ error: `key must be one of: ${VALID_KEYS.join(", ")}` }, { status: 400 });
    }

    await upsertProfileField(env.DB, key, typeof value === "string" ? value : "", new Date().toISOString());
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to save profile field." }, { status: 500 });
  }
}
