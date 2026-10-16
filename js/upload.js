(function () {
  "use strict";

  const repo = window.SITE_REPO || {};
  const API = "https://api.github.com/repos/" + repo.owner + "/" + repo.repo;
  const TOKEN_KEY = "babyDiaryToken";
  const MAX_SIDE = 1600;   // photos are shrunk to this many pixels on the longest side
  const QUALITY = 0.85;

  const $ = (sel) => document.querySelector(sel);
  let chosen = [];   // File objects picked by the user

  // ---------- token ----------
  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }
  function setToken(t) {
    try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) { /* storage blocked */ }
  }
  function refreshSetup() {
    const has = !!getToken();
    $("#setup-state").textContent = has ? "✓ connected" : "— not connected yet";
    $("#setup").open = !has;
  }
  $("#repo-name").textContent = repo.owner + "/" + repo.repo;
  $("#save-token").addEventListener("click", () => {
    const t = $("#token").value.trim();
    if (!t) return;
    setToken(t);
    $("#token").value = "";
    refreshSetup();
  });
  $("#forget-token").addEventListener("click", () => { setToken(""); refreshSetup(); });
  refreshSetup();

  // ---------- form ----------
  const today = new Date();
  $("#date").value = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");

  function addFiles(list) {
    chosen = chosen.concat([...list].filter((f) => f.type.startsWith("image/")));
    renderPreviews();
  }
  function renderPreviews() {
    const box = $("#previews");
    box.innerHTML = "";
    chosen.forEach((f, i) => {
      const item = document.createElement("div");
      item.className = "preview";
      const img = document.createElement("img");
      img.src = URL.createObjectURL(f);
      img.alt = f.name;
      const rm = document.createElement("button");
      rm.type = "button";
      rm.textContent = "×";
      rm.setAttribute("aria-label", "Remove " + f.name);
      rm.addEventListener("click", () => { chosen.splice(i, 1); renderPreviews(); });
      item.append(img, rm);
      box.append(item);
    });
  }
  $("#files").addEventListener("change", (e) => { addFiles(e.target.files); e.target.value = ""; });
  const drop = $("#drop");
  ["dragenter", "dragover"].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((t) => drop.addEventListener(t, () => drop.classList.remove("over")));
  drop.addEventListener("drop", (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); });

  // ---------- image resizing ----------
  async function loadBitmap(file) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (e) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await img.decode();
      return img;
    }
  }
  async function toJpegBase64(file) {
    const bmp = await loadBitmap(file);
    const w = bmp.width, h = bmp.height;
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", QUALITY).split(",")[1];
  }

  // ---------- posts.js editing ----------
  function b64ToUtf8(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  function countPosts(src) {
    const win = {};
    new Function("window", src)(win);
    return (win.POSTS || []).length;
  }
  function appendPost(src, post) {
    const end = src.lastIndexOf("]");
    if (end < 0) throw new Error("Couldn't find the POSTS list in data/posts.js.");
    const before = src.slice(0, end).trimEnd();
    const comma = before.endsWith("[") || before.endsWith(",") ? "" : ",";
    const entry = JSON.stringify(post, null, 2).replace(/\n/g, "\n  ");
    const out = before + comma + "\n  " + entry + "\n" + src.slice(end);
    // Safety check: the edited file must still load and contain exactly one more post.
    if (countPosts(out) !== countPosts(src) + 1) throw new Error("data/posts.js has an unexpected layout — add this post by hand.");
    return out;
  }

  // ---------- GitHub API ----------
  async function gh(path, opts = {}) {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        Authorization: "Bearer " + getToken(),
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {})
      }
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => ({}))).message || res.statusText;
      if (res.status === 401) throw new Error("GitHub rejected the token. Create a new one in Step 1.");
      if (res.status === 403 || res.status === 404) throw new Error("No permission to write to " + repo.owner + "/" + repo.repo + ". Check the token has Contents: Read and write for this repo. (" + msg + ")");
      throw new Error("GitHub error " + res.status + ": " + msg);
    }
    return res.json();
  }

  function status(msg, kind) {
    const el = $("#status");
    el.textContent = msg;
    el.className = "status" + (kind ? " " + kind : "");
  }

  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!getToken()) { $("#setup").open = true; status("Connect to GitHub first (Step 1).", "error"); return; }
    const title = $("#title").value.trim();
    const date = $("#date").value;
    if (!title || !date) return;

    const btn = $("#publish");
    btn.disabled = true;
    try {
      const branch = encodeURIComponent(repo.branch).replace(/%2F/g, "/");
      status("Connecting to GitHub…");
      const ref = await gh("/git/ref/heads/" + branch);
      const headSha = ref.object.sha;
      const head = await gh("/git/commits/" + headSha);
      const file = await gh("/contents/data/posts.js?ref=" + encodeURIComponent(repo.branch));

      const stamp = Date.now().toString(36);
      const tree = [];
      const photos = [];
      for (let i = 0; i < chosen.length; i++) {
        status(`Preparing photo ${i + 1} of ${chosen.length}…`);
        const content = await toJpegBase64(chosen[i]);
        status(`Uploading photo ${i + 1} of ${chosen.length}…`);
        const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content, encoding: "base64" }) });
        const path = `photos/${date}-${stamp}-${i + 1}.jpg`;
        tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
        photos.push(path);
      }

      const post = { date, title };
      const text = $("#text").value.trim();
      if (text) post.text = text;
      if (photos.length) post.photos = photos;
      const tags = $("#tags-input").value.split(/[,，]/).map((t) => t.trim()).filter(Boolean);
      if (tags.length) post.tags = tags;

      status("Saving the post…");
      const newSrc = appendPost(b64ToUtf8(file.content), post);
      tree.push({ path: "data/posts.js", mode: "100644", type: "blob", content: newSrc });

      const newTree = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
      const commit = await gh("/git/commits", {
        method: "POST",
        body: JSON.stringify({ message: "Add memory: " + title, tree: newTree.sha, parents: [headSha] })
      });
      await gh("/git/refs/heads/" + branch, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });

      status("🎉 Published! It shows up on the diary in 1–2 minutes (refresh the page).", "ok");
      $("#form").reset();
      $("#date").value = date;
      chosen = [];
      renderPreviews();
    } catch (err) {
      status(err.message || String(err), "error");
    } finally {
      btn.disabled = false;
    }
  });
})();
