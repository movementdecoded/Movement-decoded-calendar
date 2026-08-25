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

export function validateScript(result) {
  const { disruption, recognition, reframe, evidence, invitation_or_payoff, claims } = result || {};

  if (!disruption || !recognition || !reframe || !evidence || !invitation_or_payoff) {
    throw new Error("Model response did not match the expected five-part script shape.");
  }

  // The five narrative beats are the core deliverable and must be right.
  // `claims` is a best-effort fact-check aid on top of that — the model
  // sometimes omits the key entirely instead of sending an empty array
  // when it finds nothing to flag, so treat anything other than a
  // well-formed array as "no claims flagged" rather than failing the
  // whole script over it. A malformed *entry* inside an actual array is
  // still dropped individually rather than trusted as-is.
  const safeClaims = Array.isArray(claims)
    ? claims.filter(
        (claim) => claim && typeof claim.quote === "string" && VALID_CONFIDENCE.has(claim.confidence)
      )
    : [];

  return { disruption, recognition, reframe, evidence, invitation_or_payoff, claims: safeClaims };
}
