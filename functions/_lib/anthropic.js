const DEFAULT_MODEL = "claude-sonnet-5";
const ANTHROPIC_VERSION = "2023-06-01";

export function jsonResponse(data, init = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

// Calls the Anthropic Messages API and returns the parsed JSON object the
// model responded with. Throws on network/API errors or unparsable output.
export async function callAnthropicJSON(env, { system, userMessage, maxTokens = 2048 }) {
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured on this deployment.");
  }

  const model = env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const raw = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseModelJSON(raw);
}

// Defensive parsing: the prompt instructs no markdown fences, but strip
// them if the model adds them anyway, and locate the outermost JSON object
// if there's any stray preamble.
function parseModelJSON(raw) {
  let text = raw.trim();
  text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

  try {
    return JSON.parse(text);
  } catch (_) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new Error("Could not parse JSON from model response.");
  }
}
