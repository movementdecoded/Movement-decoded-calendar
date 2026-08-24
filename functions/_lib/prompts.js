import {
  MANIFESTO,
  FORMAT_RULES,
  VOICE_RULES,
  ANTI_PATTERNS,
  STORYTELLING_CRAFT,
  VARIETY_RULE,
  TOPIC_BANK,
} from "./constants.js";

const PROFILE_LABELS = {
  disciplines: "Disciplines",
  philosophies: "Philosophies",
  obsessions: "Current obsessions",
  inspirations: "Inspirations",
  extra: "Extra context",
};

// profileRows: [{key, value}] from the `profile` table.
export function buildProfileContext(profileRows) {
  const byKey = Object.fromEntries((profileRows || []).map((r) => [r.key, r.value]));
  const lines = [];
  for (const key of Object.keys(PROFILE_LABELS)) {
    const value = (byKey[key] || "").trim();
    if (value) lines.push(`${PROFILE_LABELS[key]}: ${value}`);
  }

  if (lines.length === 0) {
    return "No personal knowledge profile filled in yet, draw only from the topic bank below.";
  }

  return (
    "This is the person's own knowledge, drawn directly from their disciplines, philosophy, and current thinking. " +
    "This is the PRIMARY source of topic breadth, weight it above the topic bank, and actively pull different tendrils from it " +
    "each generation rather than orbiting the same one or two threads:\n" +
    lines.join("\n")
  );
}

// kept / archived: arrays of idea rows ({premise, ...}), most recent first.
export function buildVoiceContext(kept, archived) {
  const keptList = (kept || []).slice(0, 12);
  const archivedList = (archived || []).slice(0, 12);

  if (keptList.length === 0 && archivedList.length === 0) {
    return "No examples yet, use your best judgement from the manifesto and voice rules alone.";
  }

  const parts = [
    "IMPORTANT: the examples below are for TONE AND VOICE ONLY, ignore their subject matter entirely, do not treat what they happen to be about as a signal to repeat that topic or lineage. Look only at how directly they speak, how they hold restraint, how honest and unhedged the register is, whether they avoid any trace of selling or superiority.",
  ];

  if (keptList.length > 0) {
    parts.push(
      "Voice examples that landed right:\n" + keptList.map((i) => `- ${i.premise}`).join("\n")
    );
  }

  if (archivedList.length > 0) {
    parts.push(
      "Voice examples that felt off in tone, not necessarily in subject:\n" +
        archivedList.map((i) => `- ${i.premise}`).join("\n")
    );
  }

  return parts.join("\n\n");
}

export function buildGenerateSystemPrompt(profileRows, kept, archived) {
  const profileContext = buildProfileContext(profileRows);
  const voiceContext = buildVoiceContext(kept, archived);

  return `You are helping generate Komorebi Session premises for a movement coach's Instagram brand called Movement Decoded.
Manifesto: ${MANIFESTO}
Format rules: ${FORMAT_RULES}
Voice rules, follow exactly: ${VOICE_RULES}
${ANTI_PATTERNS}
${STORYTELLING_CRAFT}
Existing topic bank for reference on tone and scope, do not repeat these verbatim, find adjacent but distinct angles: ${TOPIC_BANK.join(", ")}

${profileContext}

${voiceContext}

${VARIETY_RULE}

Respond ONLY with valid JSON, no markdown fences, no preamble. Format: {"ideas":[{"premise":"...", "thread":"...", "tension":"..."}]}
premise: a single sentence stating the idea the way it would open the piece.
thread: a 3-5 word note on what lineage or theme it draws from.
tension: one sentence naming the real paradox or unresolved question the idea sits inside, this is what makes it depth rather than a hook. It should not resolve anything.`;
}

export function buildBuildOutSystemPrompt(kept, archived) {
  const voiceContext = buildVoiceContext(kept, archived);

  return `You are helping build out a single Komorebi Session premise for Movement Decoded, a movement coach's Instagram brand, into a fuller narrative treatment the coach can riff off while filming. This is not the tight, three-beat Komorebi cut, it's the working draft behind it.
Manifesto: ${MANIFESTO}
Format rules: ${FORMAT_RULES}
Voice rules, follow exactly: ${VOICE_RULES}
${ANTI_PATTERNS}
${STORYTELLING_CRAFT}
${voiceContext}
The piece is filmed sitting under trees in Lisbon, lo-fi telephone-filtered voiceover, slow contemplative visuals. Build this out as a full narrative arc meant to run roughly 90 to 180 seconds once filmed, with real room for the idea to develop, not a handful of quick cuts.
Respond ONLY with valid JSON, no markdown fences. Format:
{"opening":"...", "throughline":"...", "shots":["...","...","..."], "closing":"..."}
opening: the first line spoken, setting the tension.
throughline: 2-4 sentences on how the idea develops and where it moves across the piece, this is the connective narrative, not just a summary.
shots: an ordered list of 6 to 10 shot descriptions, each one substantial enough to carry real screen time on its own (roughly 10-20 seconds apiece), together spanning the full 90 to 180 second runtime. Each entry should pair what's said with what's visually happening.
closing: the final line, an opening left for the viewer, not a decision handed to them.`;
}
