import { getCardStatuses, upsertCardStatus } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

// Keep in sync with public/app.js's STATUS_CYCLE — separate copies since
// the Function and the static frontend are different runtimes with no
// shared module between them. "none" is the default/not-set state,
// distinct from "red" (not started) — moving off grey is deliberate.
const VALID_PILLARS = new Set(["collage", "haiku", "komorebi", "carousel"]);
const VALID_STATUSES = new Set(["none", "red", "orange", "yellow", "green"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const statuses = await getCardStatuses(env.DB, start, end);
    return jsonResponse({ statuses });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load card statuses." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { entry_date, pillar, status } = body;

    if (!entry_date || !ISO_DATE.test(entry_date)) {
      return jsonResponse({ error: "entry_date must be an ISO date (YYYY-MM-DD)" }, { status: 400 });
    }
    if (!VALID_PILLARS.has(pillar)) {
      return jsonResponse(
        { error: `pillar must be one of: ${[...VALID_PILLARS].join(", ")}` },
        { status: 400 }
      );
    }
    if (!VALID_STATUSES.has(status)) {
      return jsonResponse(
        { error: `status must be one of: ${[...VALID_STATUSES].join(", ")}` },
        { status: 400 }
      );
    }

    await upsertCardStatus(env.DB, entry_date, pillar, status, new Date().toISOString());
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to update card status." }, { status: 500 });
  }
}
