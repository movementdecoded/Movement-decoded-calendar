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
      // Sonnet 5 runs adaptive extended thinking by default, even with no
      // `thinking` param sent at all. Left on, thinking silently ate the
      // entire max_tokens budget (stop_reason "max_tokens", zero text
      // returned) for this plain structured-JSON use case. We don't need
      // reasoning depth here, so disable it explicitly.
      thinking: { type: "disabled" },
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  // Read as text first rather than calling res.json() directly, so a
  // malformed or non-JSON response (a gateway error page, a truncated
  // body) surfaces a snippet of what actually came back instead of a
  // generic "Unexpected token" error with no context to debug from.
  const rawBody = await res.text();

  if (!res.ok) {
    throw new Error(`Anthropic API error ${res.status}: ${rawBody.slice(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(rawBody);
  } catch (_) {
    throw new Error(`Anthropic API returned non-JSON response: ${rawBody.slice(0, 500)}`);
  }

  // A response cut off mid-generation is a common, previously confusing
  // failure mode (it looks like an empty or malformed result downstream)
  // — call it out explicitly rather than letting it fail opaquely later.
  if (data.stop_reason === "max_tokens") {
    throw new Error(
      `Response got cut off (stop_reason: max_tokens, max_tokens was ${maxTokens}). Try again or raise max_tokens.`
    );
  }

  const raw = (data.content || [])
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  if (!raw.trim()) {
    throw new Error(
      `Anthropic response had no text content (stop_reason: ${data.stop_reason || "unknown"}).`
    );
  }

  return parseModelJSON(raw);
}

// Defensive parsing: the prompt instructs a single JSON object with no
// markdown fences, but the model doesn't always comply exactly (a wrapping
// fence, stray preamble, or occasionally splitting the answer into more
// than one JSON object). Scan the raw text for every balanced top-level
// {...} object, parse each independently, and merge them. Fence markers
// and any prose fall outside all brace regions and are simply skipped, so
// this handles clean JSON, fenced JSON, and multiple fenced or unfenced
// objects with the same logic, rather than special-casing each shape.
function parseModelJSON(raw) {
  const objects = extractTopLevelJSONObjects(raw);

  const parsed = [];
  for (const candidate of objects) {
    try {
      parsed.push(JSON.parse(candidate));
    } catch (_) {
      // Not actually valid JSON (e.g. a stray "{" in prose) — skip it.
    }
  }

  if (parsed.length === 0) {
    throw new Error("Could not parse JSON from model response.");
  }

  return Object.assign({}, ...parsed);
}

// Depth-counts braces while tracking string state (so a brace character
// inside a quoted string doesn't affect nesting) to find every complete,
// balanced {...} substring at depth 0.
function extractTopLevelJSONObjects(text) {
  const objects = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escapeNext = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      if (depth > 0) {
        depth--;
        if (depth === 0 && start !== -1) {
          objects.push(text.slice(start, i + 1));
          start = -1;
        }
      }
    }
  }

  return objects;
}
