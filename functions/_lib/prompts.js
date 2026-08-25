import {
  MANIFESTO,
  FORMAT_RULES,
  VOICE_RULES,
  ANTI_PATTERNS,
  STORYTELLING_CRAFT,
  VARIETY_RULE,
  FIVE_PART_ARC,
  TOPIC_BANK,
} from "./constants.js";

// Shared JSON contract for both script builders below: a short title plus
// five narrative beats as clean, speakable prose, plus any scientific or
// factual claim specifically within the evidence beat pulled out
// separately with a confidence tag, so the UI can show a distinct
// fact-check list instead of breaking up the read-aloud text with inline
// tags.
const SCRIPT_RESPONSE_FORMAT = `Respond ONLY with valid JSON, no markdown fences, and send it as exactly one single JSON object containing all seven keys together, never split across more than one code block or JSON object. Format:
{"title":"...", "disruption":"...", "recognition":"...", "reframe":"...", "evidence":"...", "invitation_payoff":"...", "confidence_flags":[{"claim":"...", "level":"Certain|Likely|Guessing"}]}
title: a short evocative title, 4 to 8 words.
disruption: a direct counterintuitive claim that contradicts assumption, not a question, not a manipulative hook, something that makes the listener tilt their head.
recognition: bring the listener into a feeling they already know before explaining anything, "us" register where possible, no teaching yet.
reframe: the central move, take something they thought they understood and show it's actually something else, this is always the strongest moment in the script.
evidence: science, personal experience, a cultural reference, or a historical fact that makes the reframe feel earned.
invitation_payoff: either open a door and leave the viewer to think, or land with a final statement that has real weight, sometimes both, never a diplomatic hedge.
confidence_flags: only populated when the evidence beat makes a scientific or factual claim, quoted exactly as it appears in the evidence text, each tagged with a confidence level: Certain if backed by hard evidence, Likely if a strong inference, Guessing if filling gaps. This key must always be present, use an empty array if evidence makes no scientific or factual claim.
Critical: disruption, recognition, reframe, evidence, and invitation_payoff are spoken voiceover, read exactly as written, out loud, over slow footage (title is a label, not spoken). Never write the words "Certain", "Likely", or "Guessing" (or any confidence label) inside evidence, and never let a confidence tag interrupt the sentence it belongs to. All confidence tagging happens only inside confidence_flags, tagging the same words as they appear in the spoken evidence text, invisibly to the viewer until the fact-check list is shown separately.`;

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

// kept: array of idea rows ({premise, ...}), most recent first. (There's
// only one bank now — archived/"Set Aside" was removed, so this is a
// single-signal example set rather than a kept-vs-archived contrast.)
export function buildVoiceContext(kept) {
  const keptList = (kept || []).slice(0, 12);

  if (keptList.length === 0) {
    return "No examples yet, use your best judgement from the manifesto and voice rules alone.";
  }

  return (
    "IMPORTANT: the examples below are for TONE AND VOICE ONLY, ignore their subject matter entirely, do not treat what they happen to be about as a signal to repeat that topic or lineage. Look only at how directly they speak, how they hold restraint, how honest and unhedged the register is, whether they avoid any trace of selling or superiority.\n\n" +
    "Voice examples that landed right:\n" +
    keptList.map((i) => `- ${i.premise}`).join("\n")
  );
}

export function buildGenerateSystemPrompt(profileRows, kept) {
  const profileContext = buildProfileContext(profileRows);
  const voiceContext = buildVoiceContext(kept);

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

// Topic Builder: turns a Komorebi Session topic (an idea's premise, or a
// calendar Sunday's topic text) into a full five-part script.
export function buildScriptSystemPrompt(kept) {
  const voiceContext = buildVoiceContext(kept);

  return `You are building a script for a single Komorebi Session for Movement Decoded, a movement coach's Instagram brand, from a topic.
Manifesto: ${MANIFESTO}
Format rules: ${FORMAT_RULES}
Voice rules, follow exactly: ${VOICE_RULES}
${ANTI_PATTERNS}
${STORYTELLING_CRAFT}
${FIVE_PART_ARC}
${voiceContext}
The piece is filmed sitting under trees in Lisbon, lo-fi telephone-filtered voiceover, slow contemplative visuals. The five part arc above, not the short-cut framing in the format rules, is the actual shape to follow here, it needs real room to develop across the full 90 to 180 seconds.
${SCRIPT_RESPONSE_FORMAT}`;
}

// Brain Dump to Script: finds the script already hiding inside a raw,
// unstructured stream-of-consciousness dump, preserving the person's own
// language rather than rewriting it.
export function buildBrainDumpSystemPrompt(kept) {
  const voiceContext = buildVoiceContext(kept);

  return `You are turning a raw, messy, stream of consciousness brain dump into a script for a Komorebi Session for Movement Decoded, a movement coach's Instagram brand.
Manifesto: ${MANIFESTO}
Format rules: ${FORMAT_RULES}
Voice rules, follow exactly: ${VOICE_RULES}
${ANTI_PATTERNS}
${FIVE_PART_ARC}
${voiceContext}
First identify the core reframe hiding in the brain dump, the central thing being seen differently, that is the spine of the script. Then build it into the five part arc above.
Preserve as much of the original language and phrasing as possible. Do not paraphrase, clean up, or improve the wording. If the person wrote something in a particular way, keep it. The goal is to find the shape already in their words, not to rewrite the content.
The piece is filmed sitting under trees in Lisbon, lo-fi telephone-filtered voiceover, slow contemplative visuals, running roughly 90 to 180 seconds.
${SCRIPT_RESPONSE_FORMAT}`;
}
