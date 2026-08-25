import { recentIdeasByStatus } from "../_lib/db.js";
import { buildBrainDumpSystemPrompt } from "../_lib/prompts.js";
import { callAnthropicJSON, jsonResponse } from "../_lib/anthropic.js";
import { validateScript } from "./build-script.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return jsonResponse({ error: "text is required" }, { status: 400 });
    }

    const [kept, archived] = await Promise.all([
      recentIdeasByStatus(env.DB, "kept", 12),
      recentIdeasByStatus(env.DB, "archived", 12),
    ]);

    const system = buildBrainDumpSystemPrompt(kept, archived);
    const result = await callAnthropicJSON(env, {
      system,
      userMessage: `Here is the raw brain dump. Find the script hiding inside it:\n\n${text}`,
      maxTokens: 3000,
    });

    const script = validateScript(result);
    return jsonResponse(script);
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to build script from brain dump." }, { status: 502 });
  }
}
