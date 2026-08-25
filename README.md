# Movement Decoded — Content Calendar & Idea Lab

A personal content-ops tool for Instagram, covering four pillars (Collage,
Physical Haikus, Komorebi Sessions, Carousels) with a fixed posting calendar
and an AI-assisted idea generator for Komorebi Sessions. Runs on Cloudflare
Pages + D1 + Pages Functions, so the API key never ships to the browser and
data persists across devices behind one shared URL.

## Stack

- **Frontend:** static HTML/CSS/vanilla JS in `public/`
- **Backend:** Cloudflare Pages Functions in `functions/` (file-based routing)
- **Database:** Cloudflare D1 (SQLite), schema in `schema.sql`
- **AI:** Anthropic Messages API, called server-side from the Pages Functions
  using a secret `ANTHROPIC_API_KEY` — never exposed to the frontend

## Project layout

```
public/                  static frontend (served as-is)
  index.html
  styles.css
  app.js
functions/
  _lib/
    constants.js          brand-level prompt constants (manifesto, voice
                           rules, anti-patterns, storytelling craft, the
                           five-part script arc, the 104-topic bank) — not
                           user-editable via the UI
    prompts.js             system-prompt assembly (profile context, voice
                           context, generate-ideas + script-builder prompts)
    db.js                  D1 query helpers
    anthropic.js            Anthropic API client + response JSON parsing
  api/
    ideas/index.js          GET (list by status), POST (create)
    ideas/[id].js           PATCH (move status), DELETE (remove)
    profile/index.js        GET, PUT (per-field upsert)
    komorebi-topics/index.js  GET, PUT (per-Sunday upsert)
    generate-ideas.js       POST — 5 new premises from Anthropic
    build-script.js         POST — five-part-arc script from a topic
                           (an idea's premise, or a calendar Sunday topic)
    brain-dump-script.js    POST — five-part-arc script found inside a raw,
                           unstructured brain dump, preserving its wording
schema.sql                D1 schema (ideas, profile, komorebi_topics)
wrangler.toml              Pages project config + D1 binding
```

## Deploy from scratch

Requires a Cloudflare account and the `wrangler` CLI (`npm install -g
wrangler`, or use `npx wrangler`). Run these from the repo root.

### 1. Log in

```
wrangler login
```

### 2. Create the D1 database

```
wrangler d1 create movement_decoded_db
```

Copy the `database_id` from the output into `wrangler.toml`, replacing
`REPLACE_WITH_D1_DATABASE_ID`.

### 3. Apply the schema

```
wrangler d1 execute movement_decoded_db --remote --file=schema.sql
```

(Drop `--remote` to also apply it to a local dev database.)

### 4. Create the Pages project

```
wrangler pages project create movement-decoded-calendar
```

### 5. Set the Anthropic API key as a secret

```
wrangler pages secret put ANTHROPIC_API_KEY
```

Paste your key when prompted. It's stored encrypted on Cloudflare's side and
is only readable inside the Pages Functions runtime — it never ships in any
JS the browser loads.

Optionally pin a specific model (defaults to `claude-sonnet-5` if unset):

```
wrangler pages secret put ANTHROPIC_MODEL
```

### 6. Bind D1 to the Pages project

If deploying via `wrangler pages deploy` with `wrangler.toml` present, the
`[[d1_databases]]` block in `wrangler.toml` is picked up automatically. If
you're using the Cloudflare dashboard's Git integration instead, add the D1
binding manually under **Pages project → Settings → Functions → D1 database
bindings**: variable name `DB`, database `movement_decoded_db`.

### 7. Deploy

```
wrangler pages deploy public
```

This prints your `*.pages.dev` URL. That URL is now the single shared
calendar for every device — no local storage, no per-device state.

### 8. (Optional) Custom domain

Add one under **Pages project → Custom domains** in the Cloudflare
dashboard once the first deploy is live.

## Local development

```
npm install
npm run dev
```

`wrangler pages dev` serves `public/` and runs the Functions locally against
a local D1 replica. Set `ANTHROPIC_API_KEY` in a `.dev.vars` file (git-ignored)
for local idea generation:

```
echo "ANTHROPIC_API_KEY=sk-ant-..." > .dev.vars
```

## Redeploying after changes

```
wrangler pages deploy public
```

Schema changes need a fresh `wrangler d1 execute ... --remote --file=schema.sql`
(the CREATE TABLE statements use `IF NOT EXISTS`, so it's safe to re-run).

## Data model

See `schema.sql`. Three tables: `ideas` (kept/archived Komorebi premises),
`profile` (the five My World fields), `komorebi_topics` (one row per Sunday,
person-chosen — the tool never auto-fills these from the topic bank).

## Prompt design notes

The idea generator deliberately separates two signals:

- **Topic breadth** comes from the My World knowledge profile (primary) and
  the hardcoded 104-topic bank (secondary, for adjacent-but-distinct angles).
- **Tone** comes from the last ~12 kept and ~12 archived ideas, explicitly
  instructed to be read for voice only, never as a subject-matter signal.

This split is what stops the generator from turning into an echo chamber
that just repeats whatever topic got kept recently — see
`functions/_lib/prompts.js` for the exact wording, and `constants.js` for the
manifesto, voice rules, anti-patterns, and storytelling-craft framework
(including the deliberate "leave an opening, not a decision" closing
principle, a departure from source frameworks that end on a call to
decide).

## Script builder: the five-part arc

Every script (`build-script.js` and `brain-dump-script.js` alike) follows a
fixed narrative shape, always in this order: **Disruption** (a direct
counterintuitive claim, not a question or a hook) → **Recognition** (bring
the listener into a feeling they already know, "us" register, no teaching
yet) → **Reframe** (the strongest move — show them the thing is actually
something else) → **Evidence** (science, personal experience, a cultural or
historical reference that earns the reframe) → **Invitation and/or Payoff**
(open a door, land a final statement with weight, or both — never a
diplomatic hedge). See `FIVE_PART_ARC` in `constants.js` for the exact
wording, and `SCRIPT_RESPONSE_FORMAT` in `prompts.js` for the JSON contract.

Any factual or empirical claim in the script (not just formal science — a
casual "this is how kids' bodies work" aside counts too) is pulled out into
a separate `claims` array, each tagged **Certain** / **Likely** / **Guessing**,
so the fact-check list renders apart from the spoken voiceover text instead
of interrupting it with inline labels. Ephemeral like everything else the AI
generates here — nothing is written to D1 unless you copy it out yourself.

- **Topic Builder** (`build-script.js`): triggered by the "Build script"
  button on an idea card (kept, archived, or freshly generated) or on a
  calendar Sunday's topic field. Both send a `topic` string to the same
  endpoint.
- **Brain Dump to Script** (`brain-dump-script.js`): its own panel under the
  Idea Lab. Paste raw, unstructured thinking; the prompt finds the core
  reframe already hiding in it and builds the five-part arc around it
  without paraphrasing your original wording.

## Testing the full loop

1. Open the deployed URL, generate a batch of ideas
2. Keep one, set another aside, build a script from a third
3. Edit a Komorebi Sunday topic on the calendar, then build a script from it
4. Paste something into Brain Dump to Script and check the result
5. Fill in a My World field and wait for the autosave indicator
6. Reload the page (or open it on a different device) and confirm the
   persisted state (ideas, topics, profile) came back — scripts are
   ephemeral by design and won't persist
