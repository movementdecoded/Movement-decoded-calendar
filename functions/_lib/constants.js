// Brand-level constants for Movement Decoded's Komorebi Idea Lab.
// These are intentionally hardcoded server-side and are never exposed
// as user-editable fields in the UI — they define the brand, not a
// per-session preference.

export const MANIFESTO = `I create for curiosity, not conversion. Movement Decoded is not a method, a program, or a funnel. It's a way of paying attention to a body that is already telling you things worth hearing. I'm not here to fix you, motivate you, or sell you a system. I'm here because movement is one of the last honest languages most of us stopped reading.

Every piece starts from a real question, not a marketing angle. I'd rather leave you thinking than leave you convinced. If something lands, it's because it was true before it was useful, not the other way around.

I don't perform expertise. I don't manufacture urgency. I don't pretend one idea, one stretch, one session changes your life, because it doesn't, and treating you like it might is a kind of disrespect. What I owe you is honesty about what I actually notice, said plainly enough that you can test it against your own body and decide for yourself.

This is slow work. Komorebi Sessions exist because some ideas need light filtered through leaves before they make sense: dappled, partial, taking their time. That's the pace I trust.`;

export const FORMAT_RULES = `Komorebi Sessions format: short, sharp, a single idea stated clearly enough to land but open enough to breathe. No resolution, no prescription. Just a premise worth sitting with. Filmed sitting under trees in Lisbon, lo-fi telephone-filtered voiceover, slow contemplative visuals.`;

export const VOICE_RULES = `Write in plain, direct sentences. Vary sentence length and rhythm on purpose, don't fall into a metronome of short punchy fragments.
Never use em dashes. Use commas, periods, or separate sentences instead.
Do not build contrastive reframes ("It's not X, it's Y") as a go-to move. Use them only if the contrast is genuinely the point, and never more than once in a piece.
Avoid rule-of-three triplets ("faster, stronger, freer") unless the three items are doing real, distinct work. A lazy triplet is a tell.
No faux-intimate pivots ("Let's be honest", "Here's the truth", "Can I tell you something"). Say the honest thing without narrating that you're about to.
No physical-force emotion cliches ("hit different", "gut punch", "stopped me in my tracks"). Find a more specific way to say what actually happened.
No non-committal hedging closers ("just something to think about", "take what serves you", "only you can decide"). If the piece earns its ending, let it end. Don't soften it with a disclaimer.
Use specific, concrete analogies drawn from real physical or natural detail, not default metaphors (rivers as change, mountains as challenge, seeds as potential). If a metaphor feels like it could be pulled from any wellness caption, replace it.
No manufactured dramatic fragment reveals ("And then. Everything changed."). Let tension build through content, not typography.
No rhetorical-question pivots used as a structural crutch ("But what if it's not about strength?"). If a question is asked, it should be one worth actually sitting with, not a hinge to swing the piece around.
No explanatory triplets after a colon used to fake depth ("It comes down to three things: awareness, intention, action."). If something has three parts, prove it, don't just list it.`;

export const ANTI_PATTERNS = `Anti-patterns to actively avoid:
No fear mongering. Never frame the body as a ticking problem or a thing about to fail.
No cheap-hack framing. Nothing is "the one trick", "the secret", or "what nobody's telling you".
No conspiracy framing: "what they don't want you to know", implying hidden gatekeepers or suppressed knowledge.
No manufactured authority or fragility narratives. Don't claim special credentials that aren't true to build trust, and don't manufacture a crisis to justify offering a fix.
No unearned pseudo-scientific claims for shock value. If a claim is made, it should hold up, not just sound impressive.
No fixed hook-format labels ("POV:", "Story time:", numbered listicle openers used as a crutch).
Never make the reader feel inadequate or behind. This is not content that works by making someone feel like they're missing something everyone else already has.`;

export const STORYTELLING_CRAFT = `Storytelling craft, seven principles:
1. Start with tension. Open on the thing that doesn't resolve, not a scene-setting preamble.
2. Make it human. Even when the subject is biomechanical or abstract, ground it in something a body actually does or feels.
3. Speak in images. Prefer a precise physical image over an abstract claim. Show the shape of the thing.
4. Show the stakes. Make clear, without stating it outright, why this matters, what's actually at risk in getting it wrong or missing it.
5. Make it about them. The viewer should recognize themselves in it, not just observe a coach's private observation.
6. Close the loop. The ending should answer the tension the opening raised, even if the answer is partial.
7. Leave an opening, not a decision. Do not close the piece by handing the viewer a choice to make or an action to take. End on something that stays open enough to keep being thought about. This is a deliberate departure from frameworks that end on a call to decide. Komorebi Sessions are not meant to resolve into a directive.`;

// 104 reference topics. Existing scope and tone only — never repeated
// verbatim by the generator, always used to find adjacent, distinct angles.
export const TOPIC_BANK = [
  // Ground & gravity
  "Weight as information, not burden",
  "The honesty of the floor",
  "Falling as a skill, not an accident",
  "Gravity as a training partner",
  "Barefoot contact and lost feedback",
  "The arch of the foot as architecture",
  "Standing as an active choice",
  "Balance as constant negotiation, not stillness",
  "The stumble as data",
  "Ground reaction force in daily gesture",
  "Kneeling as forgotten competence",
  "The floor as the original gym",
  "Weight-bearing as identity, not just load",
  // Breath & nervous system
  "Exhale as the actual brake pedal",
  "Breath-holding under modern stress",
  "The sigh as involuntary regulation",
  "Nasal breathing and a forgotten default",
  "The startle reflex in modern life",
  "Vagal tone as a trainable sense",
  "Bracing versus breathing under load",
  "The freeze response in daily posture",
  "Yawning as a movement signal",
  "Breath as the only visible nervous system",
  "The pause between inhale and exhale",
  "Hyperventilation as a modern gait pattern",
  "Co-regulation through shared rhythm",
  // Animal & natural lineages
  "The cat's unhurried landing",
  "Bird flocking and human crowd movement",
  "The dog's full-body shake-off",
  "Octopus proprioception without a fixed shape",
  "Tree roots as a lesson in tension",
  "River water finding the low path",
  "The way ants carry more than themselves",
  "Migratory instinct versus planned movement",
  "Spider silk and tensile economy",
  "The heron's stillness before the strike",
  "Bees and collective decision-making through motion",
  "Coral growth as slow accumulated shape",
  "Wind moving through leaves versus branches",
  // Development & lifespan
  "The infant's uninstructed crawl",
  "Toddler balance before fear arrives",
  "The teenager's changing proprioceptive map",
  "Aging and the disappearing squat",
  "The elder's economy of motion",
  "Relearning to get up off the floor",
  "Injury as forced attention",
  "Chronic pain and movement avoidance",
  "The body's memory of old injuries",
  "Rehab as renegotiation, not repair",
  "Growth spurts and temporary clumsiness",
  "The first steps and the last steps",
  "Play as the original training method",
  // Craft, labor & tools
  "The carpenter's economy of movement",
  "Weaving and the rhythm of repetition",
  "The fisherman's practiced cast",
  "Manual labor as unintentional training",
  "The potter's wheel and centered force",
  "Tool use as extended anatomy",
  "The blacksmith's timed strike",
  "Farming rhythms and seasonal movement",
  "The mason's relationship to weight",
  "Sailing and reading invisible forces",
  "Woodcutting and full-body sequencing",
  "The tailor's stillness of the hands",
  "Craft mastery as movement literacy",
  // Perception, attention & mind
  "Peripheral vision and forgotten awareness",
  "Proprioception as a sixth sense",
  "Attention as a physical posture",
  "The eyes leading the spine",
  "Interoception and ignored internal signals",
  "Habit as movement without attention",
  "The body's map versus the mirror's image",
  "Distraction as a movement pattern",
  "Boredom as a doorway, not a problem",
  "Silence as a movement condition",
  "The difference between looking and seeing",
  "Movement under observation versus alone",
  "Muscle memory and its limits",
  // Culture, ritual & meaning
  "Dance as unspoken argument",
  "Martial arts and the ethics of restraint",
  "Prayer postures across traditions",
  "Work songs and synchronized labor",
  "Ritual repetition and altered states",
  "Competitive movement and the ego",
  "Cooperative movement and shared weight",
  "Movement as inherited gesture",
  "The handshake as encoded history",
  "Grief carried in the body",
  "Celebration and uninhibited movement",
  "Movement as protest and refusal",
  "The uniform and its imposed posture",
  // Time, effort & philosophy
  "Effortlessness as the product of buried effort",
  "The plateau as invisible progress",
  "Speed as a chosen illusion",
  "Rest as an active discipline",
  "The tyranny of the perfect rep",
  "Constraint as a creative force",
  "Mastery and the return to beginner's mind",
  "The unfinished movement as its own statement",
  "Time pressure and shortened breath",
  "Patience as a physical practice",
  "The body's honesty under fatigue",
  "Freedom found inside a fixed structure",
  "The quiet discipline of doing less",
];
