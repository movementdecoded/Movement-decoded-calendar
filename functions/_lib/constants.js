// Brand-level constants for Movement Decoded's Komorebi Idea Lab.
// These are intentionally hardcoded server-side and are never exposed
// as user-editable fields in the UI — they define the brand, not a
// per-session preference.
//
// Exact text from the original working prototype. Do not paraphrase or
// "clean up" this copy when editing — treat it as verbatim brand source.

export const MANIFESTO = `I create for curiosity, not conversion. The goal of any piece of content is to leave someone slightly more interested in themselves and the world than they were before, not fixed, not optimised, just more awake to something.
I refuse the broken-body model. The fitness industry runs on manufacturing inadequacy. I won't participate in that.
Professional performance is not a template for human movement.
Variability is not indecision, it's intelligence. The body was built for texture and novelty.
I am not the authority, I am the fellow traveller. I never want someone to feel corrected or improved, I want them to feel like they've had a conversation that opened something.
Curiosity is the practice, not the method or the programme.
Poetry is not decoration. Precise, unexpected language makes the ordinary feel worth examining.
I play the game just enough to be heard, but I draw the line at manufacturing anxiety or copying formulas.
I make things I'd want to find. If it wouldn't stop a stranger cold and leave them with something, it's not ready.`;

export const FORMAT_RULES = `Komorebi Sessions format: short, sharp, a single idea stated clearly enough to land but open enough to breathe. No resolution, no prescription. Just a premise worth sitting with. Filmed sitting under trees in Lisbon, lo-fi telephone-filtered voiceover, slow contemplative visuals.`;

export const VOICE_RULES = `Writing rules, follow strictly: no em dashes, ever. No contrastive reframes like "it's not just X, it's Y". No rule-of-three triplets unless genuinely called for. No faux-intimate pivots like "here's the thing" or "it's worth noting". No physical-force emotion cliches like "landed like a physical blow". No non-committal hedging closers. Plain, direct sentence structure. Vary rhythm naturally, short then long. Specific analogies, not default metaphors. No dramatic short-sentence reveals where one sentence is broken into fragments for manufactured weight. No rhetorical questions used as a pivot to sneak in an assertion. No explanatory triplets after a colon for false depth.`;

export const ANTI_PATTERNS = `Hard bans, these are the opposite of what this brand does:
No fear mongering or manufactured urgency ("the real reason you're stuck", "what's silently damaging you").
No cheap-hack framing or life-hack numbered tricks.
No "what they don't want you to tell you" or "the secret experts won't reveal" conspiracy framing.
No manufactured authority or fragility narratives about other people (e.g. calling experts "neurologically fragile" to make the viewer feel superior).
No biological-sounding but unearned claims dressed as science ("neurological prison", "biological reason") used for shock value rather than genuine accuracy.
No naming a fixed content "format" or genre label, this brand does not work from a swipe file of proven hook templates. Each premise should read like a specific thought, not an instance of a repeatable formula.
The reader should never be made to feel inadequate, behind, or lied to by some vague "them." The tone is a fellow traveller thinking out loud, not a marketer exploiting a knowledge gap.`;

export const STORYTELLING_CRAFT = `Underlying narrative craft to draw on, these are real storytelling mechanics, not hook formulas, and each is adapted here to fit the no-resolution, no-prescription rule:
Start with tension: open on an actual felt gap or contradiction, inner or outer, not a fact and not manufactured emotion. This is the engine of the premise itself.
Make it human: if a first-person moment or doubt appears, it should show something unresolved or uncertain, never a polished lesson already learned.
Speak in images: prefer a concrete, visualisable moment over an abstract claim. A body doing something specific beats a general statement about bodies.
Show the stakes: let what's at risk or at play be felt, not stated as a warning. Stakes are about what's alive in the idea, not about loss aversion aimed at the viewer.
Make it about them: the premise should reflect something true about how people generally move or feel, not center the coach's own achievement or expertise.
Close the loop: if the piece has a shape, let the ending echo or turn back on the opening rather than introduce a new unrelated thought, this creates coherence without resolving the tension.
Leave an opening, not a decision: adapt this one carefully. The reference material says "end with a choice," but that's a soft form of prescription, which this brand refuses. Instead end on a live question or an unresolved frame the viewer carries with them, never a call to decide or act.`;

// Variety instruction used in the generate-ideas prompt, placed directly
// after the voice-context block ("examples above" refers to it).
export const VARIETY_RULE = `Variety is a requirement, not a suggestion. Do not let the 5 ideas in one batch cluster around a single discipline or theme, spread them across genuinely different lineages, drawing from the knowledge profile and topic bank both. Do not let tone examples above narrow the subject matter, tone and topic are separate signals, only tone should carry forward.`;

// The fixed five-part narrative arc every script (Topic Builder and Brain
// Dump to Script alike) must follow, in this order, always.
export const FIVE_PART_ARC = `When building a script from a Komorebi Sessions topic, always follow this five part narrative arc, in this order:
Disruption: open with a direct counterintuitive claim that contradicts assumption. Not a question, not a manipulative hook. Something that makes the listener tilt their head.
Recognition: bring the listener into a feeling they already know before explaining anything. Use "us" register where possible. No teaching yet. Just "you know this feeling."
Reframe: the central move. Take something they thought they understood and show them it's actually something else. This is always the strongest moment in the script.
Evidence: science, personal experience, a cultural reference, a historical fact. Something that makes the reframe feel earned. If making a scientific claim, tag confidence level as Certain, Likely, or Guessing before including it.
Invitation and/or Payoff: either open a door and leave the viewer to think, or land with a final statement that has real weight. The topic tells you which one it needs. Sometimes both. Never a diplomatic hedge.
Scripts should sit between 90 and 180 seconds spoken pace. Tight sentences. Leave room for the viewer to think.`;

// 104 reference topics. Existing scope and tone only — never repeated
// verbatim by the generator, always used to find adjacent, distinct angles.
export const TOPIC_BANK = [
  "Strength as a range not a number",
  "why one rep max tells you almost nothing",
  "lifting slowly as a skipped skill",
  "tension and relaxation",
  "grip strength",
  "isometric holds and patience",
  "eccentric loading",
  "training through unfamiliar ranges",
  "bracing vs breathing",
  "why strong people are often the least mobile",
  "flexibility without strength is instability",
  "stretching alone doesn't make you mobile",
  "passive vs active flexibility",
  "what hips are trying to tell you",
  "the spine needs to rotate not just hinge",
  "floor sitting as mobility practice",
  "anxiety and physical tension",
  "breathing into the wrong places",
  "loaded stretching",
  "feet and everything above them",
  "the body needs more than one vocabulary",
  "the case for being a permanent beginner",
  "what martial arts taught about movement gym culture never could",
  "play as a legitimate training modality",
  "practising vs performing movement",
  "copying someone else's movement is a dead end",
  "what dancing teaches about weight distribution",
  "the problem with optimisation culture",
  "discomfort and pain are not the same thing",
  "movement as a conversation with environment",
  "novelty keeps the nervous system young",
  "proprioception",
  "coordination and cognitive function",
  "learning a new skill for the brain",
  "fear and movement quality",
  "cold exposure and the nervous system",
  "fatigue as a story the brain tells",
  "sleep and physical learning",
  "mirror neurons and movement education",
  "breathing as the fastest way to change state",
  "more volume is rarely the answer",
  "before-and-after culture",
  "rest days are training days",
  "recovery beyond not training",
  "soreness vs adaptation",
  "consistency beats intensity",
  "training to look a certain way",
  "periodisation for non-athletes",
  "training too hard and moving too little",
  "exercise vs movement",
  "emotions live in the body",
  "chronic stress and posture",
  "confidence and physical presence",
  "trauma in movement patterns",
  "somatic awareness in practice",
  "creativity and physical expression",
  "boredom in training as signal",
  "feeling at home in your body",
  "rhythm and emotional regulation",
  "movement as meditative for some and not others",
  "capoeira",
  "contemporary dance and strength",
  "pole vaulting, fear and commitment",
  "tai chi",
  "Butoh and slowness",
  "gymnastics fundamentals",
  "boxing, distance and timing",
  "Brazilian jiu jitsu",
  "parkour and environmental reading",
  "swimming as a complete practice",
  "improvisation as a trainable skill",
  "a movement signature",
  "music and physical expression",
  "copying movement until it isn't fine",
  "alive vs mechanical movement",
  "imagination in physical practice",
  "why children move better and what we lost",
  "play and mastery",
  "intention vs effort",
  "constraint breeds creativity",
  "flexibility mattering more with age",
  "movement habits in your thirties",
  "balance training as longevity tool",
  "joint health beyond stretching",
  "never stopping learning new skills",
  "strength training later in life",
  "what older movers understand",
  "movement variety and healthy ageing",
  "retiring from sport not from athleticism",
  "a lifelong movement practice",
  "training outside",
  "uneven surfaces and proprioception",
  "architecture and movement",
  "training with others vs solo",
  "urban environments as playground",
  "gym vs moving through the world",
  "texture underfoot",
  "nature and movement quality",
  "place and physical memory",
  "why Lisbon moves you differently",
  "the best teachers are still students",
  "what cueing does to the nervous system",
  "demonstrating vs embodying",
  "the student who asks the most questions learns the most",
];
