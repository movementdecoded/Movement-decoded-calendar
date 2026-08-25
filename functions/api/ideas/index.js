import { listIdeas, insertIdea } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";
import { validateScript } from "../build-script.js";

export async function onRequestGet({ env }) {
  const ideas = await listIdeas(env.DB);
  return jsonResponse({ ideas });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { premise, thread, tension, script } = body;

  if (!premise || typeof premise !== "string") {
    return jsonResponse({ error: "premise is required" }, { status: 400 });
  }

  let validatedScript = null;
  if (script != null) {
    try {
      validatedScript = validateScript(script);
    } catch (err) {
      return jsonResponse({ error: `Invalid script: ${err.message}` }, { status: 400 });
    }
  }

  const idea = {
    id: crypto.randomUUID(),
    premise,
    thread: thread || "",
    tension: tension || "",
    script: validatedScript,
    created_at: new Date().toISOString(),
  };

  await insertIdea(env.DB, idea);
  return jsonResponse({ idea }, { status: 201 });
}
