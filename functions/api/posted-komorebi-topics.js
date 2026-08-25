import { getPostedKomorebiTopics } from "../_lib/db.js";
import { jsonResponse } from "../_lib/anthropic.js";

export async function onRequestGet({ env }) {
  try {
    const topics = await getPostedKomorebiTopics(env.DB);
    return jsonResponse({ topics });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load posted topics." }, { status: 500 });
  }
}
