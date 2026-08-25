import { listPublishedContent, insertPublishedContent } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

export async function onRequestGet({ env }) {
  try {
    const items = await listPublishedContent(env.DB);
    return jsonResponse({ items });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load published content." }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const script = typeof body.script === "string" ? body.script.trim() : "";

    if (!title) return jsonResponse({ error: "title is required" }, { status: 400 });
    if (!topic) return jsonResponse({ error: "topic is required" }, { status: 400 });
    if (!script) return jsonResponse({ error: "script is required" }, { status: 400 });

    const item = {
      id: crypto.randomUUID(),
      title,
      topic,
      script,
      created_at: new Date().toISOString(),
    };

    await insertPublishedContent(env.DB, item);
    return jsonResponse({ item }, { status: 201 });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to save published content." }, { status: 500 });
  }
}
