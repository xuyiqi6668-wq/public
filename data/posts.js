/*
 * ============================================================
 *  YOUR BLOG CONTENT LIVES HERE
 * ============================================================
 *  1. Put your photos in the /photos folder (jpg, png, webp...).
 *  2. Add a new entry to POSTS below (newest or oldest, order
 *     doesn't matter — the site sorts by date automatically).
 *  3. Save, commit, push. Done!
 *
 *  Each post:
 *    date:    "YYYY-MM-DD"            (required)
 *    title:   "Short headline"        (required)
 *    text:    "A few words..."        (optional, blank line = new paragraph)
 *    photos:  ["photos/a.jpg", ...]   (optional, one or many)
 *    tags:    ["milestone", ...]      (optional, used for filtering)
 * ============================================================
 */

window.BABY = {
  name: "Little One",          // your baby's name
  birthday: "2026-03-08",      // YYYY-MM-DD
  tagline: "Tiny feet, big adventures — a diary of growing up.",
  author: "Mom & Dad",
  avatar: ""                   // optional round photo at the top, e.g. "photos/me.jpg" (empty = newest photo)
};

// Where the "Add memory" page (upload.html) saves new photos and posts.
window.SITE_REPO = {
  owner: "xuyiqi6668-wq",
  repo: "public",
  branch: "claude/personal-blog-baby-pictures-b09nf5"   // the branch GitHub Pages publishes
};

// Keep POSTS as the last thing in this file — the upload page adds new posts to the end of it.

window.POSTS = [
  {
    date: "2026-03-08",
    title: "Hello, world!",
    text: "You arrived at 6:42 in the morning, all 3.2 kg of you. The room went quiet, and then you let everyone know you were here.\n\nWe have never been so tired or so happy.",
    photos: ["photos/hello-world.svg"],
    tags: ["milestone", "birth"]
  },
  {
    date: "2026-03-15",
    title: "First bath at home",
    text: "You were not impressed. Then you were very impressed. Then you fell asleep in the towel.",
    photos: ["photos/first-bath.svg", "photos/sleepy.svg"],
    tags: ["first time"]
  },
  {
    date: "2026-04-20",
    title: "That first real smile",
    text: "Not gas this time — a real, beaming smile, right at Dad's silly song.",
    photos: ["photos/first-smile.svg"],
    tags: ["milestone"]
  },
  {
    date: "2026-05-30",
    title: "Afternoon in the park",
    text: "Your first long walk in the stroller. You watched the leaves the whole way.",
    photos: ["photos/park-walk.svg", "photos/balloons.svg", "photos/sleepy.svg"],
    tags: ["outing"]
  },
  {
    date: "2026-08-08",
    title: "Five months old 🎈",
    text: "Rolling over in both directions now, and grabbing everything in reach.",
    photos: ["photos/balloons.svg"],
    tags: ["monthly"]
  },
  {
    date: "2026-09-12",
    title: "First taste of food",
    text: "Sweet potato puree. Verdict: mostly on the face, some in the mouth, total success.",
    photos: ["photos/first-food.svg", "photos/first-smile.svg"],
    tags: ["milestone", "first time"]
  }
];
