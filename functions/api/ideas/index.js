import { listIdeas, insertIdea } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const ideas = await listIdeas(env.DB, status);
  return jsonResponse({ ideas });
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const { premise, thread, tension, status } = body;

  if (!premise || typeof premise !== "string") {
    return jsonResponse({ error: "premise is required" }, { status: 400 });
  }
  if (status !== "kept" && status !== "archived") {
    return jsonResponse({ error: "status must be 'kept' or 'archived'" }, { status: 400 });
  }

  const idea = {
    id: crypto.randomUUID(),
    premise,
    thread: thread || "",
    tension: tension || "",
    status,
    created_at: new Date().toISOString(),
  };

  await insertIdea(env.DB, idea);
  return jsonResponse({ idea }, { status: 201 });
}
