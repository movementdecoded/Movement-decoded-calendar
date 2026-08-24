import { recentIdeasByStatus } from "../_lib/db.js";
import { buildBuildOutSystemPrompt } from "../_lib/prompts.js";
import { callAnthropicJSON, jsonResponse } from "../_lib/anthropic.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { premise } = body;

    if (!premise || typeof premise !== "string") {
      return jsonResponse({ error: "premise is required" }, { status: 400 });
    }

    const [kept, archived] = await Promise.all([
      recentIdeasByStatus(env.DB, "kept", 12),
      recentIdeasByStatus(env.DB, "archived", 12),
    ]);

    const system = buildBuildOutSystemPrompt(kept, archived);
    const result = await callAnthropicJSON(env, {
      system,
      userMessage: `Build out this premise into a 90 to 180 second narrative treatment: "${premise}"`,
      maxTokens: 3000,
    });

    const { opening, throughline, shots, closing } = result || {};
    if (!opening || !throughline || !Array.isArray(shots) || !closing) {
      throw new Error("Model response did not match the expected build-out shape.");
    }

    return jsonResponse({ opening, throughline, shots, closing });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to build out idea." }, { status: 502 });
  }
}
