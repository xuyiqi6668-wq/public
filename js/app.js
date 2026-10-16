(function () {
  "use strict";

  const baby = window.BABY || {};
  const posts = (window.POSTS || [])
    .map((p) => ({ ...p, photos: p.photos || [], tags: p.tags || [] }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const $ = (sel) => document.querySelector(sel);
  const birth = baby.birthday ? parseDate(baby.birthday) : null;
  const state = { view: "timeline", tag: null, query: "" };

  // ---------- helpers ----------
  function parseDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function fmtDate(s) {
    return parseDate(s).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function monthsBetween(from, to) {
    let m = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (to.getDate() < from.getDate()) m--;
    return m;
  }
  function ageLabel(date) {
    if (!birth) return "";
    const days = Math.round((date - birth) / 86400000);
    if (days < 0) return "before birth";
    if (days === 0) return "birthday!";
    if (days < 14) return days + (days === 1 ? " day" : " days");
    const months = monthsBetween(birth, date);
    if (months < 1) return Math.floor(days / 7) + " weeks";
    if (months < 24) return months + (months === 1 ? " month" : " months");
    const y = Math.floor(months / 12), rm = months % 12;
    return y + " years" + (rm ? " " + rm + " mo" : "");
  }
  function groupLabel(dateStr) {
    if (!birth) return parseDate(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "long" });
    const m = monthsBetween(birth, parseDate(dateStr));
    if (m < 1) return "Newborn";
    if (m < 12) return "Month " + m;
    return "Year " + Math.floor(m / 12) + (m % 12 ? ", month " + (m % 12) : "");
  }

  // ---------- header ----------
  document.title = (baby.name || "Baby") + "'s Diary";
  $("#baby-name").textContent = baby.name || "Our Baby";
  $("#tagline").textContent = baby.tagline || "";
  $("#author").textContent = baby.author || "family";
  $("#year").textContent = new Date().getFullYear();
  $("#age").textContent = ageLabel(new Date()) || "–";
  $("#post-count").textContent = posts.length;
  $("#photo-count").textContent = posts.reduce((n, p) => n + p.photos.length, 0);

  const avatarSrc = baby.avatar || (posts.find((p) => p.photos.length) || { photos: [] }).photos[0];
  if (avatarSrc) $("#avatar").innerHTML = `<img src="${esc(avatarSrc)}" alt="">`;

  if (birth) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const done = Math.max(0, monthsBetween(birth, now));
    const next = new Date(birth.getFullYear(), birth.getMonth() + done + 1, birth.getDate());
    const left = Math.round((next - now) / 86400000);
    if (now >= birth && done < 24) {
      $("#next-month").textContent = left === 0
        ? `🎉 ${done + 1} months old today!`
        : `${left} ${left === 1 ? "day" : "days"} until ${done + 1} ${done + 1 === 1 ? "month" : "months"} ✨`;
    }
    $("#age-sub").textContent = "old today · born " + fmtDate(baby.birthday);
  }

  const toTop = $("#to-top");
  window.addEventListener("scroll", () => { toTop.hidden = window.scrollY < 600; }, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));

  // ---------- tags ----------
  const allTags = [...new Set(posts.flatMap((p) => p.tags))].sort();
  $("#tags").innerHTML = allTags.length
    ? ['<button class="tag active" data-tag="">All</button>']
        .concat(allTags.map((t) => `<button class="tag" data-tag="${esc(t)}">${esc(t)}</button>`))
        .join("")
    : "";
  $("#tags").addEventListener("click", (e) => {
    const btn = e.target.closest(".tag");
    if (!btn) return;
    state.tag = btn.dataset.tag || null;
    document.querySelectorAll(".tag").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  $("#search").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll(".view-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      state.view = btn.dataset.view;
      document.querySelectorAll(".view-btn").forEach((b) => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-selected", b === btn);
      });
      render();
    })
  );

  // ---------- rendering ----------
  let visiblePhotos = []; // flat list used by the lightbox

  function filtered() {
    return posts.filter((p) => {
      if (state.tag && !p.tags.includes(state.tag)) return false;
      if (!state.query) return true;
      return (p.title + " " + (p.text || "") + " " + p.tags.join(" ")).toLowerCase().includes(state.query);
    });
  }

  function photoButton(post, src, extra = "") {
    const i = visiblePhotos.push({ src, post }) - 1;
    return `<button data-i="${i}" aria-label="Open photo: ${esc(post.title)}">
      <img src="${esc(src)}" alt="${esc(post.title)}" loading="lazy">${extra}</button>`;
  }

  function render() {
    const list = filtered();
    visiblePhotos = [];
    $("#empty").hidden = list.length > 0;
    $("#timeline").hidden = state.view !== "timeline";
    $("#gallery").hidden = state.view !== "gallery";

    if (state.view === "timeline") {
      let html = "", lastGroup = null;
      for (const p of list) {
        const g = groupLabel(p.date);
        if (g !== lastGroup) { html += `<h2 class="month-head">${esc(g)}</h2>`; lastGroup = g; }
        const n = p.photos.length;
        const paras = (p.text || "").split(/\n\s*\n/).filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join("");
        const star = p.tags.includes("milestone");
        html += `<article class="post${star ? " milestone" : ""}">
          ${star ? `<span class="badge" title="Milestone">★ Milestone</span>` : ""}
          <div class="post-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time>
            ${birth ? `<span>·</span><span class="age">${esc(ageLabel(parseDate(p.date)))}</span>` : ""}</div>
          <h2>${esc(p.title)}</h2>
          ${n ? `<div class="photos" data-n="${n > 3 ? "many" : n}">${p.photos.map((s) => photoButton(p, s)).join("")}</div>` : ""}
          ${paras}
          ${p.tags.length ? `<div class="post-tags">${p.tags.map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
        </article>`;
      }
      $("#timeline").innerHTML = html;
    } else {
      $("#gallery").innerHTML = list
        .flatMap((p) => p.photos.map((s) => photoButton(p, s, `<span class="g-cap">${esc(p.title)}<small>${esc(ageLabel(parseDate(p.date)) || fmtDate(p.date))}</small></span>`)))
        .join("");
    }
  }

  // ---------- lightbox ----------
  const lb = $("#lightbox");
  let current = 0, lastFocus = null;

  function show(i) {
    if (!visiblePhotos.length) return;
    current = (i + visiblePhotos.length) % visiblePhotos.length;
    const { src, post } = visiblePhotos[current];
    $("#lb-img").src = src;
    $("#lb-img").alt = post.title;
    $("#lb-cap").textContent = `${post.title} — ${fmtDate(post.date)}  (${current + 1} / ${visiblePhotos.length})`;
  }
  function open(i) {
    lastFocus = document.activeElement;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    show(i);
    lb.querySelector(".lb-close").focus();
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-i]");
    if (btn) open(Number(btn.dataset.i));
  });
  lb.querySelector(".lb-close").addEventListener("click", close);
  lb.querySelector(".lb-prev").addEventListener("click", () => show(current - 1));
  lb.querySelector(".lb-next").addEventListener("click", () => show(current + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });

  // swipe on touch screens
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  render();
})();
