import { deleteIdea } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestDelete({ env, params }) {
  const changed = await deleteIdea(env.DB, params.id);
  if (!changed) return jsonResponse({ error: "idea not found" }, { status: 404 });
  return jsonResponse({ ok: true });
}
