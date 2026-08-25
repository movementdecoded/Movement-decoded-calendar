import { listIdeas, insertIdea } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestGet({ env }) {
  const ideas = await listIdeas(env.DB);
  return jsonResponse({ ideas });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { premise, thread, tension } = body;

  if (!premise || typeof premise !== "string") {
    return jsonResponse({ error: "premise is required" }, { status: 400 });
  }

  const idea = {
    id: crypto.randomUUID(),
    premise,
    thread: thread || "",
    tension: tension || "",
    created_at: new Date().toISOString(),
  };

  await insertIdea(env.DB, idea);
  return jsonResponse({ idea }, { status: 201 });
}
