import { deleteIdea, updateIdeaScript } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";
import { validateScript } from "../build-script.js";

// Attaches/replaces the built script on an already-kept idea — the
// "Build it out" -> "Keep this script" flow when triggered from a kept
// idea's row, as opposed to a freshly-generated or Brain Dump script,
// which creates a new idea via POST /api/ideas instead.
export async function onRequestPatch({ request, env, params }) {
  try {
    const body = await request.json().catch(() => ({}));

    let script;
    try {
      script = validateScript(body.script);
    } catch (err) {
      return jsonResponse({ error: `Invalid script: ${err.message}` }, { status: 400 });
    }

    const changed = await updateIdeaScript(env.DB, params.id, script);
    if (!changed) return jsonResponse({ error: "idea not found" }, { status: 404 });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to update idea." }, { status: 500 });
  }
}

export async function onRequestDelete({ env, params }) {
  try {
    const changed = await deleteIdea(env.DB, params.id);
    if (!changed) return jsonResponse({ error: "idea not found" }, { status: 404 });
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to delete idea." }, { status: 500 });
  }
}
