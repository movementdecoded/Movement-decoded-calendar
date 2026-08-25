import { getActualPosts, upsertActualPost } from "../../_lib/db.js";
import { jsonResponse } from "../../_lib/anthropic.js";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");
    const actuals = await getActualPosts(env.DB, start, end);
    return jsonResponse({ actuals });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to load actual posts." }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const { entry_date, actual } = body;

    if (!entry_date || !ISO_DATE.test(entry_date)) {
      return jsonResponse({ error: "entry_date must be an ISO date (YYYY-MM-DD)" }, { status: 400 });
    }

    await upsertActualPost(env.DB, entry_date, typeof actual === "string" ? actual : "");
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: err.message || "Failed to save actual post." }, { status: 500 });
  }
}
