import { getProfileRows, recentIdeasByStatus } from "../_lib/db.js";
import { buildGenerateSystemPrompt } from "../_lib/prompts.js";
import { callAnthropicJSON, jsonResponse } from "../_lib/anthropic.js";

export async function onRequestPost({ env }) {
  try {
    const [profileRows, kept, archived] = await Promise.all([
      getProfileRows(env.DB),
      recentIdeasByStatus(env.DB, "kept", 12),
      recentIdeasByStatus(env.DB, "archived", 12),
    ]);

    const system = buildGenerateSystemPrompt(profileRows, kept, archived);
    const result = await callAnthropicJSON(env, {
      system,
      userMessage: "Generate 5 Komorebi Session ideas now.",
      maxTokens: 2048,
    });

    if (!result || !Array.isArray(result.ideas)) {
      throw new Error("Model response did not contain an 'ideas' array.");
    }

    return jsonResponse({ ideas: result.ideas });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to generate ideas." }, { status: 502 });
  }
}
