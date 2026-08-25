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
    published-content/index.js  GET (list), POST (log a title + topic +
                           full script/text for something already posted)
    published-content/[id].js   DELETE
    actual-posts/index.js   GET (by date range), PUT (per-day upsert) —
                           what actually went out on a given day, when it
                           didn't match the planned pillar
    generate-ideas.js       POST — 5 new premises from Anthropic
    build-script.js         POST — five-part-arc script from a topic
                           (an idea's premise); also exports the shared
                           `validateScript` shape validator used by
                           brain-dump-script.js and the ideas routes above
    brain-dump-script.js    POST — five-part-arc script found inside a raw,
                           unstructured brain dump, preserving its wording
schema.sql                D1 schema, fresh-install baseline (ideas,
                           profile, komorebi_topics, card_status,
                           published_content, actual_posts)
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

Note the `database_id` from the output — you'll need it for step 6. (It
doesn't go in `wrangler.toml`; the binding is configured in the Cloudflare
dashboard instead, see step 6, so a build never depends on this file
carrying a real database ID.)

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

Add the D1 binding under **Pages project → Settings → Functions → D1
database bindings**: variable name `DB`, database `movement_decoded_db`.
This is the only place D1 gets bound — `wrangler.toml` intentionally
doesn't declare a `[[d1_databases]]` block (see the comment in that file
for why: a leftover placeholder `database_id` there was silently failing
every Git-integration deploy at the binding-application step).

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
npx wrangler pages dev public --d1=DB
```

There's deliberately no `package.json` in this repo — the Functions are
plain ES modules with no npm dependencies, and Cloudflare's Git-integration
build pipeline auto-detects Node projects from `package.json` and expects a
`package-lock.json` alongside it (`npm ci` fails without one). A repo with
no `package.json` skips that detection entirely and deploys as a pure
static site + Functions, no npm/build phase involved. `npx` fetches
`wrangler` on demand for this one command, no local install needed.

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
wrangler d1 execute movement_decoded_db --remote --file=migrations/0004_published_content.sql
wrangler d1 execute movement_decoded_db --remote --file=migrations/0005_actual_posts.sql
```

No terminal needed either: paste the file's contents into the Cloudflare
dashboard under **Workers & Pages → D1 → movement_decoded_db → Console**
and execute it there. `schema.sql` itself is safe to re-run any time (every
`CREATE TABLE`/`CREATE INDEX` uses `IF NOT EXISTS`) — it's only needed for a
brand-new database, since it reflects the current end state rather than the
upgrade path to get there.

## Data model

See `schema.sql`. Five tables: `ideas` (the kept-idea bank — there's only
one bank; a kept idea that doesn't work out is deleted rather than moved to
an intermediate "Set Aside" state; `script` is a nullable JSON blob holding
the full five-part script once one's been kept for that idea), `profile`
(the five My World fields), `komorebi_topics` (one row per Sunday,
person-chosen — the tool never auto-fills these from the topic bank),
`card_status` (production status per calendar card, keyed by a single
`card_key` of `"YYYY-MM-DD:pillar"` — the specific date + pillar, not just
the pillar, since each week's occurrence tracks independently), and
`published_content` (a manually-logged record of what's actually gone out
— `title`, `topic`, and the full `script`/caption text — fed into idea and
script generation as both a repeat-avoidance list and a tone reference; see
**Prompt design notes** below), and `actual_posts` (one optional row per
calendar day — any day, not just pillar days — recording what actually
went out when it didn't match the plan; keyed by plain `entry_date`, not
`card_key`, since it's about the day as a whole rather than tied to
whichever pillar was planned). Absence of a `card_status` row means `none`
(not set, the default grey state), distinct from `red` (not started) —
moving off grey is a deliberate action.

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

The **Published Content Log** (`published_content` table, filled in from
its own panel on the page) feeds two more, separate signals into all three
generation prompts (idea generation, Topic Builder, Brain Dump to Script):

- **Repeat-avoidance**: every logged `topic` is listed as already-covered
  ground, so new ideas find adjacent angles or build further on what's
  already out, instead of accidentally retreading it.
- **Tone**, from the last few logged `script` texts (capped per-entry to
  keep a handful of full examples from dominating the prompt). This is
  weighted above the kept-ideas tone example, since it's the voice as it
  actually posted, not a draft.

See `buildPublishedTopicsContext` / `buildPublishedToneContext` in
`prompts.js`.

Each logged entry in the list is clickable, opening a popup with the
title, the `topic` field doubling as a one-line brief, and the full
`script` text — a quick reference view back into a past post, reusing the
same field set as the log form rather than adding a separate brief field.

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

## Calendar cards: two-week view, status toggle, tap to expand

The calendar always shows **two weeks stacked vertically** — whichever week
`currentMonday` points at on top, the week directly after it underneath —
so the upcoming week is visible for planning (gearing up ideas/scripts/time)
without paging forward. Prev/next shift the whole pair by a week; "Today"
resets the pair so the top block is the actual current week again. Each
block's own label says "This week" / "Next week" / "Last week" / a plain
date range, computed relative to today's actual week rather than to
wherever the nav currently sits, so it never mislabels itself while
browsing other weeks.

Every day — pillar or not — shows two stacked sections: **Planned** (the
pillar tag, Friday's script/film reminder, or a plain "—") on top, and
**Actual** underneath, a small free-text field for what really went out
when it didn't match the plan (a Collage day that posted a Haiku, a
Tuesday post that actually went out Wednesday). It autosaves per exact
date (`entry_date`, independent of pillar) and sits directly on the card
rather than behind tap-to-expand, since it's meant to be glanced at
alongside the plan.

Each pillar day (Collage/Haiku/Komorebi, plus Carousel on alternating bonus
Mondays) also gets two more interactions:

- **The small circular dot** (top-right corner) cycles a card's production
  status independently of the pillar color: none/not set (grey) → not
  started (red) → drafted/filmed (orange) → scripted/scheduled (yellow) →
  posted (green) → back to none. Persisted per exact date + pillar
  (`card_key`) in `card_status`.
- **Tapping the card body** (anywhere but the status dot) expands a dropdown
  panel below it showing that pillar's fixed description, that week's topic
  for Sunday specifically, and the same status choice again as five labeled
  buttons (rather than a color-coded dot) for accessibility. Tapping the
  card again collapses it. The panel is positioned absolutely (not laid out
  inline), so opening it never changes the card's own box height — that
  matters because every card in a row otherwise stretches to match the
  tallest one (uniform sizing, so e.g. Friday's longer note doesn't leave
  the row ragged), and an inline-expanding panel would have dragged every
  other card in that row open with it. There's no script-building trigger
  on the calendar itself — that only happens from a kept idea or Brain
  Dump, see above.
- **Today's card** gets a visibly different border (gold, with a soft glow)
  from every other card, so today is identifiable at a glance.

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
8. Log an entry in the Published Content Log (title, topic, full script
   text), then generate a fresh batch of ideas or build a script and
   confirm the model avoids that logged topic and leans toward that script's
   tone; click the logged entry and confirm the popup shows its title,
   topic (as the brief), and full script
9. Confirm the calendar shows two weeks stacked (current on top, next
   underneath), that navigating with prev/next/Today relabels each block
   correctly, and that every card in a row is the same height even when one
   day (e.g. Friday) has more static content than its neighbors
10. On any day (pillar or not), type something into its Actual field,
    reload, and confirm it persisted independently of that day's planned
    pillar and status
11. Reload the page (or open it on a different device) and confirm the
    persisted state (ideas, kept scripts, topics, card statuses, actual
    posts, profile, published content log) came back — an unkept script is
    ephemeral by design and won't persist
