(() => {
  "use strict";

  // ---------- Date helpers ----------

  const DAY_MS = 86400000;

  function toISODate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
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

  function formatWeekLabel(monday) {
    const sunday = addDays(monday, 6);
    const left = monday.toLocaleDateString(undefined, WEEK_LABEL_FMT);
    const right = sunday.toLocaleDateString(undefined, { ...WEEK_LABEL_FMT, year: "numeric" });
    return `${left} – ${right}`;
  }

  // ---------- Fixed rhythm ----------

  const DAY_META = [
    { label: "Mon", pillar: null },
    { label: "Tue", pillar: "collage", cls: "collage", desc: "Collage. No script needed, post whatever's filmed." },
    { label: "Wed", pillar: null },
    { label: "Thu", pillar: "haiku", cls: "haiku", desc: "Physical Haikus. Minimal edit, just the movement." },
    { label: "Fri", pillar: null, note: "Script &amp; film Sunday's Komorebi Session by today." },
    { label: "Sat", pillar: null },
    { label: "Sun", pillar: "komorebi", cls: "komorebi", desc: "Komorebi Session." },
  ];

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

  // ---------- Calendar ----------

  let currentMonday = mondayOf(new Date());

  const weekLabelEl = document.getElementById("week-label");
  const calendarGridEl = document.getElementById("calendar-grid");

  async function renderCalendar() {
    weekLabelEl.textContent = `Week of ${formatWeekLabel(currentMonday)}`;
    calendarGridEl.innerHTML = "";

    const sundayISO = toISODate(addDays(currentMonday, 6));
    let topics = {};
    try {
      const data = await api.get(
        `/api/komorebi-topics?start=${sundayISO}&end=${sundayISO}`
      );
      topics = data.topics || {};
    } catch (_) {
      // Non-fatal: calendar still renders without a saved topic.
    }

    const todayISO = toISODate(new Date());
    const carouselWeek = isCarouselMonday(currentMonday);

    DAY_META.forEach((meta, i) => {
      const date = addDays(currentMonday, i);
      const iso = toISODate(date);
      const card = document.createElement("div");
      card.className = "day-card" + (iso === todayISO ? " is-today" : "");

      const head = document.createElement("div");
      head.className = "day-head";
      head.innerHTML = `<span>${meta.label}</span><span class="day-date">${date.getDate()}</span>`;
      card.appendChild(head);

      if (meta.pillar) {
        const tag = document.createElement("span");
        tag.className = `pillar-tag ${meta.cls}`;
        tag.textContent = meta.label === "Sun" ? "Komorebi" : meta.pillar === "collage" ? "Collage" : "Haikus";
        card.appendChild(tag);

        const desc = document.createElement("div");
        desc.className = "day-desc";
        desc.textContent = meta.desc;
        card.appendChild(desc);
      } else if (meta.label === "Mon" && carouselWeek) {
        const tag = document.createElement("span");
        tag.className = "pillar-tag carousel";
        tag.textContent = "Carousel (bonus)";
        card.appendChild(tag);

        const desc = document.createElement("div");
        desc.className = "day-desc";
        desc.textContent = "3 clips + the standard Lisbon-workshop CTA slide. No stills needed.";
        card.appendChild(desc);
      } else {
        const tag = document.createElement("span");
        tag.className = "pillar-tag none";
        tag.textContent = "—";
        card.appendChild(tag);
      }

      if (meta.note) {
        const note = document.createElement("div");
        note.className = "day-note";
        note.innerHTML = meta.note;
        card.appendChild(note);
      }

      if (meta.label === "Sun") {
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
              await api.send("PUT", "/api/komorebi-topics", {
                sunday_date: iso,
                topic: topicArea.value,
              });
              savedNote.textContent = "saved";
              setTimeout(() => (savedNote.textContent = ""), 1500);
            } catch (_) {
              savedNote.textContent = "save failed";
            }
          }, 600);
        });

        card.appendChild(topicArea);
        card.appendChild(savedNote);
      }

      calendarGridEl.appendChild(card);
    });
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
        await api.send("POST", "/api/ideas", { ...idea, status: "kept" });
        card.remove();
        await loadBanks();
      } catch (err) {
        setStatus(err.message, true);
        keepBtn.disabled = false;
      }
    });

    const setAsideBtn = document.createElement("button");
    setAsideBtn.className = "btn btn-small";
    setAsideBtn.textContent = "Set aside";
    setAsideBtn.addEventListener("click", async () => {
      setAsideBtn.disabled = true;
      try {
        await api.send("POST", "/api/ideas", { ...idea, status: "archived" });
        card.remove();
        await loadBanks();
      } catch (err) {
        setStatus(err.message, true);
        setAsideBtn.disabled = false;
      }
    });

    const buildBtn = document.createElement("button");
    buildBtn.className = "btn btn-small";
    buildBtn.textContent = "Build it out";
    buildBtn.addEventListener("click", () => openBuildModal(idea.premise));

    actions.append(keepBtn, setAsideBtn, buildBtn);
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

  // ---------- Kept / Archived banks ----------

  const keptListEl = document.getElementById("kept-list");
  const archivedListEl = document.getElementById("archived-list");
  const keptCountEl = document.getElementById("kept-count");
  const archivedCountEl = document.getElementById("archived-count");

  function bankRow(idea, otherStatus) {
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
    buildBtn.textContent = "Build it out";
    buildBtn.addEventListener("click", () => openBuildModal(idea.premise));

    const moveBtn = document.createElement("button");
    moveBtn.className = "btn btn-small";
    moveBtn.textContent = otherStatus === "kept" ? "Move to kept" : "Move to set aside";
    moveBtn.addEventListener("click", async () => {
      moveBtn.disabled = true;
      try {
        await api.send("PATCH", `/api/ideas/${idea.id}`, { status: otherStatus });
        await loadBanks();
      } catch (err) {
        setStatus(err.message, true);
        moveBtn.disabled = false;
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "btn btn-small btn-danger";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      if (!confirm("Remove this idea for good? This can't be undone.")) return;
      removeBtn.disabled = true;
      try {
        await api.send("DELETE", `/api/ideas/${idea.id}`);
        await loadBanks();
      } catch (err) {
        setStatus(err.message, true);
        removeBtn.disabled = false;
      }
    });

    actions.append(buildBtn, moveBtn, removeBtn);
    row.append(main, actions);
    return row;
  }

  function renderEmpty(container, text) {
    const p = document.createElement("p");
    p.className = "empty-note";
    p.textContent = text;
    container.appendChild(p);
  }

  async function loadBanks() {
    try {
      const [kept, archived] = await Promise.all([
        api.get("/api/ideas?status=kept"),
        api.get("/api/ideas?status=archived"),
      ]);

      keptListEl.innerHTML = "";
      keptCountEl.textContent = kept.ideas.length;
      if (kept.ideas.length === 0) {
        renderEmpty(keptListEl, "Nothing kept yet.");
      } else {
        kept.ideas.forEach((idea) => keptListEl.appendChild(bankRow(idea, "archived")));
      }

      archivedListEl.innerHTML = "";
      archivedCountEl.textContent = archived.ideas.length;
      if (archived.ideas.length === 0) {
        renderEmpty(archivedListEl, "Nothing set aside.");
      } else {
        archived.ideas.forEach((idea) => archivedListEl.appendChild(bankRow(idea, "kept")));
      }
    } catch (err) {
      setStatus(err.message, true);
    }
  }

  // ---------- Build-out modal ----------

  const backdrop = document.getElementById("build-modal-backdrop");
  const modalTitle = document.getElementById("build-modal-title");
  const modalLoading = document.getElementById("build-modal-loading");
  const modalContent = document.getElementById("build-modal-content");

  async function openBuildModal(premise) {
    backdrop.hidden = false;
    modalTitle.textContent = premise;
    modalLoading.hidden = false;
    modalContent.hidden = true;
    modalContent.innerHTML = "";

    try {
      const data = await api.send("POST", "/api/build-idea", { premise });
      modalContent.innerHTML = `
        <h3>Opening</h3><p>${escapeHtml(data.opening)}</p>
        <h3>Throughline</h3><p>${escapeHtml(data.throughline)}</p>
        <h3>Shots</h3><ol>${data.shots.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ol>
        <h3>Closing</h3><p>${escapeHtml(data.closing)}</p>
      `;
      modalContent.hidden = false;
    } catch (err) {
      modalContent.innerHTML = `<p class="empty-note">${escapeHtml(err.message)}</p>`;
      modalContent.hidden = false;
    } finally {
      modalLoading.hidden = true;
    }
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
  loadBanks();
  loadProfile();
})();
