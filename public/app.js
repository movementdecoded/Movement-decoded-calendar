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
  // Cycling order: not started -> drafted/filmed -> scripted/scheduled ->
  // posted -> back to not started.
  const STATUS_CYCLE = ["not_started", "drafted", "scripted", "posted"];
  const STATUS_LABELS = {
    not_started: "Hasn't started",
    drafted: "Drafted / filmed",
    scripted: "Scripted / scheduled",
    posted: "Posted",
  };

  function nextStatus(current) {
    const idx = STATUS_CYCLE.indexOf(current);
    return STATUS_CYCLE[idx === -1 ? 0 : (idx + 1) % STATUS_CYCLE.length];
  }

  // ---------- Tiny API client ----------

  const api = {
    async get(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
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

    // Status toggle — a separate signal from the pillar color above.
    const statusKey = `${iso}|${pillar}`;
    let currentStatus = statuses[statusKey] || "not_started";

    const statusBtn = document.createElement("button");
    statusBtn.type = "button";
    statusBtn.setAttribute("aria-label", "Cycle production status");

    const applyStatus = (status) => {
      currentStatus = status;
      statusBtn.className = `status-toggle status-${status}`;
      statusBtn.title = `${STATUS_LABELS[status]} — tap to advance`;
    };
    applyStatus(currentStatus);
    statusBtn.textContent = "›";

    statusBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const previous = currentStatus;
      const next = nextStatus(currentStatus);
      applyStatus(next);
      try {
        await api.send("PUT", "/api/card-status", { entry_date: iso, pillar, status: next });
        if (pillar === "komorebi") loadPostedTopics();
      } catch (_) {
        applyStatus(previous);
      }
    });
    card.appendChild(statusBtn);

    // Tap-to-expand content: the pillar's description, plus (Sunday only)
    // the topic editor and Build script button.
    const details = document.createElement("div");
    details.className = "day-details";
    details.hidden = true;
    // Interacting with anything inside the expanded panel (typing in the
    // topic box, clicking Build script) shouldn't also collapse the card.
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

      const buildScriptBtn = document.createElement("button");
      buildScriptBtn.className = "btn btn-small";
      buildScriptBtn.textContent = "Build script";
      buildScriptBtn.disabled = !topicArea.value.trim();
      buildScriptBtn.addEventListener("click", () => {
        const topic = topicArea.value.trim();
        if (topic) buildScript(topic);
      });

      let saveTimer = null;
      topicArea.addEventListener("input", () => {
        savedNote.textContent = "";
        buildScriptBtn.disabled = !topicArea.value.trim();
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

      details.append(topicArea, buildScriptBtn, savedNote);
    }

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
    buildBtn.textContent = "Build script";
    buildBtn.addEventListener("click", () => buildScript(idea.premise));

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
    buildBtn.textContent = "Build script";
    buildBtn.addEventListener("click", () => buildScript(idea.premise));

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

  const SCRIPT_BEATS = [
    ["Disruption", "disruption"],
    ["Recognition", "recognition"],
    ["Reframe", "reframe"],
    ["Evidence", "evidence"],
    ["Invitation & Payoff", "invitation_or_payoff"],
  ];

  function renderScript(script) {
    let html = SCRIPT_BEATS.map(
      ([label, key]) => `<h3>${label}</h3><p>${escapeHtml(script[key])}</p>`
    ).join("");

    if (script.claims && script.claims.length > 0) {
      html +=
        `<div class="claims-block"><h3>Claims to fact-check</h3>` +
        script.claims
          .map(
            (c) => `
        <div class="claim-row">
          <span class="claim-badge ${c.confidence.toLowerCase()}">${escapeHtml(c.confidence)}</span>
          <span class="claim-quote">${escapeHtml(c.quote)}</span>
        </div>`
          )
          .join("") +
        `</div>`;
    }

    return html;
  }

  // title: shown at the top of the modal. request: an async function that
  // resolves to the validated script object from either /api/build-script
  // or /api/brain-dump-script.
  async function openScriptModal(title, request) {
    backdrop.hidden = false;
    modalTitle.textContent = title;
    modalLoading.hidden = false;
    modalContent.hidden = true;
    modalContent.innerHTML = "";

    try {
      const script = await request();
      modalContent.innerHTML = renderScript(script);
      modalContent.hidden = false;
    } catch (err) {
      modalContent.innerHTML = `<p class="empty-note">${escapeHtml(err.message)}</p>`;
      modalContent.hidden = false;
    } finally {
      modalLoading.hidden = true;
    }
  }

  // Topic Builder: idea premises and calendar Sunday topics both funnel
  // through here into the same five-part-arc backend.
  function buildScript(topic) {
    openScriptModal(topic, () => api.send("POST", "/api/build-script", { topic }));
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
    await openScriptModal(title, () => api.send("POST", "/api/brain-dump-script", { text }));

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
