import { recentIdeas } from "../_lib/db.js";
import { buildScriptSystemPrompt } from "../_lib/prompts.js";
import { callAnthropicJSON, jsonResponse } from "../_lib/anthropic.js";

const VALID_CONFIDENCE = new Set(["Certain", "Likely", "Guessing"]);

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { topic } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return jsonResponse({ error: "topic is required" }, { status: 400 });
    }

    const kept = await recentIdeas(env.DB, 12);

    const system = buildScriptSystemPrompt(kept);
    const result = await callAnthropicJSON(env, {
      system,
      userMessage: `Build a script from this topic: "${topic}"`,
      maxTokens: 3000,
    });

    const script = validateScript(result);
    return jsonResponse(script);
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to build script." }, { status: 502 });
  }
}

// Shared by build-script.js, brain-dump-script.js, and the "Keep this
// script" persistence path (ideas/index.js POST, ideas/[id].js PATCH) —
// the latter validates a client-submitted script blob rather than a
// freshly-generated one, so this stays a plain shape validator with no
// Anthropic-specific assumptions.
export function validateScript(result) {
  const { title, disruption, recognition, reframe, evidence, invitation_payoff, confidence_flags } =
    result || {};

  if (!title || !disruption || !recognition || !reframe || !evidence || !invitation_payoff) {
    throw new Error("Script did not match the expected five-part shape.");
  }

  // The title + five narrative beats are the core deliverable and must be
  // right. `confidence_flags` is a best-effort fact-check aid on top of
  // that — the model sometimes omits the key entirely instead of sending
  // an empty array when it finds nothing to flag, so treat anything other
  // than a well-formed array as "no claims flagged" rather than failing
  // the whole script over it. A malformed *entry* inside an actual array
  // is still dropped individually rather than trusted as-is.
  const safeFlags = Array.isArray(confidence_flags)
    ? confidence_flags.filter(
        (flag) => flag && typeof flag.claim === "string" && VALID_CONFIDENCE.has(flag.level)
      )
    : [];

  return { title, disruption, recognition, reframe, evidence, invitation_payoff, confidence_flags: safeFlags };
}
