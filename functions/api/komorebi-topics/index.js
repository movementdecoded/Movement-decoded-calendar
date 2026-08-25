import { getKomorebiTopics, upsertKomorebiTopic } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const topics = await getKomorebiTopics(env.DB, start, end);
    return jsonResponse({ topics });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load Komorebi topics." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sunday_date, topic } = body;

    if (!sunday_date || !ISO_DATE.test(sunday_date)) {
      return jsonResponse({ error: "sunday_date must be an ISO date (YYYY-MM-DD)" }, { status: 400 });
    }

    await upsertKomorebiTopic(env.DB, sunday_date, typeof topic === "string" ? topic : "");
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to save Komorebi topic." }, { status: 500 });
  }
}
