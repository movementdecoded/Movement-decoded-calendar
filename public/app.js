(() => {
  "use strict";

  // ---------- Date helpers ----------

  const DAY_MS = 86400000;

  function toISODate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  }

  // Parses a stored "YYYY-MM-DD" string as a local calendar date, not UTC
  // midnight — `new Date(iso)` would shift the displayed day depending on
  // the viewer's timezone offset.
  function parseISODateLocal(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function addDays(d, n) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  }

  // Monday of the week containing d.
  function mondayOf(d) {
    const day = d.getDay(); // 0 = Sun ... 6 = Sat
    const diff = day === 0 ? -6 : 1 - day;
    return addDays(startOfDay(d), diff);
  }

  // Reference Monday used to anchor the alternating Carousel-bonus-Monday
  // pattern: "the Monday after a Komorebi Sunday, alternating". Any fixed
  // Monday works as the anchor; weeks are counted from it and even-offset
  // weeks are the bonus weeks.
  const EPOCH_MONDAY = new Date(2024, 0, 1); // Jan 1 2024 is a Monday

  function isCarouselMonday(monday) {
    const weeks = Math.round((monday - EPOCH_MONDAY) / (7 * DAY_MS));
    return ((weeks % 2) + 2) % 2 === 0;
  }

  const WEEK_LABEL_FMT = { month: "short", day: "numeric" };
  const POSTED_DATE_FMT = { month: "short", day: "numeric", year: "numeric" };

  function formatWeekLabel(monday) {
    const sunday = addDays(monday, 6);
    const left = monday.toLocaleDateString(undefined, WEEK_LABEL_FMT);
    const right = sunday.toLocaleDateString(undefined, { ...WEEK_LABEL_FMT, year: "numeric" });
    return `${left} – ${right}`;
  }

  // ---------- Fixed rhythm ----------

  const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const PILLAR_INFO = {
    collage: {
      label: "Collage",
      cls: "collage",
      description:
        "Intentionally shows the full spectrum and range of training, flexibility, strength, weights, coordination, games, tricking, floorwork, softness, tension, the cross-discipline nature of the practice",
    },
    haiku: {
      label: "Haiku",
      cls: "haiku",
      description:
        "Showcases movement flows and acrobatics, clips edited into a reel of soft acrobatics and dance",
    },
    komorebi: {
      label: "Komorebi",
      cls: "komorebi",
      description:
        "Short, sharp, a single idea stated clearly enough to land but open enough to breathe, no resolution, no prescription, filmed under trees in Lisbon",
    },
    carousel: {
      label: "Carousel",
      cls: "carousel",
      description: "3 clips + the standard Lisbon workshop CTA slide, no stills needed, conversion-focused",
    },
  };

  function pillarForDay(label, carouselWeek) {
    if (label === "Tue") return "collage";
    if (label === "Thu") return "haiku";
    if (label === "Sun") return "komorebi";
    if (label === "Mon" && carouselWeek) return "carousel";
    return null;
  }

  // Production status, independent of the pillar's own color coding.
  // Cycling order: none (not set) -> red (not started) -> orange
  // (drafted/filmed) -> yellow (scripted/scheduled) -> green (posted) ->
  // back to none. "none" is a distinct default state from "red" — moving
  // off grey is itself a deliberate action.
  const STATUS_CYCLE = ["none", "red", "orange", "yellow", "green"];
  const STATUS_LABELS = {
    none: "Not set",
    red: "Not started",
    orange: "Drafted / filmed",
    yellow: "Scripted / scheduled",
    green: "Posted",
  };

  function nextStatus(current) {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[idx === -1 ? 0 : (idx + 1) % STATUS_CYCLE.length];
  }

  // ---------- Tiny API client ----------

  const api = {
    async get(path) {
      const res = await fetch(path);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `GET ${path} failed (${res.status})`);
      }
      return res.json();
    },
    async send(method, path, body) {
      const res = await fetch(path, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `${method} ${path} failed (${res.status})`);
      }
      return res.json();
    },
  };

  function renderEmpty(container, text) {
    const p = document.createElement("p");
    p.className = "empty-note";
    p.textContent = text;
    container.appendChild(p);
  }

  // ---------- Calendar ----------

  let currentMonday = mondayOf(new Date());

  const weekLabelEl = document.getElementById("week-label");
  const calendarGridEl = document.getElementById("calendar-grid");

  async function renderCalendar() {
    weekLabelEl.textContent = `Week of ${formatWeekLabel(currentMonday)}`;
    calendarGridEl.innerHTML = "";

    const mondayISO = toISODate(currentMonday);
    const sundayISO = toISODate(addDays(currentMonday, 6));

    let topics = {};
    try {
      const data = await api.get(`/api/komorebi-topics?start=${sundayISO}&end=${sundayISO}`);
      topics = data.topics || {};
    } catch (_) {
      // Non-fatal: calendar still renders without a saved topic.
    }

    let statuses = {};
    try {
      const data = await api.get(`/api/card-status?start=${mondayISO}&end=${sundayISO}`);
      statuses = data.statuses || {};
    } catch (_) {
      // Non-fatal: cards fall back to "not started".
    }

    const todayISO = toISODate(new Date());
    const carouselWeek = isCarouselMonday(currentMonday);

    WEEKDAY_LABELS.forEach((label, i) => {
      const date = addDays(currentMonday, i);
      const iso = toISODate(date);
      const pillar = pillarForDay(label, carouselWeek);
      calendarGridEl.appendChild(
        buildDayCard({ label, date, iso, pillar, isToday: iso === todayISO, statuses, topics })
      );
    });
  }

  function buildDayCard({ label, date, iso, pillar, isToday, statuses, topics }) {
    const card = document.createElement("div");
    card.className = "day-card" + (isToday ? " is-today" : "") + (pillar ? " is-expandable" : "");

    const head = document.createElement("div");
    head.className = "day-head";
    head.innerHTML = `<span>${label}</span><span class="day-date">${date.getDate()}</span>`;
    card.appendChild(head);

    if (!pillar) {
      if (label === "Fri") {
        const note = document.createElement("div");
        note.className = "day-note";
        note.textContent = "Script & film Sunday's Komorebi Session by today.";
        card.appendChild(note);
      } else {
        const tag = document.createElement("span");
        tag.className = "pillar-tag none";
        tag.textContent = "—";
        card.appendChild(tag);
      }
      return card;
    }

    const info = PILLAR_INFO[pillar];

    const tag = document.createElement("span");
    tag.className = `pillar-tag ${info.cls}`;
    tag.textContent = info.label;
    card.appendChild(tag);

    // Status toggle (a small dot) — a separate signal from the pillar
    // color above. The expanded sheet below repeats this as labeled
    // buttons for accessibility; both stay in sync via setCardStatus.
    const statusKey = `${iso}:${pillar}`;
    let currentStatus = statuses[statusKey] || "none";
    const pickerButtons = {};

    const statusBtn = document.createElement("button");
    statusBtn.type = "button";
    statusBtn.setAttribute("aria-label", "Cycle production status");
    statusBtn.textContent = "›";

    function setCardStatus(status) {
      currentStatus = status;
      statusBtn.className = `status-toggle status-${status}`;
      statusBtn.title = `${STATUS_LABELS[status]} — tap to advance`;
      for (const value of STATUS_CYCLE) {
        const btn = pickerButtons[value];
        if (!btn) continue;
        btn.classList.toggle("is-active", value === status);
        btn.setAttribute("aria-pressed", String(value === status));
      }
    }

    async function commitStatus(next) {
      const previous = currentStatus;
      setCardStatus(next);
      try {
        await api.send("PUT", "/api/card-status", { entry_date: iso, pillar, status: next });
        if (pillar === "komorebi") loadPostedTopics();
      } catch (_) {
        setCardStatus(previous);
      }
    }

    statusBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      commitStatus(nextStatus(currentStatus));
    });
    card.appendChild(statusBtn);

    // Tap-to-expand content: the pillar's description, plus (Sunday only)
    // that week's topic, plus the status picker as labeled buttons.
    const details = document.createElement("div");
    details.className = "day-details";
    details.hidden = true;
    // Interacting with anything inside the expanded panel (typing in the
    // topic box, picking a status) shouldn't also collapse the card.
    details.addEventListener("click", (e) => e.stopPropagation());

    const desc = document.createElement("p");
    desc.className = "day-desc";
    desc.textContent = info.description;
    details.appendChild(desc);

    if (pillar === "komorebi") {
      const topicArea = document.createElement("textarea");
      topicArea.className = "topic-input";
      topicArea.rows = 2;
      topicArea.placeholder = "This week's Komorebi topic…";
      topicArea.value = topics[iso] || "";

      const savedNote = document.createElement("div");
      savedNote.className = "topic-saved";

      let saveTimer = null;
      topicArea.addEventListener("input", () => {
        savedNote.textContent = "";
        clearTimeout(saveTimer);
        saveTimer = setTimeout(async () => {
          try {
            await api.send("PUT", "/api/komorebi-topics", { sunday_date: iso, topic: topicArea.value });
            savedNote.textContent = "saved";
            loadPostedTopics();
            setTimeout(() => (savedNote.textContent = ""), 1500);
          } catch (_) {
            savedNote.textContent = "save failed";
          }
        }, 600);
      });

      details.append(topicArea, savedNote);
    }

    const picker = document.createElement("div");
    picker.className = "status-picker";
    STATUS_CYCLE.forEach((value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `status-picker-btn status-${value}`;
      btn.textContent = STATUS_LABELS[value];
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (value !== currentStatus) commitStatus(value);
      });
      pickerButtons[value] = btn;
      picker.appendChild(btn);
    });
    details.appendChild(picker);

    setCardStatus(currentStatus);
    card.appendChild(details);

    card.addEventListener("click", () => {
      details.hidden = !details.hidden;
      card.classList.toggle("expanded", !details.hidden);
    });

    return card;
  }

  document.getElementById("week-prev").addEventListener("click", () => {
    currentMonday = addDays(currentMonday, -7);
    renderCalendar();
  });
  document.getElementById("week-next").addEventListener("click", () => {
    currentMonday = addDays(currentMonday, 7);
    renderCalendar();
  });
  document.getElementById("week-today").addEventListener("click", () => {
    currentMonday = mondayOf(new Date());
    renderCalendar();
  });

  // ---------- Komorebi topics already posted ----------

  const postedTopicsListEl = document.getElementById("posted-topics-list");

  async function loadPostedTopics() {
    try {
      const data = await api.get("/api/posted-komorebi-topics");
      postedTopicsListEl.innerHTML = "";
      if (!data.topics || data.topics.length === 0) {
        renderEmpty(postedTopicsListEl, "Nothing posted yet.");
        return;
      }
      data.topics.forEach((t) => {
        const row = document.createElement("div");
        row.className = "posted-topic-row";

        const dateEl = document.createElement("span");
        dateEl.className = "posted-topic-date";
        dateEl.textContent = parseISODateLocal(t.date).toLocaleDateString(undefined, POSTED_DATE_FMT);

        const topicEl = document.createElement("span");
        topicEl.className = "posted-topic-text";
        topicEl.textContent = t.topic;

        row.append(dateEl, topicEl);
        postedTopicsListEl.appendChild(row);
      });
    } catch (_) {
      postedTopicsListEl.innerHTML = "";
      renderEmpty(postedTopicsListEl, "Couldn't load posted topics.");
    }
  }

  // ---------- Idea Lab ----------

  const ideaGridEl = document.getElementById("idea-grid");
  const generateBtn = document.getElementById("generate-btn");
  const generateStatusEl = document.getElementById("generate-status");

  function setStatus(msg, isError) {
    if (!msg) {
      generateStatusEl.hidden = true;
      return;
    }
    generateStatusEl.hidden = false;
    generateStatusEl.textContent = msg;
    generateStatusEl.className = "status-line" + (isError ? " error" : "");
  }

  function ideaCard(idea) {
    const card = document.createElement("div");
    card.className = "idea-card";

    const thread = document.createElement("div");
    thread.className = "idea-thread";
    thread.textContent = idea.thread || "";

    const premise = document.createElement("div");
    premise.className = "idea-premise";
    premise.textContent = idea.premise;

    const tension = document.createElement("div");
    tension.className = "idea-tension";
    tension.textContent = idea.tension || "";

    const actions = document.createElement("div");
    actions.className = "idea-actions";

    const keepBtn = document.createElement("button");
    keepBtn.className = "btn btn-small btn-primary";
    keepBtn.textContent = "Keep";
    keepBtn.addEventListener("click", async () => {
      keepBtn.disabled = true;
      try {
        await api.send("POST", "/api/ideas", idea);
        card.remove();
        await loadIdeas();
      } catch (err) {
        setStatus(err.message, true);
        keepBtn.disabled = false;
      }
    });

    const buildBtn = document.createElement("button");
    buildBtn.className = "btn btn-small";
    buildBtn.textContent = "Build it out";
    buildBtn.addEventListener("click", () => {
      buildScript(idea.premise, async (script) => {
        await api.send("POST", "/api/ideas", {
          premise: idea.premise,
          thread: idea.thread,
          tension: idea.tension,
          script,
        });
        card.remove();
        await loadIdeas();
      });
    });

    actions.append(keepBtn, buildBtn);
    card.append(thread, premise, tension, actions);
    return card;
  }

  generateBtn.addEventListener("click", async () => {
    generateBtn.disabled = true;
    setStatus("Generating five ideas…");
    ideaGridEl.innerHTML = "";
    try {
      const data = await api.send("POST", "/api/generate-ideas", {});
      (data.ideas || []).forEach((idea) => ideaGridEl.appendChild(ideaCard(idea)));
      setStatus(`${(data.ideas || []).length} ideas generated.`);
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus(err.message, true);
    } finally {
      generateBtn.disabled = false;
    }
  });

  // ---------- Kept ideas ----------

  const keptListEl = document.getElementById("kept-list");
  const keptCountEl = document.getElementById("kept-count");

  function bankRow(idea) {
    const row = document.createElement("div");
    row.className = "idea-row";

    const main = document.createElement("div");
    main.className = "idea-row-main";
    const premise = document.createElement("div");
    premise.className = "idea-row-premise";
    premise.textContent = idea.premise;
    const thread = document.createElement("div");
    thread.className = "idea-row-thread";
    thread.textContent = idea.thread || "";
    main.append(premise, thread);

    const actions = document.createElement("div");
    actions.className = "idea-row-actions";

    const buildBtn = document.createElement("button");
    buildBtn.className = "btn btn-small";

    if (idea.script) {
      // Already has a built script attached — open it straight from local
      // data, no request, no Keep button (it's already kept).
      buildBtn.textContent = "View script";
      buildBtn.addEventListener("click", () => {
        openScriptModal(idea.script.title || idea.premise, () => Promise.resolve(idea.script));
      });
    } else {
      buildBtn.textContent = "Build it out";
      buildBtn.addEventListener("click", () => {
        buildScript(idea.premise, async (script) => {
          await api.send("PATCH", `/api/ideas/${idea.id}`, { script });
          await loadIdeas();
        });
      });
    }

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-small btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      if (!confirm("Remove this idea for good? This can't be undone.")) return;
      removeBtn.disabled = true;
      try {
        await api.send("DELETE", `/api/ideas/${idea.id}`);
        await loadIdeas();
      } catch (err) {
        setStatus(err.message, true);
        removeBtn.disabled = false;
      }
    });

    actions.append(buildBtn, removeBtn);
    row.append(main, actions);
    return row;
  }

  async function loadIdeas() {
    try {
      const kept = await api.get("/api/ideas");
      keptListEl.innerHTML = "";
      keptCountEl.textContent = kept.ideas.length;
      if (kept.ideas.length === 0) {
        renderEmpty(keptListEl, "Nothing kept yet.");
      } else {
        kept.ideas.forEach((idea) => keptListEl.appendChild(bankRow(idea)));
      }
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  // ---------- Script modal (five-part arc) ----------

  const backdrop = document.getElementById("build-modal-backdrop");
  const modalTitle = document.getElementById("build-modal-title");
  const modalLoading = document.getElementById("build-modal-loading");
  const modalContent = document.getElementById("build-modal-content");
  const modalKeepWrap = document.getElementById("build-modal-keep");
  const modalKeepBtn = document.getElementById("build-modal-keep-btn");

  const SCRIPT_BEATS = [
    ["Disruption", "disruption"],
    ["Recognition", "recognition"],
    ["Reframe", "reframe"],
    ["Evidence", "evidence"],
    ["Invitation & Payoff", "invitation_payoff"],
  ];

  function renderScript(script) {
    let html = SCRIPT_BEATS.map(
      ([label, key]) => `<h3>${label}</h3><p>${escapeHtml(script[key])}</p>`
    ).join("");

    if (script.confidence_flags && script.confidence_flags.length > 0) {
      html +=
        `<div class="claims-block"><h3>Claims to fact-check</h3>` +
        script.confidence_flags
          .map(
            (f) => `
        <div class="claim-row">
          <span class="claim-badge ${f.level.toLowerCase()}">${escapeHtml(f.level)}</span>
          <span class="claim-quote">${escapeHtml(f.claim)}</span>
        </div>`
          )
          .join("") +
        `</div>`;
    }

    return html;
  }

  // title: shown at the top of the modal while loading, replaced by the
  // script's own generated title once it resolves. request: an async
  // function resolving to the validated script, from /api/build-script,
  // /api/brain-dump-script, or (for an already-kept idea) local data with
  // no network call at all. keepHandler: optional async function(script)
  // that persists it — when given, a "Keep this script" button appears
  // after a successful generation; omit it when just viewing a script
  // that's already kept, since there's nothing new to save.
  async function openScriptModal(title, request, keepHandler) {
    backdrop.hidden = false;
    modalTitle.textContent = title;
    modalLoading.hidden = false;
    modalContent.hidden = true;
    modalContent.innerHTML = "";
    modalKeepWrap.hidden = true;
    modalKeepBtn.disabled = false;
    modalKeepBtn.textContent = "Keep this script";

    try {
      const script = await request();
      modalTitle.textContent = script.title || title;
      modalContent.innerHTML = renderScript(script);
      modalContent.hidden = false;

      if (keepHandler) {
        modalKeepWrap.hidden = false;
        modalKeepBtn.onclick = async () => {
          modalKeepBtn.disabled = true;
          modalKeepBtn.textContent = "Keeping…";
          try {
            await keepHandler(script);
            modalKeepBtn.textContent = "Kept";
          } catch (err) {
            modalKeepBtn.disabled = false;
            modalKeepBtn.textContent = "Keep this script";
            setStatus(err.message, true);
          }
        };
      }
    } catch (err) {
      modalContent.innerHTML = `<p class="empty-note">${escapeHtml(err.message)}</p>`;
      modalContent.hidden = false;
    } finally {
      modalLoading.hidden = true;
    }
  }

  // Topic Builder: an idea's premise funnels through here into the
  // five-part-arc backend. keepHandler is forwarded to openScriptModal —
  // see there for what triggers it (a kept idea's "Build it out" vs a
  // freshly-generated one).
  function buildScript(topic, keepHandler) {
    openScriptModal(topic, () => api.send("POST", "/api/build-script", { topic }), keepHandler);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  document.getElementById("build-modal-close").addEventListener("click", () => {
    backdrop.hidden = true;
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) backdrop.hidden = true;
  });

  // ---------- Brain Dump to Script ----------

  const brainDumpInput = document.getElementById("brain-dump-input");
  const brainDumpBtn = document.getElementById("brain-dump-btn");
  const brainDumpStatusEl = document.getElementById("brain-dump-status");

  function setBrainDumpStatus(msg, isError) {
    if (!msg) {
      brainDumpStatusEl.hidden = true;
      return;
    }
    brainDumpStatusEl.hidden = false;
    brainDumpStatusEl.textContent = msg;
    brainDumpStatusEl.className = "status-line" + (isError ? " error" : "");
  }

  brainDumpBtn.addEventListener("click", async () => {
    const text = brainDumpInput.value.trim();
    if (!text) {
      setBrainDumpStatus("Paste something in first.", true);
      return;
    }

    brainDumpBtn.disabled = true;
    setBrainDumpStatus("Finding the script…");

    const title = text.length > 80 ? text.slice(0, 80).trim() + "…" : text;
    await openScriptModal(
      title,
      () => api.send("POST", "/api/brain-dump-script", { text }),
      async (script) => {
        // Brain Dump has no originating idea/premise — the script's own
        // title stands in as the kept idea's headline.
        await api.send("POST", "/api/ideas", { premise: script.title, thread: "", tension: "", script });
        await loadIdeas();
      }
    );

    setBrainDumpStatus("");
    brainDumpBtn.disabled = false;
  });

  // ---------- My World (profile) ----------

  const PROFILE_KEYS = ["disciplines", "philosophies", "obsessions", "inspirations", "extra"];
  const saveIndicatorEl = document.getElementById("profile-save-indicator");
  const profileTimers = {};

  async function loadProfile() {
    try {
      const data = await api.get("/api/profile");
      PROFILE_KEYS.forEach((key) => {
        const el = document.getElementById(`profile-${key}`);
        el.value = data.profile[key] || "";
      });
    } catch (_) {
      // Non-fatal.
    }
  }

  PROFILE_KEYS.forEach((key) => {
    const el = document.getElementById(`profile-${key}`);
    el.addEventListener("input", () => {
      clearTimeout(profileTimers[key]);
      saveIndicatorEl.textContent = "";
      profileTimers[key] = setTimeout(async () => {
        try {
          await api.send("PUT", "/api/profile", { key, value: el.value });
          saveIndicatorEl.textContent = "saved";
          setTimeout(() => (saveIndicatorEl.textContent = ""), 1500);
        } catch (_) {
          saveIndicatorEl.textContent = "save failed";
        }
      }, 600);
    });
  });

  // ---------- Init ----------

  renderCalendar();
  loadIdeas();
  loadProfile();
  loadPostedTopics();
})();
