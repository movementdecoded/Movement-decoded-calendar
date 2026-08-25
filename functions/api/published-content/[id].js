import { deletePublishedContent } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestDelete({ env, params }) {
  try {
    const changed = await deletePublishedContent(env.DB, params.id);
    if (!changed) return jsonResponse({ error: "entry not found" }, { status: 404 });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to delete entry." }, { status: 500 });
  }
}
