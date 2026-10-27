# Remotion vs HyperFrames as the rendering engine for an automated talking-head (口播) and script-driven (文案视频) editing system

Research date: 2026-10-27. All versions, star counts and prices below were checked against primary sources (npm registry, GitHub API, official docs and license pages) on that date unless marked otherwise. Items from aggregators or blogs are labeled as such.

---

## Q1. Remotion: architecture, current version, and what was added in 2025–2026

### Takeaway
Remotion is a mature React-based framework (first published 2016, v4.0 in July 2023). It is still on the 4.0.x line and ships roughly two releases a week; the latest is **4.0.539, published 2026-10-26**. Between 2024 and 2026 it added a captioning and transcription stack, a WebCodecs/Mediabunny media layer (`@remotion/media`, the recommended `<Video>`), stable client-side rendering, Vercel Sandbox rendering, and official agent skills and plugins. The hosted Remotion MCP server was shut down on 2026-10-26. Remotion 5.0, which brings license changes, is still an unmerged draft.

### Cited Findings
**Identity, version and cadence**
- npm `remotion` dist-tags: `latest` = **4.0.539**, published 2026-10-26 11:11 UTC. The previous ten releases, 4.0.530 to 4.0.539, came out between 2026-09-29 and 2026-10-26, about 2–3 a week. The registry lists 1,275 versions, and the package was created 2016-11-02. There is also an `alpha` tag, `4.1.0-alpha12`. — [npm registry: remotion](https://registry.npmjs.org/remotion)
- Remotion 4.0.0 was published 2023-07-03. — [npm registry: remotion](https://registry.npmjs.org/remotion); [Remotion 4.0 blog](https://www.remotion.dev/blog/4-0)
- GitHub `remotion-dev/remotion`: **68,141 stars**, 5,535 forks and 202 open issues. The repo was created 2020-06-23, and its description is "Make videos programmatically with React". — [GitHub repo](https://github.com/remotion-dev/remotion) (via GitHub search API, 2026-10-27)
- npm downloads for 2026-06-02 to 2026-07-01, the window the npm "last-month" endpoint returned: `remotion` 4,872,594 and `@remotion/renderer` 3,677,141. — [npm downloads API: remotion](https://api.npmjs.org/downloads/point/last-month/remotion); [@remotion/renderer](https://api.npmjs.org/downloads/point/last-month/@remotion/renderer)

**Architecture**
- Remotion describes itself as "a React framework for creating videos programmatically". A video is a React component that is a function of the current frame (`useCurrentFrame()`), registered with `<Composition>`. — [Remotion llms.txt](https://www.remotion.dev/llms.txt); [HyperFrames vs Remotion guide](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)
- Server-side rendering bundles the project, opens it in headless Chrome, screenshots each frame, and encodes with FFmpeg. Remotion Lambda's AWS quota guidance names the dependencies as "FFmpeg and Puppeteer". — [Lambda limits](https://www.remotion.dev/docs/lambda/limits)
- Rendering options: the Node/Bun APIs (`renderMedia()`, `renderStill()`, `renderFrames()`), CLI (`npx remotion render`), Remotion Lambda (distributed), Vercel Sandbox (`@remotion/vercel`), Cloud Run (alpha), and client-side rendering (`@remotion/web-renderer`). There are also deployment guides for Cloudflare Containers and Azure Container Apps. — [Comparison of SSR options](https://www.remotion.dev/docs/compare-ssr); [License FAQ: what is an automation](https://www.remotion.dev/docs/license/faq)

**Media layer (relevant to real camera footage)**
- `<Video>` from `@remotion/media` is now "the recommended component for embedding videos". It is based on Mediabunny and WebCodecs. During rendering it extracts the exact frame and draws it to a `<canvas>`, and it supports HLS. — [`<Video>` docs](https://www.remotion.dev/docs/media/video); [Video tags comparison](https://www.remotion.dev/docs/video-tags)
- `@remotion/media` was first published 2025-09-22, as v4.0.351. — [npm registry: @remotion/media](https://registry.npmjs.org/@remotion/media)
- There are three video tags. `<Video>` (Mediabunny/WebCodecs) is frame-perfect, supports partial download, renders "Fastest", requires CORS and works in client-side rendering. `<OffthreadVideo>` uses a "Rust + FFmpeg binary" frame extractor, is frame-perfect and "Fast", and supports H.265, AV1, AC3 and ProRes. `<Html5Video>` (formerly `<Video>`) is not guaranteed frame-perfect. — [Video tags comparison](https://www.remotion.dev/docs/video-tags)
- `<Video>` decodes AAC, FLAC, H.264, MP3, Opus, VP8, VP9 and Vorbis. For an unsupported codec, missing CORS, or alpha without WebGL, it falls back automatically to `<OffthreadVideo>`. ProRes decoding is available from 4.0.487 via `@mediabunny/prores`. — [Video tags comparison](https://www.remotion.dev/docs/video-tags); [Supported media](https://www.remotion.dev/docs/media/support)
- Matroska limitation: for `.mkv`/`.webm`, audio extraction has to decode everything up to the extraction point. Remotion says to prefer `.mp4`/`.mov`/`.m4a` for distributed (Lambda) rendering. — [Supported media](https://www.remotion.dev/docs/media/support)
- Remotion's performance page says `<Html5Video>` and `<OffthreadVideo>` "are not optimized" and recommends migrating to `@remotion/media` `<Video>`. — [Performance tips](https://www.remotion.dev/docs/performance)
- `@remotion/media-parser` was first published 2024-08-02 and `@remotion/webcodecs` on 2024-09-10. Remotion has sponsored Mediabunny since Sept 2025. — [npm: @remotion/media-parser](https://registry.npmjs.org/@remotion/media-parser); [npm: @remotion/webcodecs](https://registry.npmjs.org/@remotion/webcodecs); [Remotion blog: Sponsoring Mediabunny](https://www.remotion.dev/blog/mediabunny)

**Captions and transcription stack**
- Transcription options: `@remotion/install-whisper-cpp` (server, Whisper.cpp, free, offline), `@remotion/whisper-webgpu` (browser, WebGPU), `@remotion/whisper-web` (browser WASM, slow), `@remotion/openai-whisper` (OpenAI API, paid), and `@remotion/elevenlabs` (ElevenLabs STT, paid). Each converts its output to the common `Caption` type. — [Transcribing audio](https://www.remotion.dev/docs/captions/transcribing)
- `@remotion/whisper-web` is deprecated and will not be published from 5.0 on; its replacement is `@remotion/whisper-webgpu`, first published 2026-08-26. — [whisper-web docs](https://www.remotion.dev/docs/whisper-web); [npm: @remotion/whisper-webgpu](https://registry.npmjs.org/@remotion/whisper-webgpu)
- `@remotion/install-whisper-cpp` has been available since v4.0.115. Its docs example pins Whisper.cpp 1.5.5, "the latest version at the time of writing that we find works well and supports token-level timestamps", and uses `tokenLevelTimestamps: true` then `toCaptions()`. — [install-whisper-cpp docs](https://www.remotion.dev/docs/install-whisper-cpp)
- `@remotion/elevenlabs` has been available since v4.0.443 (published 2026-03-31). — [elevenlabs docs](https://www.remotion.dev/docs/elevenlabs); [npm: remotion versions](https://registry.npmjs.org/remotion)
- The `Caption` type has `text`, `startMs`, `endMs`, `timestampMs` and `confidence`. `createTikTokStyleCaptions()` (since 4.0.216) groups tokens into "pages", and a low `combineTokensWithinMilliseconds` gives word-by-word animation. **Note:** "This API expects the whitespace to be included in the `text` field before each word. Spaces are used as delimiters, and omitting them will cause the entire text to merge into a single line or page." — [createTikTokStyleCaptions](https://www.remotion.dev/docs/captions/create-tiktok-style-captions)
- The `@remotion/captions` package was first published 2024-10-03. — [npm: @remotion/captions](https://registry.npmjs.org/@remotion/captions)

**AI and agent integration (current as of Oct 2026)**
- Remotion Agent Skills are installed with `npx skills add remotion-dev/skills`, `gh skill install remotion-dev/skills`, or `npx remotion skills add`. The skills are `/remotion-best-practices`, `/remotion-create`, `/remotion-markup`, `/remotion-studio`, `/remotion-render`, `/remotion-maps`, `/remotion-captions`, `/remotion-saas`, `/remotion-interactivity` and `/remotion-docs`. Their source is in `packages/skills` in the main repo. — [Agent Skills](https://www.remotion.dev/docs/ai/skills)
- Remotion also maintains plugins for Codex (ChatGPT desktop), Claude Code, Cursor (marketplace), GitHub Copilot CLI and Kimi Code. — [Plugins](https://www.remotion.dev/docs/ai/plugins)
- The officially recommended prompt-to-video flow is `npx create-video --yes --blank my-video`, then `npx remotion skills add`, then `npm run dev`, then running `claude`/`codex`/`kimi`/`opencode` in the folder. — [Prompting videos with coding agents](https://www.remotion.dev/docs/ai/coding-agents)
- **The hosted Remotion MCP server was shut down on 2026-10-26.** The stated reasons were stale data, token costs paid by Remotion, agents not invoking it reliably, and duplication of `/remotion-docs`. — [Remotion MCP (shut down)](https://www.remotion.dev/docs/ai/mcp)
- A "Just-in-time compilation" guide shows how to compile LLM-generated Remotion TSX in the browser (`@babel/standalone` plus a `Function` constructor with injected Remotion APIs) for live preview, which supports runtime prompt-to-video products. — [Just-in-time compilation](https://www.remotion.dev/docs/ai/dynamic-compilation)
- The docs are agent-ready: every page is available as `.md`, `llms.txt` exists, and pages honor `Accept: text/markdown`. Other options are a Bolt.new template and a docs chatbot at remotion.ai. — [Building with Remotion and AI](https://www.remotion.dev/docs/ai); [Bolt.new](https://www.remotion.dev/docs/ai/bolt); [Chatbot](https://www.remotion.dev/docs/ai/chatbot)

**Client-side rendering, Player, Studio and paid building blocks**
- Client-side rendering (`@remotion/web-renderer`, `renderMediaOnWeb()`) is "Stable from version 4.0.491", which was published 2026-07-18; the package was first published 2025-09-02. It encodes via WebCodecs/Mediabunny and needs Chrome 94+, Firefox 130+ or Safari 26+. — [Client-side rendering](https://www.remotion.dev/docs/client-side-rendering); [npm: @remotion/web-renderer](https://registry.npmjs.org/@remotion/web-renderer)
- Client-side rendering cannot screenshot the viewport. Instead it rebuilds the DOM onto a canvas: it walks the tree, computes bounding boxes, draws `svg`/`canvas`/`img`/`video` natively, re-lays out text with `Intl.Segmenter`, and supports only a subset of CSS. — [How client-side rendering works](https://www.remotion.dev/docs/client-side-rendering/how-it-works)
- Vercel rendering runs in an ephemeral Vercel Sandbox VM per render (`@remotion/vercel`, first published 2026-02-20). Remotion calls it the easiest setup, but it has no distributed rendering and longer cold starts. — [Remotion on Vercel](https://www.remotion.dev/docs/vercel); [Compare SSR](https://www.remotion.dev/docs/compare-ssr); [npm: @remotion/vercel](https://registry.npmjs.org/@remotion/vercel)
- Paid add-ons: the **Editor Starter** is a video-editor template with timeline, canvas, font picker, asset uploads and 80+ feature flags, sold as a one-time purchase for free-license users. The **Remotion Timeline** is a paid layer-based timeline component for the Player. — [Editor Starter](https://www.remotion.dev/docs/editor-starter); [Timeline](https://www.remotion.dev/docs/timeline)

**Remotion 5.0 status**
- PR #3750, "Prepare Remotion 5.0", is still an **open draft**. It was opened 2024-04-22, and maintainers asked for review of the LICENSE.md changes on 2026-08-09. — [PR #3750](https://github.com/remotion-dev/remotion/pull/3750)

### Inferences
- Remotion is effectively in a "4.0.x continuous delivery" mode. A major 5.0 with license changes is pending, so any system built now should plan for a 4.x to 5.0 migration and the new license-key requirement (see Q3).
- For talking-head footage (`口播`), the WebCodecs-based `<Video>` is the right default. Phone footage is often HEVC (H.265), which `<Video>` does not decode, so it falls back to the slower `<OffthreadVideo>`. Transcoding sources to H.264 MP4 at ingest would keep renders on the fast path. This is an inference from the codec tables, not a measured result.
- The `createTikTokStyleCaptions` whitespace requirement means Chinese word-level ASR output, which has no spaces, must be pre-segmented: insert a leading space per token, or group by characters or phrases yourself. Otherwise everything collapses into one page.

### Gaps
- I could not reach Remotion's GitHub release notes through the session's GitHub access, so there is no exact list of 2026 feature releases beyond what the docs' version badges show.
- Remotion's blog RSS ends in Sept 2025, so I found no official 2026 announcement posts. The 2026 features above are dated from npm publish dates and doc badges.

---

## Q2. Remotion: render speed, concurrency, cloud cost, and handling of long source footage

### Takeaway
Remotion Lambda is the mature distributed renderer. It splits a video into chunks across up to 200 Lambda functions and has published cost examples: about **$0.017 for a 1-minute video** and **about $0.10 for a 10-minute HD video**, Lambda compute only. Embedded video and 4K "significantly" increase cost. I found no independent fps benchmarks. For long source footage, use `@remotion/media` `<Video>`, which partially downloads and decodes only what each chunk needs.

### Cited Findings
- Lambda cost examples (2048 MB RAM, us-east-1, Remotion 4.0.381, warm vs cold):
  - Hello World: $0.001, 7.56 s
  - 1-minute video (1,440 frames): $0.017, 18.91 s warm
  - 10-minute remote HD video (14,315 frames): $0.103, 56.09 s warm; $0.108, 60.98 s cold
  - 10-second remote 4K video: $0.013, 45.28 s warm
  
  "Embedding a video inside another video significantly increases cost" and "moving to 4K significantly increases render time". The figures exclude S3, egress, CloudWatch and the Remotion license. — [Lambda cost example](https://www.remotion.dev/docs/lambda/cost-example)
- Marketing claims on the Lambda page: an "80-second video rendered in 15 seconds" (Remotion trailer) and a "2-hour video rendered in 12 minutes" (`--frames-per-lambda=1080`, ARM64, 2048 MB, warm), "from $0.01" per minute of video, and "up to 200x" concurrency. — [Remotion Lambda landing page](https://www.remotion.dev/lambda)
- Concurrency model: the default `framesPerLambda` is chosen so concurrency rises from 75 to 150 as length goes from 0 to 10 minutes (at 30 fps), with at least 20 frames per Lambda. Hard limits are a minimum of 5 `framesPerLambda` and a maximum of 200 functions per render ("renders will not become faster" beyond this). `concurrency: 1`, which renders on the main function, is available from 4.0.517. — [Lambda concurrency](https://www.remotion.dev/docs/lambda/concurrency)
- AWS quotas apply: 1,000 concurrent executions per region by default (lower for new accounts), 10 GB RAM and 10 GB disk maximum, and a 15-minute timeout. — [Lambda limits](https://www.remotion.dev/docs/lambda/limits)
- Speed levers: more memory scales CPU; `concurrencyPerLambda` opens multiple tabs per function; `<Video>` from `@remotion/media` "can start decoding before the full video is downloaded and avoids full asset downloads"; an MP3 audio codec makes the "Combining videos" stage faster. — [Optimizing for speed](https://www.remotion.dev/docs/lambda/optimizing-speed)
- Local rendering: tune `--concurrency` with `npx remotion benchmark`. GPU-accelerated CSS (blur, shadows, gradients), WebGL and canvas are slow on cloud instances without a GPU; PNG frames are slower than JPEG; VP8/VP9 are slow to encode. — [Performance tips](https://www.remotion.dev/docs/performance)
- Remotion's own comparison: Lambda is "the fastest option, because it implements distributed rendering", but "compute on Remotion Lambda is more expensive than other options". Cloud Run is cheaper because there is no distribution overhead, and a long-running server has the cheapest compute but you pay for idle time. "The Remotion customers with the highest amount of videos rendered use the Remotion Lambda solution." — [Compare SSR](https://www.remotion.dev/docs/compare-ssr)
- Remotion Cloud Run is in "Alpha status and not actively being developed"; there is a plan to adapt the Lambda runtime to power it later. Its limits are 32 GB memory, 8 vCPU and a 60-minute timeout. — [Cloud Run](https://www.remotion.dev/docs/cloudrun); [Cloud Run status](https://www.remotion.dev/docs/cloudrun/status)
- Lambda-only features include distributed rendering, webhooks, Apple Emoji, cost estimation, expiring renders, and rendering from PHP/Go/Python. AV1 output is not available on Lambda. — [Compare SSR](https://www.remotion.dev/docs/compare-ssr)
- I found no published fps or minutes benchmark comparing local and Lambda Remotion renders; the docs give qualitative guidance only. — [WebSearch summary of Remotion docs](https://www.remotion.dev/docs/compare-ssr)

### Inferences
- For a talking-head SaaS rendering many 1–10 minute clips, Lambda compute is cents per video. The dominant costs are more likely the Remotion Automators license (Q3), S3 egress for large source footage, and the extra cost of video-in-video, which Remotion flags.
- For long talking-head sources, chunked Lambda renders with `<Video>` from MP4/MOV avoid downloading the whole file per chunk. MKV/WebM sources should be remuxed to MP4 first because of the Matroska audio-extraction cost.
- Data residency: Remotion Lambda runs in AWS regions. If the system must render inside mainland China (阿里云/腾讯云), Lambda is not directly usable, and you would self-host the Node renderer on containers (no built-in distribution) or build custom chunking. This is an inference; I found no Remotion documentation for Chinese clouds.

### Gaps
- No independent, reproducible benchmark exists for a 1080p or 4K talking-head source with overlays in Remotion (frames per second per vCPU). The user will need to run `npx remotion benchmark` on representative footage.
- No published Remotion cost data for 9:16 1080×1920 social video specifically.

---

## Q3. Remotion: license terms, pricing, and what they mean for a commercial SaaS

### Takeaway
Remotion is **source-available, not open source**. It is free for individuals, for-profit organizations with **up to 3 people**, non-profits and evaluation. Anyone else needs a Company License. An automated pipeline, SaaS or Player-based editor falls under **"Remotion for Automators": $0.01 per render with a $100/month minimum**. Manual creation falls under "Creators": $25 per seat per month. Enterprise starts at $500/month. Building an LLM-generates-Remotion-code SaaS is explicitly allowed. Letting users upload their own Remotion code for rendering is forbidden. Remotion 5.0 will count contractors toward headcount and make license keys and telemetry mandatory for Automators.

### Cited Findings
- **Free License eligibility:** "an individual; a for-profit organization with up to 3 employees; a non-profit or not-for-profit organization; evaluating whether Remotion is a good fit, and are not yet using it in a commercial way." Free-license users may use it "non-commercially or commercially". It is "not allowed to copy or modify Remotion code for the purpose of selling, renting, licensing, relicensing, or sublicensing your own derivate of Remotion." — [Remotion LICENSE.md](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md)
- The free license allows running an automation or launching a SaaS: "If you are [eligible], you don't need to buy a license - even if you set up an automation, launch a SaaS, or are using it commercially." — [License FAQ](https://www.remotion.dev/docs/license/faq)
- Headcount means total company headcount: "Our company has 20 people, but only one uses Remotion. Do we need a Company License? Yes." — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **Pricing:**
  - Remotion for Automators: "$0.01 per render, $100/mo minimum" (10,000 renders = $100), for "video editors, prompt-to-video apps" and embedding the Player; developers on automation projects do not need seats.
  - Remotion for Creators: "$25/mo per seat".
  - Enterprise: "Starting at $500 per month", which adds a private Slack/Discord/Teams channel, monthly consulting, custom terms, compliance forms and the Editor Starter.
  
  — [remotion.pro/license](https://www.remotion.pro/license)
- When both Automators and Creators are active, "a combined minimum spend of $100 per month applies". The Enterprise baseline is the same as the Company License "but with a minimum spend of $500". — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **What counts as an automation:** owning code that programmatically calls `renderMedia()`, `renderStill()`, `renderFrames()`, `renderMediaOnLambda()`, Cloud Run, Vercel, `renderMediaOnWeb()`, `npx remotion render`, or the `<Player>`. "In practice, organizations building video editors, prompt-to-video tools, automated video pipelines or using the Remotion Player will fall under Remotion for Automators." — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **One render** is "the successful generation of a video, audio, GIF, still image or image sequence". An image sequence counts as one render, and previews in Studio or the Player do not count. — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **SaaS boundary:** "Allowing users to create and render their own personalized video based on your Remotion template" is acceptable. "Allowing users to submit any Remotion video, meaning a Remotion project, to your server for rendering" is unacceptable. — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **LLM-generated code:** "Yes, it is allowed to build a service that generates Remotion code using artificial intelligence and renders it. Your customers can be other companies and they don't need to have a Company License. Allowing end-users to edit the Remotion code is also permitted if the code was initially generated by your service. However, it is not allowed to let users bring or upload their own Remotion code." — [License FAQ](https://www.remotion.dev/docs/license/faq)
- Agencies: headcount aggregates when the client owns or operates the Remotion project, or when contractors operate it on the same project. — [License FAQ](https://www.remotion.dev/docs/license/faq)
- Remotion is "source-available software, but it is not open source software according to the OSI". The license does not cover codec patent fees for H.264, HEVC or AAC. — [License FAQ](https://www.remotion.dev/docs/license/faq)
- **Telemetry:** server-side rendering sends telemetry only when a license key is set. Client-side rendering "always" sends an event per render, including the page domain and the end user's IP. "In Remotion 5.0, it becomes obligatory for companies which are under the 'Remotion for Automators' option to set the `licenseKey` field and opt into telemetry." — [Telemetry](https://www.remotion.dev/docs/telemetry)
- Cloud rendering by licensed companies must be covered by an Automators plan. — [Cloud Run docs: License](https://www.remotion.dev/docs/cloudrun)
- **Remotion 5.0 license changes (draft):** contractors count toward team size, the company license is tied to new Terms and Conditions, and it restates the prohibition on operating a "bring-your-own-code rendering service". The PR is unmerged as of Oct 2026. — [PR #3750](https://github.com/remotion-dev/remotion/pull/3750)
- The Editor Starter and Timeline are governed by the Remotion License plus their own licenses. Larger companies must subscribe to the Company License. — [Editor Starter](https://www.remotion.dev/docs/editor-starter); [Timeline](https://www.remotion.dev/docs/timeline)

### Inferences
- **Cost model for the user's system.** As a team of 3 or fewer people, Remotion is free even for a commercial SaaS. At 4 or more people, including contractors once 5.0 lands, budget **max($100, $0.01 × renders) per month**: 50k renders a month is about $500 a month. Re-renders count, though Player previews do not. That is modest against cloud compute and TTS/ASR costs, but it is a recurring per-render fee that HyperFrames (Apache-2.0) does not have.
- An "LLM agent writes the composition, then the server renders it" architecture is explicitly permitted. A feature where users upload their own Remotion projects is not.
- Using client-side rendering in a China-facing product sends per-render telemetry, including end-user IPs, to Remotion (Switzerland). That has privacy policy and PIPL implications, which is a legal inference worth checking with counsel.

### Gaps
- remotion.pro does not state whether failed or partial renders are billed (the FAQ says "successful generation"), how retries count, or volume discounts beyond "custom pricing" at Enterprise.
- The final Remotion 5.0 license text and release date are not yet published.

---

## Q4. HyperFrames: what it is, release, license, architecture, time model, CLI and agent-first design

### Takeaway
HyperFrames is HeyGen's **Apache-2.0** HTML-to-video framework, at **github.com/heygen-com/hyperframes** ("Write HTML. Render video. Built for agents."). It was publicly launched **2026-04-16**. Compositions are plain HTML with `data-*` timing attributes plus seekable animation (GSAP, CSS, WAAPI, Lottie, Three.js and others via frame adapters). Rendering is seek-driven: headless Chrome is seeked frame by frame and captured with `HeadlessExperimental.beginFrame`, then FFmpeg encodes. It needs no build step and ships 7 agent skills and about 450 catalog blocks. Current version: **0.8.208 on npm (2026-10-27)**, with several releases a day.

### Cited Findings
**Identity, dates and license**
- Repo `heygen-com/hyperframes`: "Write HTML. Render video. Built for agents."; homepage hyperframes.heygen.com; license **Apache-2.0**; **73,664 stars**, 6,679 forks and about 172 open issues (2026-10-27). The repo was created 2026-03-10. Topics include ai-agents, gsap, html-to-video, mcp, puppeteer and claude-code. — [GitHub repo](https://github.com/heygen-com/hyperframes) (GitHub search API)
- npm `hyperframes`: first version 0.1.0 published 2026-03-23. `latest` = **0.8.208** (2026-10-27 11:53 UTC), and there are 561 versions in total. Ten releases (0.8.199 to 0.8.208) shipped between Oct 25 and 27. Other dist-tags: `alpha`, `desktop`, `hdr`. — [npm registry: hyperframes](https://registry.npmjs.org/hyperframes)
- The docs changelog already lists **v0.8.209 "Released - 2026-10-27"**. — [HyperFrames changelog](https://hyperframes.heygen.com/changelog)
- **Public launch: 2026-04-16.** HeyGen's X post is decoded to 2026-04-16 17:17 UTC from its snowflake ID: "We built our launch video in Claude Code using HyperFrames. Now it's yours. Open source, agent-native framework. HTML to MP4. `$ npx skills add heygen-com/hyperframes`". — [HeyGen on X](https://x.com/HeyGen/status/2044827454460871072)
- Joshua Xu (HeyGen CEO) post on launch day: "We believe HTML is the future format of video." — [Joshua Xu on X](https://x.com/joshua_xu_/status/2044894037510131727)
- Aggregators conflict on the launch date: some say April 17, and one cites a May 20 post. The X post IDs above are the primary evidence. Aggregator claims of "~7.5k stars in its first day" and "~32.5K stars" by mid-2026 are unverified. — [WebSearch aggregate (aitoolly, traeai, noqta)](https://www.noqta.tn/en/blog/heygen-hyperframes-html-to-mp4-ai-agent-video-2026)
- npm downloads for 2026-06-02 to 2026-07-01: `hyperframes` CLI 1,402,597 and `@hyperframes/core` 117,098. — [npm downloads API: hyperframes](https://api.npmjs.org/downloads/point/last-month/hyperframes); [@hyperframes/core](https://api.npmjs.org/downloads/point/last-month/@hyperframes/core)
- FAQ: "Is HyperFrames free? Yes. The framework, CLI, and skills are open source under Apache 2.0, and rendering on your own computer is free and needs no account." The README adds: "Apache 2.0 license, with no per-render fees or commercial-use thresholds." — [FAQ](https://hyperframes.heygen.com/faq); [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)

**Architecture and authoring model**
- "An open-source framework for turning HTML, CSS, media, and seekable animations into deterministic MP4 videos." Clips are HTML elements with `class="clip"`, `data-start`, `data-duration` and `data-track-index`. A paused GSAP timeline is registered on `window.__timelines`. "The renderer seeks each frame in headless Chrome and encodes the result with FFmpeg." — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- Packages:
  - `hyperframes` (CLI)
  - `@hyperframes/core` (types, parsers, linter, runtime, frame adapters)
  - `@hyperframes/engine` (seekable capture with Puppeteer and FFmpeg)
  - `@hyperframes/producer` (capture, encode, audio mix)
  - `@hyperframes/studio`
  - `@hyperframes/player` (the `<hyperframes-player>` web component)
  - `@hyperframes/shader-transitions` (WebGL)
  - `@hyperframes/aws-lambda`
  
  Requirements are Node.js 22+ and FFmpeg. — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- Supported animation runtimes: "GSAP, CSS, Lottie, Three.js, Anime.js, WAAPI, or your own frame adapter". "No build step: an `index.html` composition plays as-is." — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- **Time and seeking model:** "Rendering never plays your video. It asks for one frame at a time." Time = `floor(frame)/fps` (integer math, never a clock). The frame adapter's `seekFrame(frame)` moves every animation; GSAP timelines are "paused and seeked, never played". Chrome's `HeadlessExperimental.beginFrame` captures the frame "in one atomic operation"; FFmpeg encodes and mixes audio from `<audio>`/`<video>`. — [Deterministic rendering](https://hyperframes.heygen.com/concepts/determinism)
- Determinism rules: no `Date.now()`/`requestAnimationFrame`/timers, no unseeded `Math.random()`, no mid-render fetches, fixed size and fps, finite length. For exact reproducibility use `render --docker`, which "pins the Chromium version, the font set, and the FFmpeg encoder". — [Deterministic rendering](https://hyperframes.heygen.com/concepts/determinism)
- The engine requires a page that exposes `window.__hf` with `duration` and a deterministic `seek(time)`. It also provides browser pooling, encoders (MP4, WebM, MOV, GIF, PNG sequence), media extraction ("preparing source video frames and audio tracks") and parallel capture across workers. — [@hyperframes/engine](https://hyperframes.heygen.com/packages/engine)
- Source video handling: frames are extracted ahead of capture and injected. The changelog mentions:
  - "Injected video frames are extracted once per output frame"
  - "A render no longer decodes the videos it replaces with extracted frames"
  - "The video frame cache budget is shared by the capture workers"
  - "Extract HDR video frames a window at a time to bound scratch disk"
  - "On a Mac, video frames for a render decode on the media engine"
  
  — [Changelog](https://hyperframes.heygen.com/changelog)
- Preview creates cached browser proxies for local video Chrome cannot decode reliably ("common HEVC and ProRes inputs"); "the original file stays in the project and remains the render source". — [Rendering guide](https://hyperframes.heygen.com/guides/rendering)
- Output formats: MP4, WebM and MOV (including transparent), GIF, PNG sequence and HLS. `--resolution 4k` supersamples a 1080p composition at a higher device-pixel ratio. — [Rendering guide](https://hyperframes.heygen.com/guides/rendering); [4K rendering](https://hyperframes.heygen.com/guides/4k-rendering)

**CLI and agent-first design**
- CLI: `npx hyperframes init | preview | lint | check | render | add | transcribe | benchmark | cloud | lambda | cloudrun | doctor | skills`. "The CLI is non-interactive by default." — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md); [CLI reference](https://hyperframes.heygen.com/packages/cli)
- **7 skills.** The core set is `/hyperframes` (render contract, references for captions, overlays, motion and look), `/hyperframes-cli`, `/hyperframes-registry` ("About 450 ready-made blocks and components… transitions, overlays, titles, kinetic type, captions, charts, maps, 3D, camera moves") and `/media-use`. On-demand skills are `/figma`, `/slideshow` and `/remotion-to-hyperframes`. — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- Install with the Claude Code plugin (`claude plugin marketplace add heygen-com/hyperframes`) or `npx skills add heygen-com/hyperframes`. It works with Claude Code, Codex, Cursor, Gemini CLI, Copilot, Antigravity, IBM Bob and OpenCode. A hosted connector (MCP) lets Claude.ai and ChatGPT create and render in your HeyGen account. — [FAQ](https://hyperframes.heygen.com/faq); [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- The linter has a large rule set aimed at agent mistakes. For example, it errors when GSAP animates layout properties (`left`/`top`/`fontSize`), which "stutter under frame capture", when a font family has no `@font-face`, and when caption containers clip scaled words. — [Lint rules](https://hyperframes.heygen.com/reference/lint-rules)
- Editing maps NLE verbs to attribute edits ("Move → `data-start`", "Trim → `data-duration`", "Trim front → `data-media-start`", "Level → `data-volume`"), so agent edits are small and inspectable. — [Editing existing videos](https://hyperframes.heygen.com/prompting/editing-existing-videos)
- There is a template-variable system (`data-composition-variables`, `--variables`, `--strict-variables`) and batch rendering. — [Cloud rendering](https://hyperframes.heygen.com/deploy/cloud); [AWS Lambda](https://hyperframes.heygen.com/deploy/aws-lambda)
- Other surfaces: Studio (browser editor), a native Studio desktop app (Mac, Windows, Linux), the hyperframes.dev playground, and frame.md design-system templates. — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md); [FAQ](https://hyperframes.heygen.com/faq)

**Captions, talking-head and audio features**
- There is a built-in talking-head captions guide: "Give it your talking-head, interview or podcast clip. You get captions timed to the words, designed cards… or a tighter cut with the long pauses removed." It covers the "rail" (verbatim captions), the "embed" (one word matted behind the speaker), keyword emphasis, lower thirds and PiP. It warns: cut first, then caption, and multi-subject clips make behind-speaker text flicker. — [Captions and recuts](https://hyperframes.heygen.com/guides/captions-and-recuts)
- `hyperframes transcribe` runs locally and is free. The ASR engine is `auto` (Parakeet if installed and the language is one of its 25, else Whisper), `parakeet` or `whisper`. The default Whisper model is `small.en`, and multilingual models include `small`, `medium` and `large-v3`. It takes `--language`, imports SRT, VTT and OpenAI JSON, and exports SRT/VTT "with cues for languages without spaces grouped". — [CLI reference](https://hyperframes.heygen.com/packages/cli); [Voice and audio](https://hyperframes.heygen.com/guides/voice-and-audio)
- CJK fixes in the changelog: "Keep whisper CJK tokens as separate timed words" (#6058) and "Keep phrase-level CJK and Thai transcripts as separate cues" (#3436). — [Changelog](https://hyperframes.heygen.com/changelog)
- Free versus HeyGen tiers. Free: Kokoro TTS voices, your own music, a bundled SFX set plus Openverse, local Parakeet or Whisper. With HeyGen: HeyGen voices and cloned voice, a "10,000-track catalog", and HeyGen transcription in the Studio app. — [Voice and audio](https://hyperframes.heygen.com/guides/voice-and-audio)
- Audio: `<audio>` and `<video>` with `data-volume`, `loop`, and voiceover "carve" ducking. — [Voice and audio](https://hyperframes.heygen.com/guides/voice-and-audio)

### Inferences
- The authoring model, a static HTML file with declarative timing attributes, gives an LLM a smaller, flatter target than a bundled React project. It is also easy to diff and patch programmatically, which suits an "agent edits the timeline" architecture.
- For Chinese talking-head captions, HyperFrames already handles CJK token and cue grouping in its transcription pipeline. The default `small.en` model must be overridden (`--model large-v3 --language zh`). Production would likely use a dedicated Chinese ASR (FunASR/Paraformer, or a cloud ASR) and import its JSON or SRT, which `transcribe` accepts.

### Gaps
- I could not read the GitHub API for contributors and release counts: the session's GitHub access excluded this repo. Contributor numbers are unknown.
- I found no HeyGen engineering blog post with architectural detail beyond the docs. The X launch article ([link](https://x.com/liu8in/article/2044827628700684463)) was not retrievable in full.
- The list of Parakeet's "25" languages is not stated on the docs pages I read, so whether Chinese routes to Parakeet is unconfirmed. It probably falls back to Whisper.

---

## Q5. HyperFrames: performance, distributed rendering, maturity, HeyGen relationship, known limitations

### Takeaway
HyperFrames ships local, Docker, AWS Lambda (Step Functions fan-out, up to 256 chunks), Google Cloud Run, and paid HeyGen cloud rendering. Published performance data is thin. The docs give a 300-frame 1080p composition rendered in 9.8 s (25 s with one expensive CSS rule), and one single-run agent comparison against Remotion. The project is about 6 months old and very active, with multiple releases a day and stars past Remotion's. Its Lambda path is self-described as "newer" than Remotion's. It is used in production at HeyGen and by a handful of adopters, and HeyGen monetizes it through optional voices, avatars, music and cloud credits.

### Cited Findings
- Performance data point: "25.0s against 9.8s, taken as the median of three runs at 1920x1080 over 300 frames. One CSS declaration is the whole difference." The machine is unspecified. — [Performance guide](https://hyperframes.heygen.com/guides/performance); [FAQ](https://hyperframes.heygen.com/faq)
- Expensive features are large `backdrop-filter` and `filter: blur()` layers, many shadowed animated elements and oversized images. "Render is slow but the result is correct" points to source-video extraction, frame capture or encoding. VP9/WebM is CPU-heavy. There is a `--quality draft` mode for review. — [Performance guide](https://hyperframes.heygen.com/guides/performance)
- Single-run agent benchmark by HeyGen (same prompt, Claude Code with Opus 5.5, no retries): time to rendered MP4 was Remotion 12 min 30 s versus HyperFrames 11 min 50 s. Remotion wrote 10 TS files (1,037 lines) and HyperFrames 4 HTML files (822 lines). Remotion installed about 950 MB of `node_modules`, HyperFrames none. HeyGen itself says "a single run decides nothing about quality". — [HyperFrames vs Remotion guide](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)
- **AWS Lambda:** "one Lambda function fronts a Step Functions standard workflow that fans renders out across many parallel chunk workers" (Plan → Map(N) RenderChunk → Assemble, artifacts in S3). It is deployed with `hyperframes lambda deploy`, which runs on SAM, with a CDK construct also available. By default each render uses up to 90% of unreserved account concurrency, at most 256 chunks. Plan and render chunks run on an arm64 container image by default; audio and assemble run on x86. `--wait` streams "per-chunk progress + accrued cost". Batch rendering from JSONL is supported, with a 256 KiB Step Functions input cap. — [AWS Lambda deploy](https://hyperframes.heygen.com/deploy/aws-lambda)
- `@hyperframes/aws-lambda` was first published 2026-05-17 and `@hyperframes/gcp-cloud-run` on 2026-06-07. — [npm: @hyperframes/aws-lambda](https://registry.npmjs.org/@hyperframes/aws-lambda); [npm: @hyperframes/gcp-cloud-run](https://registry.npmjs.org/@hyperframes/gcp-cloud-run)
- The README rates distributed rendering as "Local and AWS Lambda render paths" for HyperFrames versus "Remotion Lambda, mature cloud renderer". The comparison guide calls Remotion Lambda "a mature, heavily documented rendering system" and HyperFrames' "newer". — [README](https://github.com/heygen-com/hyperframes/blob/main/README.md); [HyperFrames vs Remotion guide](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)
- **HeyGen cloud rendering:** `hyperframes cloud render` bills HeyGen credits; "4K is billed at 1.5×". The project archive limit is 200 MB. Media files of 5 MB or more "upload as HeyGen assets and are referenced by public, unsigned URL". It supports webhooks with `--callback-url`. — [Cloud rendering](https://hyperframes.heygen.com/deploy/cloud)
- Telemetry: "The CLI sends usage data, such as command names and render performance, which stays anonymous until you sign in. It never sends project names or video content." It can be disabled with `npx hyperframes telemetry disable`. — [FAQ](https://hyperframes.heygen.com/faq)
- **HeyGen relationship:** HeyGen is listed as an adopter that "Powers AI-generated video composition and rendering across HeyGen's video product surface". The avatar presenter guide puts a HeyGen avatar on screen with HyperFrames building scenes and captions around it; avatars need a HeyGen account and credits. — [Adopters](https://hyperframes.heygen.com/community/adopters); [Avatar presenter](https://hyperframes.heygen.com/guides/avatar-presenter)
- "HyperFrames does not use or run Remotion"; it is "inspired by Remotion". — [FAQ](https://hyperframes.heygen.com/faq); [README](https://github.com/heygen-com/hyperframes/blob/main/README.md)
- **Admitted limitations:** Remotion is "older and much more established", with "more templates, more tutorials, more answered questions". HyperFrames requires following determinism rules or it "breaks quietly". — [HyperFrames vs Remotion guide](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)
- Changelog signals of how young the project is:
  - "H265 renders no longer fail on hosts with more than 16 cores"
  - "Keep the rightmost 8 columns of SDR MP4 at widths like 1080" (FFmpeg 7.1/8.0 blacked out the last 8 pixel columns)
  - "Phone videos with an undecodable first audio track check, preview and render"
  - "A composition with no timeline script no longer waits 45 seconds before it renders"
  
  — [Changelog](https://hyperframes.heygen.com/changelog)
- Exact pixels can still vary "with Chrome, fonts, codecs, GPU behavior, and the host environment". — [@hyperframes/engine](https://hyperframes.heygen.com/packages/engine)
- Third-party first-hand test (woshipm, 2026-06-06), Chinese talking-head effects, same video and prompt in Claude Code: Remotion's finished pass took 7 minutes versus 14 for HyperFrames. Remotion produced a full video of about 1:24 for $43 in tokens, while HyperFrames stopped half-finished after $28. HyperFrames overlay text covered the presenter, seconds 10–36 had no motion, and Google Fonts missing locally made text garbled. The author concluded they would not use HyperFrames again "如果没有大的技术革新". The setup was asymmetric: the author had built a custom HyperFrames skill but used no Remotion skill. — [woshipm: 用了 Remotion，我再也不想碰 Hyperframes](https://www.woshipm.com/ai/6408883.html)

### Inferences
- HyperFrames' release cadence (several npm releases a day, version 0.x) means fast fixes but also churn. Pin versions and use Docker renders for a production pipeline.
- The cloud-render behavior of hosting ≥5 MB media at public, unsigned URLs is a privacy concern for unreleased creator footage. Self-hosted Lambda, Cloud Run or Docker avoids it.
- Agent-authoring results conflict between HeyGen's own single run, which slightly favored HyperFrames, and a Chinese practitioner's single run, which strongly favored Remotion. Neither is controlled, so the user should A/B test on their own footage and prompts.

### Gaps
- No published HyperFrames Lambda cost per minute of video, and no benchmark for long 1080p or 4K talking-head sources with overlays.
- Contributor counts, issue-resolution times and bus factor could not be verified (GitHub API blocked for this repo in the session).
- I found no Hacker News thread with substantive critique.

---

## Q6. Head-to-head: authoring, LLM-friendliness, determinism, speed, cloud, audio, captions, video-in-video, licensing, ecosystem, Chinese fonts and emoji

### Takeaway
Both engines use the same core pipeline: headless Chrome frame capture, then FFmpeg, with frame-accurate seeking. The real differences:
- **Authoring:** React with a bundler (Remotion) versus plain HTML with no build (HyperFrames).
- **License:** a per-render fee above 3 people (Remotion) versus Apache-2.0 (HyperFrames).
- **Maturity:** Remotion's six years, Lambda, Player, caption packages and proven $1M+ ARR customers, versus HyperFrames' six months of rapid growth, agent-native tooling and talking-head caption workflows.

For the user's case, overlays on real talking-head footage plus script-driven generation, driven by an LLM, both are viable. Remotion is the lower-risk choice for production scale and a typed data-driven template system; HyperFrames is the cheaper, more agent-native option if licensing cost or LLM free-form authoring dominates.

### Cited Findings (comparison matrix)
| Dimension | Remotion | HyperFrames |
|---|---|---|
| Authoring | React/TSX; component = f(frame); `<Composition>`, `<Sequence>`, `interpolate`, `spring` ([HF vs Remotion](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)) | HTML + `data-start/duration/track-index` + paused GSAP/CSS/WAAPI/Lottie timeline; no build step ([README](https://github.com/heygen-com/hyperframes/blob/main/README.md)) |
| Build | "Bundler required" ([HF README comparison table](https://github.com/heygen-com/hyperframes/blob/main/README.md)) | "`index.html` plays as-is" ([README](https://github.com/heygen-com/hyperframes/blob/main/README.md)) |
| Determinism | Pure function of frame number, "genuinely simpler to hold in your head" (HeyGen's own assessment) ([HF vs Remotion](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)) | Seek-driven via adapters; rules on no wall clock, no unseeded random, no mid-render fetch; Docker pins Chrome, fonts and FFmpeg ([Determinism](https://hyperframes.heygen.com/concepts/determinism)) |
| Third-party animation libs | "Wall-clock animation patterns need care" ([HF README](https://github.com/heygen-com/hyperframes/blob/main/README.md)); must rewrite as frame-based React ([HF vs Remotion](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)) | GSAP, Lottie and WAAPI "usually drop in close to as-is" ([HF vs Remotion](https://hyperframes.heygen.com/guides/hyperframes-vs-remotion)) |
| Agent tooling | Official Agent Skills (10), plugins for Claude Code, Codex, Cursor, Copilot and Kimi; MCP shut down 2026-10-26; `.md` docs and llms.txt; JIT compile guide ([Skills](https://www.remotion.dev/docs/ai/skills), [Plugins](https://www.remotion.dev/docs/ai/plugins), [MCP](https://www.remotion.dev/docs/ai/mcp), [JIT](https://www.remotion.dev/docs/ai/dynamic-compilation)) | 7 skills incl. registry of about 450 blocks; Claude Code plugin; hosted MCP connector for Claude.ai and ChatGPT; agent-oriented linter; `remotion-to-hyperframes` migration skill ([README](https://github.com/heygen-com/hyperframes/blob/main/README.md), [FAQ](https://hyperframes.heygen.com/faq), [Lint rules](https://hyperframes.heygen.com/reference/lint-rules)) |
| LLM training-data familiarity | Years of public examples; a Chinese practitioner says "Remotion 出现多年，大模型训练语料里相关内容更多" ([woshipm](https://www.woshipm.com/ai/6408883.html)) | Launched Apr 2026; relies on plain HTML/GSAP knowledge plus skills ([HeyGen X](https://x.com/HeyGen/status/2044827454460871072)) |
| Distributed rendering | Lambda: chunked, max 200 functions, mature; Vercel Sandbox; Cloud Run alpha (not developed) ([Concurrency](https://www.remotion.dev/docs/lambda/concurrency), [Cloud Run status](https://www.remotion.dev/docs/cloudrun/status)) | Lambda via Step Functions (up to 256 chunks), Cloud Run, HeyGen cloud (credits), Docker ([AWS Lambda](https://hyperframes.heygen.com/deploy/aws-lambda), [Cloud](https://hyperframes.heygen.com/deploy/cloud)) |
| Published cost | $0.017 for 1 min; $0.103 for 10 min HD; $0.013 for 10 s 4K (Lambda compute) ([Cost example](https://www.remotion.dev/docs/lambda/cost-example)) | None published; CLI shows "accrued cost" ([AWS Lambda](https://hyperframes.heygen.com/deploy/aws-lambda)) |
| Video-in-video | `@remotion/media` `<Video>` (WebCodecs, partial download, "Fastest"); fallback to `<OffthreadVideo>` (Rust + FFmpeg) for HEVC and other codecs; CORS required ([Video tags](https://www.remotion.dev/docs/video-tags)) | Pre-extracts source frames with FFmpeg and injects them, with a frame cache shared across workers; proxies HEVC/ProRes for preview only ([Changelog](https://hyperframes.heygen.com/changelog), [Rendering](https://hyperframes.heygen.com/guides/rendering)) |
| Audio | `<Audio>` from `@remotion/media`, volume, `playbackRate`, `toneFrequency`; MP3 option speeds up Lambda ([Video tags](https://www.remotion.dev/docs/video-tags), [Optimizing speed](https://www.remotion.dev/docs/lambda/optimizing-speed)) | `<audio>`/`<video>` with `data-volume`, `loop`, voiceover ducking ("carve"), audio effects ([Voice and audio](https://hyperframes.heygen.com/guides/voice-and-audio)) |
| Word-level captions | `@remotion/captions` (`Caption` type, `createTikTokStyleCaptions`); five transcription back-ends; requires leading whitespace per token ([Captions](https://www.remotion.dev/docs/captions/create-tiktok-style-captions), [Transcribing](https://www.remotion.dev/docs/captions/transcribing)) | `hyperframes transcribe` (Parakeet/Whisper, SRT/VTT/JSON import); caption catalog; CJK token and cue fixes; talking-head caption guide (rail, embed, cards) ([CLI](https://hyperframes.heygen.com/packages/cli), [Captions guide](https://hyperframes.heygen.com/guides/captions-and-recuts), [Changelog](https://hyperframes.heygen.com/changelog)) |
| Chinese fonts | Lambda bundles Noto Sans SC/TC/JP/KR **only on arm64**; recommends webfonts ([Lambda runtime](https://www.remotion.dev/docs/lambda/runtime)) | Lint error if a font lacks `@font-face`; distributed renders disable system-font capture, so fonts must be bundled; producer resolves Google Fonts ([Lint rules](https://hyperframes.heygen.com/reference/lint-rules), [Changelog](https://hyperframes.heygen.com/changelog)); garbled-text report when Google Fonts were missing locally ([woshipm](https://www.woshipm.com/ai/6408883.html)) |
| Emoji | Lambda includes Noto Color Emoji; "Apple Emoji" is a Lambda-only feature ([Lambda runtime](https://www.remotion.dev/docs/lambda/runtime), [Compare SSR](https://www.remotion.dev/docs/compare-ssr)) | Caption "emoji-pop" registry component ([Changelog](https://hyperframes.heygen.com/changelog)); no documented emoji font guarantees found |
| Preview / embed | Remotion Player (counts as automation under the license), Studio, client-side rendering stable since 4.0.491 ([License FAQ](https://www.remotion.dev/docs/license/faq), [CSR](https://www.remotion.dev/docs/client-side-rendering)) | `<hyperframes-player>` web component, Studio browser editor, desktop app ([README](https://github.com/heygen-com/hyperframes/blob/main/README.md)) |
| License | Source-available; free for 3 or fewer people; Automators $0.01/render, $100/mo minimum; Creators $25/seat/mo ([LICENSE](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md), [remotion.pro](https://www.remotion.pro/license)) | Apache-2.0; "no per-render fees or commercial-use thresholds" ([README](https://github.com/heygen-com/hyperframes/blob/main/README.md)) |
| Telemetry | License-key telemetry; mandatory for Automators in 5.0 ([Telemetry](https://www.remotion.dev/docs/telemetry)) | Anonymous CLI usage telemetry, can be disabled ([FAQ](https://hyperframes.heygen.com/faq)) |
| Community size | 68.1k stars, since 2020; npm `remotion` 4.87M downloads (Jun 2026) ([GitHub](https://github.com/remotion-dev/remotion), [npm](https://api.npmjs.org/downloads/point/last-month/remotion)) | 73.7k stars, since Mar/Apr 2026; npm `hyperframes` 1.40M downloads (Jun 2026) ([GitHub](https://github.com/heygen-com/hyperframes), [npm](https://api.npmjs.org/downloads/point/last-month/hyperframes)) |

### Inferences
- **(a) Overlays, zooms and B-roll on real 口播 footage.** Both handle frame-accurate source video. Remotion's path is better documented and benchmarked for distributed rendering of long sources (chunked Lambda plus partial-download `<Video>`). HyperFrames pre-extracts frames, which is robust for any codec FFmpeg reads (HEVC phone footage) but costs scratch disk and extraction time on long 4K sources. Both engines treat zooms and punch-ins as CSS transforms on a wrapper; HyperFrames explicitly says to "animate a wrapper around it, not the video itself" ([Video components](https://hyperframes.heygen.com/guides/video-components)). For a system that does most cutting in FFmpeg (silence removal, jump cuts) and uses the browser engine only for overlays, either engine can render a transparent overlay track (WebM/MOV alpha) to composite later. That cuts render cost dramatically, because the browser then never decodes the camera footage.
- **(b) Script-driven 文案视频 (TTS + visuals + captions).** These are template-driven and data-heavy. Remotion's typed `inputProps` and React component reuse fit a fixed, productized template library. HyperFrames' variables (`data-composition-variables`) and about 450 registry blocks fit agent-authored, one-off designs.
- **(c) LLM or agent control.** HyperFrames' flat HTML and attribute-level edits are easier to generate and patch deterministically, and the Apache license removes per-render cost. Remotion has the larger training corpus and a stable API surface, and its license explicitly allows LLM-generated code SaaS. The two available single-run tests conflict, so a controlled bake-off is advisable.
- **Chinese rendering.** For either engine, bundle CJK fonts as project assets (for example Noto Sans SC, Source Han Sans / 思源黑体, or licensed commercial fonts) rather than relying on system fonts. On Remotion Lambda, use arm64 if you rely on bundled Noto CJK. Note Chinese commercial font licensing (方正, 汉仪) separately.
- **Licensing.** For a team of 4 or more running a high-volume SaaS, Remotion's per-render fee is a real but modest line item: about $1,000/month at 100k renders. For a small team (3 or fewer people) Remotion is free, so licensing alone does not decide the choice.

### Gaps
- No controlled, third-party benchmark compares the two engines' render throughput on identical 1080p or 4K talking-head compositions.
- No documented test of Chinese plus emoji glyph coverage in either engine's Docker image or Lambda runtime beyond Remotion's font list.
- Neither project documents China-region cloud deployment.

---

## Q7. Production users, case studies, and open-source projects built on each

### Takeaway
Remotion has well-known revenue-scale users in exactly the user's category, AI shorts and caption tools, plus a deep OSS ecosystem. Examples: Submagic ($1M ARR within 3 months), Crayo ($6M/yr), Revid.ai, AIVideo.com and Typeframes. Several 2026 Chinese-platform-oriented agent skills render with Remotion. HyperFrames has HeyGen itself, tldraw, reap.video and others, and fast-growing agent projects such as OpenMontage and video-use use both engines.

### Cited Findings
**Remotion production users (from Remotion's own Success Stories page; figures as reported by Remotion)**
- Submagic, an AI shorts and captions tool: "reached $1M ARR… only 3 months after launching – that was in 2023", with "over 3 million users". — [Remotion Success Stories](https://www.remotion.dev/success-stories)
- AIVideo.com: "$1 million revenue per year in less than a year". Revid.ai: "$1M ARR in just 15 months". Crayo.ai: video stories generator "generating over half a million dollars per month", with "over 2 million users". — [Remotion Success Stories](https://www.remotion.dev/success-stories)
- Typeframes (text-to-product-video) uses "the Remotion Player to give our users a real-time preview… and when it comes to actually rendering the videos, that's where Remotion Lambda comes in" (interview dated Nov 9, 2023). — [Remotion Success Stories](https://www.remotion.dev/success-stories)
- GitHub Unwrapped (year-in-review videos) is built by Remotion: `remotion-dev/github-unwrapped`, 1,328 stars. — [GitHub](https://github.com/remotion-dev/github-unwrapped)

**Open-source projects on Remotion (stars as of 2026-10-27)**
- `gyoridavid/short-video-maker` (1,438★): TikTok, Reels and Shorts generator via MCP and REST. It uses TTS, Whisper captions (whisper.cpp `tiny.en`) and background video, and "composes all elements with Remotion". — [GitHub](https://github.com/gyoridavid/short-video-maker)
- `calesthio/OpenMontage` (72,385★): an "open-source, agentic video production system" with "12 production pipelines". Its showcase pieces use "TikTok-style word-level captions, and Remotion composition", and one piece uses "a bespoke HyperFrames composition". — [GitHub](https://github.com/calesthio/OpenMontage)
- `Vincentwei1021/video-shotcraft` (14,032★): a Claude Code/Codex skill for promo videos with Remotion, with "JianYing (CapCut CN) export". — [GitHub](https://github.com/Vincentwei1021/video-shotcraft)
- `Vincentwei1021/anything2explainer` (2,782★): topic in, narrated explainer out, with TTS voiceover and subtitles, "Chinese or English; every frame drawn in code with Remotion". — [GitHub](https://github.com/Vincentwei1021/anything2explainer)
- `Vincentwei1021/video-talkcraft` (1,811★): voiceover-driven explainer videos with "word-level voiceover sync" and Remotion rendering. — [GitHub](https://github.com/Vincentwei1021/video-talkcraft)
- `Agents365-ai/video-podcast-maker` (1,702★): topic to 4K narrated video, with local TTS and a Remotion composition, targeting "Bilibili/YouTube/Xiaohongshu/Douyin/WeChat Channels". — [GitHub](https://github.com/Agents365-ai/video-podcast-maker)
- `0xsline/OpenChatCut` (2,719★): local-first conversational AI video editor with a multi-track timeline, MCP and Remotion rendering. — [GitHub](https://github.com/0xsline/OpenChatCut)
- Others: `digitalsamba/claude-code-video-toolkit` (2,356★), `trykimu/videoeditor` (2,279★), `openvideodev/react-video-editor` (1,824★, a "Capcut and canva clone"), and `Remocn/remocn` (1,650★, animations and transitions library). — [GitHub topic: remotion](https://github.com/topics/remotion)

**HyperFrames adopters (self-reported via ADOPTERS.md)**
- HeyGen: "Powers AI-generated video composition and rendering across HeyGen's video product surface".
- tldraw: "Generates automated pull-request walkthrough videos".
- reap.video: "Powers agent-first AI video clipping, editing, and rendering".
- Typeframe.app: "Renders speech videos… with word-timed typing captions".
- THU-MAIC OpenMAIC: one-click MP4 export.
- PandaStudio: "motion graphics, animated captions, and overlays for MP4 exports in its desktop video editor".
- Skyflo, Mini Course Generator.
- Evaluating: TanStack and OptinMonster.

— [HyperFrames Adopters](https://hyperframes.heygen.com/community/adopters)

**Open-source projects on HyperFrames**
- `browser-use/video-use` (29,945★), "Edit videos with coding agents": "Generates animation overlays via HyperFrames, Remotion, Manim, or PIL — spawned in parallel sub-agents". Its pipeline is Transcribe, Pack, LLM Reasons, EDL, Render, Self-Eval. — [GitHub](https://github.com/browser-use/video-use)
- `latent-spaces/brag` (18,998★): one-command launch videos, topic `hyperframes`. — [GitHub](https://github.com/latent-spaces/brag)
- `nexu-io/html-anything` (9,262★): an agentic HTML editor with a "Hyperframes" surface and XHS (小红书) outputs. — [GitHub](https://github.com/nexu-io/html-anything)
- `xiejunjie524/handdraw-story-video` (795★), `huytranvan2010/AI-auto-generate-video` (445★), and `heygen-com/hyperframes-launches` (637★, HeyGen's own launch-video compositions). — [GitHub search: hyperframes](https://github.com/search?q=hyperframes&type=repositories)

### Inferences
- The closest commercial analogues to the user's product (Submagic, Revid, Crayo: AI shorts, captions, story videos) are Remotion customers. That is evidence Remotion scales for this exact workload, though their Remotion license cost is not public.
- In the newest wave of agent video tools, HyperFrames is common: video-use and OpenMontage support both engines. A pragmatic architecture is an engine-agnostic intermediate representation (EDL or timeline JSON, as video-use does) that compiles to either Remotion props or HyperFrames HTML. That keeps the rendering engine swappable.

### Gaps
- I found no published case studies of Chinese companies on Douyin, 视频号 or 小红书 using either engine at scale. The Chinese-platform evidence is limited to open-source agent skills.
- Revenue figures for Remotion customers come from Remotion's own marketing page and the companies' public statements, not audited data.
