import { getPostedKomorebiTopics } from "../_lib/db.js";
import { jsonResponse } from "../_lib/anthropic.js";

export async function onRequestGet({ env }) {
  const topics = await getPostedKomorebiTopics(env.DB);
  return jsonResponse({ topics });
}
