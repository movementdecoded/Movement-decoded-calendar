# Movement Decoded — Content Calendar & Idea Lab

<!-- Cloudflare Pages production branch repointed to claude/movement-decoded-webapp-3ju6xv; trivial commit to trigger the first deploy on the new setting. -->

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
    ideas/index.js          GET (list), POST (create, optionally with a
                           `script` attached) — the one idea bank; "Set
                           Aside" was removed, delete is the only way a
                           kept idea leaves the bank
    ideas/[id].js           PATCH (attach/replace `script` on an existing
                           kept idea — the "Keep this script" flow),
                           DELETE (remove)
    profile/index.js        GET, PUT (per-field upsert)
    komorebi-topics/index.js  GET, PUT (per-Sunday upsert)
    card-status/index.js    GET (by date range), PUT (upsert) — the
                           per-card production status toggle
    posted-komorebi-topics.js  GET — every Komorebi topic whose card
                           status is "green" (posted), reference-only
    generate-ideas.js       POST — 5 new premises from Anthropic
    build-script.js         POST — five-part-arc script from a topic
                           (an idea's premise); also exports the shared
                           `validateScript` shape validator used by
                           brain-dump-script.js and the ideas routes above
    brain-dump-script.js    POST — five-part-arc script found inside a raw,
                           unstructured brain dump, preserving its wording
schema.sql                D1 schema, fresh-install baseline (ideas,
                           profile, komorebi_topics, card_status)
migrations/                one-off SQL upgrades for an already-deployed
                           database — apply in order, once each
wrangler.toml              Pages project config + D1 binding
```

## Deploying

**Current setup: Cloudflare Pages is connected directly to this GitHub repo**
(Git integration, configured in the dashboard under the Pages project's
Settings → Builds & deployments). Every push to the production branch
auto-deploys — no `wrangler pages deploy` needed, no terminal required after
a change is pushed. D1 schema changes are the one thing Git integration
doesn't cover — those still need a manual one-time SQL run, see
**Migrations** below.

The steps below are for setting the project up from scratch via the
`wrangler` CLI instead, if you're not using Git integration.

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

With Git integration connected (see **Deploying** above), pushing to the
production branch is the whole redeploy step. Without it:

```
wrangler pages deploy public
```

## Migrations

Schema changes to an already-deployed database aren't picked up by a code
push — D1 has no "run migrations on deploy" wiring here. Apply each file in
`migrations/` once, in order, against the live database:

```
wrangler d1 execute movement_decoded_db --remote --file=migrations/0002_remove_archived_status.sql
wrangler d1 execute movement_decoded_db --remote --file=migrations/0003_five_part_arc_and_keep_script.sql
```

No terminal needed either: paste the file's contents into the Cloudflare
dashboard under **Workers & Pages → D1 → movement_decoded_db → Console**
and execute it there. `schema.sql` itself is safe to re-run any time (every
`CREATE TABLE`/`CREATE INDEX` uses `IF NOT EXISTS`) — it's only needed for a
brand-new database, since it reflects the current end state rather than the
upgrade path to get there.

## Data model

See `schema.sql`. Four tables: `ideas` (the kept-idea bank — there's only
one bank; a kept idea that doesn't work out is deleted rather than moved to
an intermediate "Set Aside" state; `script` is a nullable JSON blob holding
the full five-part script once one's been kept for that idea), `profile`
(the five My World fields), `komorebi_topics` (one row per Sunday,
person-chosen — the tool never auto-fills these from the topic bank), and
`card_status` (production status per calendar card, keyed by a single
`card_key` of `"YYYY-MM-DD:pillar"` — the specific date + pillar, not just
the pillar, since each week's occurrence tracks independently). Absence of
a `card_status` row means `none` (not set, the default grey state),
distinct from `red` (not started) — moving off grey is a deliberate action.

## Prompt design notes

The idea generator deliberately separates two signals:

- **Topic breadth** comes from the My World knowledge profile (primary) and
  the hardcoded 104-topic bank (secondary, for adjacent-but-distinct angles).
- **Tone** comes from the last ~12 kept ideas, explicitly instructed to be
  read for voice only, never as a subject-matter signal. (There's only one
  bank now — the original kept-vs-archived tone contrast went away when
  "Set Aside" was removed; this is a single-signal example set instead.)

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
`build-script.js`'s prompt also includes `STORYTELLING_CRAFT`;
`brain-dump-script.js`'s deliberately doesn't (it relies on the arc plus
the preserve-original-language instruction instead).

Each script also carries a short `title` (4-8 words) and an evidence-only
fact-check list: any scientific or factual claim specifically within the
**evidence** beat (not the whole script) is pulled into a separate
`confidence_flags` array, each tagged **Certain** / **Likely** / **Guessing**,
so the fact-check list renders apart from the spoken voiceover text instead
of interrupting it with inline labels.

- **Topic Builder** (`build-script.js`): triggered by "Build it out" on a
  kept idea (or a freshly-generated one, before it's kept). Sends a `topic`
  string built from the idea's premise.
- **Brain Dump to Script** (`brain-dump-script.js`): its own panel under the
  Idea Lab. Paste raw, unstructured thinking; the prompt finds the core
  reframe already hiding in it and builds the five-part arc around it
  without paraphrasing your original wording.

### Keep this script

Every generated script shows a "Keep this script" button. What it does
depends on where the script came from:

- From a **kept idea's** "Build it out" → `PATCH /api/ideas/:id` attaches
  the script to that same idea (its row already exists).
- From a **freshly-generated** idea card's "Build it out", or from **Brain
  Dump** (which has no originating idea at all) → `POST /api/ideas` creates
  a new kept idea, with the script's own `title` standing in as the
  premise for a Brain Dump script.

Once an idea has a `script` attached, its Kept ideas row shows "View
script" instead of "Build it out" — that opens the saved script straight
from local data, no request, and with no Keep button (it's already kept).
A script that's never kept is otherwise ephemeral — shown once, not written
to D1 until you keep it.

## Calendar cards: status toggle + tap to expand

Each pillar day (Collage/Haiku/Komorebi, plus Carousel on alternating bonus
Mondays) shows only its pillar title by default. Two separate interactions:

- **The small circular dot** (top-right corner) cycles a card's production
  status independently of the pillar color: none/not set (grey) → not
  started (red) → drafted/filmed (orange) → scripted/scheduled (yellow) →
  posted (green) → back to none. Persisted per exact date + pillar
  (`card_key`) in `card_status`.
- **Tapping the card body** (anywhere but the status dot) expands it to
  show that pillar's fixed description, that week's topic for Sunday
  specifically, and the same status choice again as five labeled buttons
  (rather than a color-coded dot) for accessibility. Tapping the card again
  collapses it. There's no script-building trigger on the calendar itself —
  that only happens from a kept idea or Brain Dump, see above.

Marking a Komorebi Sunday's status "posted" (green) is what makes its topic
show up in **Komorebi topics already posted** at the bottom of the page —
that section is purely derived from `card_status` + `komorebi_topics`,
nothing new to fill in.

## Testing the full loop

1. Open the deployed URL, generate a batch of ideas
2. Keep one, build a script from it, keep the script, confirm the row now
   shows "View script" and reopens the same script with no network call
3. Generate another idea, build a script from it before keeping the idea,
   keep the script, confirm it shows up in Kept ideas with that script
   attached
4. On the calendar, tap a pillar day to expand its description, cycle its
   status dot through all five colors, reload and confirm it stuck; try
   the labeled status buttons in the expanded sheet too
5. Edit a Komorebi Sunday's topic, set its status to posted (green), and
   check it shows up under Komorebi topics already posted
6. Paste something into Brain Dump to Script, generate, keep it, confirm it
   appears in Kept ideas titled with the script's own generated title
7. Fill in a My World field and wait for the autosave indicator
8. Reload the page (or open it on a different device) and confirm the
   persisted state (ideas, kept scripts, topics, card statuses, profile)
   came back — an unkept script is ephemeral by design and won't persist
