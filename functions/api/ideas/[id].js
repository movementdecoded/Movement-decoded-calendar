import { updateIdeaStatus, deleteIdea } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestPatch({ request, env, params }) {
  const body = await request.json().catch(() => ({}));
  const { status } = body;

  if (status !== "kept" && status !== "archived") {
    return jsonResponse({ error: "status must be 'kept' or 'archived'" }, { status: 400 });
  }

  const changed = await updateIdeaStatus(env.DB, params.id, status);
  if (!changed) return jsonResponse({ error: "idea not found" }, { status: 404 });
  return jsonResponse({ ok: true });
}

export async function onRequestDelete({ env, params }) {
  const changed = await deleteIdea(env.DB, params.id);
  if (!changed) return jsonResponse({ error: "idea not found" }, { status: 404 });
  return jsonResponse({ ok: true });
}
