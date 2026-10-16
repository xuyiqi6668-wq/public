# 🍼 Baby Diary

A simple personal blog for keeping baby photos and the little stories behind them.

- **Timeline** of memories, grouped by the baby's age (Newborn, Month 1, Month 2…)
- Each post shows **how old the baby was** that day
- **All photos** gallery view
- Full-screen photo viewer (arrow keys, swipe on phones, Esc to close)
- Search and tag filters (`milestone`, `first time`, …)
- Works on phones, follows the device's dark mode
- No build step and no database: just HTML, CSS and JavaScript

## Adding a new memory

1. Put your photos in the `photos/` folder, e.g. `photos/first-steps-1.jpg`.
   Tip: shrink big phone photos to about 1600px wide so the page loads fast.
2. Open `data/posts.js` and add an entry to `POSTS`:

   ```js
   {
     date: "2026-10-16",
     title: "First steps!",
     text: "Three wobbly steps from the sofa to Mom.\n\nThen a very proud sit-down.",
     photos: ["photos/first-steps-1.jpg", "photos/first-steps-2.jpg"],
     tags: ["milestone"]
   },
   ```
3. Commit and push. The site sorts posts by date on its own.

Set your baby's name, birthday and tagline in the `BABY` section at the top of `data/posts.js`.

The images in `photos/` right now are samples. Delete them once you've added your own.

## Viewing it

- **On your computer:** double-click `index.html` to open it in a browser.
- **Online (GitHub Pages):** go to the repo's **Settings → Pages**, set *Source* to
  *Deploy from a branch*, pick your branch and the `/ (root)` folder, then click Save.
  After a minute or two the site will be live at `https://<your-username>.github.io/<repo-name>/`.

> ⚠️ **Privacy:** a public repo and GitHub Pages site can be seen by anyone who has the link.
> If you'd rather keep your baby's photos private, use a private repository
> (Pages on private repos needs a paid GitHub plan) or only view the site locally.
