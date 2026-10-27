# Alternatives to Remotion / HyperFrames for Programmatic Video Composition & Rendering (state as of 2026-10-27)

Scope note: Remotion and HyperFrames are covered by another researcher. They appear here only as reference points. All GitHub star counts, last-push dates and licenses were pulled from the GitHub repository search API on 2026-10-27. Package versions and release dates come from the PyPI JSON API and the npm registry on the same day. Each figure cites the repo or package page. Per-minute cost figures marked "(calc)" are my own arithmetic from the vendor's published plan numbers.

---

## Q1. Overall comparison: what are the options, and how do they compare?

### Takeaway
No single open-source alternative matches Remotion/HyperFrames on both maturity and "LLM emits a timeline, server renders an MP4". The practical stack for a Chinese talking-head (口播) pipeline breaks into three layers:
1. **FFmpeg/PyAV/MLT (native, GPU-encodable)** for the heavy cut/concat/overlay/caption burn-in of real footage.
2. **A JSON timeline** as the LLM-facing contract. Options are self-defined, OTIO, MLT XML, or a cloud schema (Aliyun IMS Timeline, Shotstack, Creatomate).
3. **剪映 draft generation** (pyJianYingDraft / capcut-mate / VectCutAPI) when humans need to fine-tune in 剪映.

Commercial JSON render APIs range widely in price. Aliyun IMS costs about ¥0.06/min at 1080p. Shotstack costs $0.05–0.20/min, JSON2Video $0.20–0.42/min, and Plainly/Bannerbear $1–6/min.

### Cited Findings

**Comparison table.** Stars and dates as of 2026-10-27. TH = fit for talking-head overlay editing (real footage, cuts, captions, b-roll, PiP). GEN = fit for script→TTS→visuals generated videos. LLM = how easily an LLM/agent can drive it.

| Option | Category | Authoring model | Rendering | License / price | ★ GitHub | Latest release (date) | Status | TH | GEN | LLM |
|---|---|---|---|---|---|---|---|---|---|---|
| Revideo ([repo](https://github.com/midrender/revideo)) | TS code framework (Motion Canvas fork) | TypeScript scenes (generators) | Headless browser, parallel workers, Cloud Run ([README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)) | MIT | 4,149 | @revideo/core 0.11.0 (2026-07-10) ([npm](https://www.npmjs.com/package/@revideo/core)) | Alive but small. Org renamed to midrender; YC company of 1 person ([YC](https://www.ycombinator.com/companies/midrender)) | M | H | M (code) |
| Motion Canvas ([repo](https://github.com/motion-canvas/motion-canvas)) | TS animation framework | TS generators + editor UI | Browser canvas → frames | MIT | 19,507 | @motion-canvas/core 3.17.2 (2024-12-14) ([npm](https://www.npmjs.com/package/@motion-canvas/core)) | No npm release in ~22 months (last push 2026-07-02). Stale for production | L | M | M |
| Twick ([repo](https://github.com/ncounterspecialist/twick)) | React editor SDK | React canvas timeline + JSON | "Serverless MP4 export" (repo description) | Sustainable Use License (source-available, not OSI; no SaaS without agreement) ([LICENSE](https://raw.githubusercontent.com/ncounterspecialist/twick/main/LICENSE.md)) | 544 | @twick/video-editor 0.15.31 (2026-05-07) ([npm](https://www.npmjs.com/package/@twick/video-editor)) | Small, last push 2026-06-04 | M | M | M |
| Diffusion Studio ([site](https://diffusion.studio/), [core repo](https://github.com/diffusionstudio/core)) | Browser engine, now an "AI video editor for agents & humans" | TS/TSX compositions, `dapi` CLI, agent skills | WebCodecs in browser (Chrome recommended) | MPL-2.0. Editor free, AI credits paid | 1,249 (core) | @diffusionstudio/core 4.0.3 (2025-11-30) ([npm](https://www.npmjs.com/package/@diffusionstudio/core)) | Core repo idle since 2025-11-18. Product pivoted to an agent editor | M | M | M–H |
| Etro ([repo](https://github.com/etro-js/etro)) | TS browser video library | TS layers/effects | Browser canvas/WebGL | **GPL-3.0** | 1,154 | etro 0.14.1 (2026-08-12) ([npm](https://www.npmjs.com/package/etro)) | Active, small | L–M | M | M |
| editly ([repo](https://github.com/mifi/editly)) | Node + FFmpeg declarative CLI/API | JSON5 edit spec | FFmpeg + canvas | MIT | 5,558 | editly 0.14.2 (2022-12-23) ([npm](https://www.npmjs.com/package/editly)) | **Stale**: no npm release since 2022, last push 2025-05-12 | M | M | H (JSON) |
| FFCreator ([repo](https://github.com/tnfe/FFCreator)) | Node video lib (Tencent team, 中文) | JS scene API | Node + FFmpeg | MIT | 3,166 | ffcreator 7.5.8 (2024-07-27) ([npm](https://www.npmjs.com/package/ffcreator)) | **Stale** (last push 2024-12-19) | L | M | M |
| WebAV ([repo](https://github.com/WebAV-Tech/WebAV)) | Browser editing SDK (中文 docs) | TS clips/sprites | WebCodecs | MIT | 2,093 | @webav/av-cliper 1.2.8 (2026-01-10) ([npm](https://www.npmjs.com/package/@webav/av-cliper)) | Slowing (no push since 2026-01-10) | M | M | M |
| Mediabunny ([repo](https://github.com/Vanilagy/mediabunny)) | Pure-TS media toolkit (mux/demux/convert) | Low-level TS | WebCodecs (browser) | MPL-2.0 | 7,388 | 1.62.1 (2026-10-22) ([npm](https://www.npmjs.com/package/mediabunny)) | Very active | building block | building block | L |
| MoviePy v2 ([repo](https://github.com/Zulko/moviepy)) | Python editing lib | Python clip objects | NumPy frames → FFmpeg pipe | MIT | 15,047 | 2.2.1 (2025-05-21) ([PyPI](https://pypi.org/project/moviepy/)) | Maintained (push 2026-08-26) but no 2026 release | M | M | M–H (Python) |
| FFmpeg filtergraph + ffmpeg-python ([repo](https://github.com/kkroening/ffmpeg-python)) | CLI / Python wrapper | Filtergraph strings | Native FFmpeg (NVENC/NVDEC capable) | LGPL/GPL (FFmpeg). Wrapper Apache-2.0 | 11,014 | 0.2.0 (2019-07-06) ([PyPI](https://pypi.org/project/ffmpeg-python/)) | **Wrapper unmaintained** (last push 2024-08) | H | M | M |
| typed-ffmpeg ([repo](https://github.com/lucemia/typed-ffmpeg)) | Typed FFmpeg bindings (Python + TS) | Typed filter graph | Native FFmpeg | MIT | 1,164 | 4.6.2 (2026-10-21) ([PyPI](https://pypi.org/project/typed-ffmpeg/)) | Active. Drop-in successor to ffmpeg-python | H | M | M–H |
| PyAV ([repo](https://github.com/PyAV-Org/PyAV)) | Python bindings to libav* | Frame/packet-level Python | Native libav (HW codecs possible) | BSD-3 | 3,319 | av 19.0.2 (2026-10-21) ([PyPI](https://pypi.org/project/av/)) | Very active | H (building block) | M | L–M |
| MLT / melt ([repo](https://github.com/mltframework/mlt)) | C framework behind Shotcut/Kdenlive | MLT XML timeline | Native, multi-threaded. New libplacebo GPU module | LGPL-2.1 | 1,869 (Shotcut 15,513) | v7.42.0 (3 Oct) ([releases](https://github.com/mltframework/mlt/releases)) | Very active | H | M | H (XML) |
| VapourSynth ([repo](https://github.com/vapoursynth/vapoursynth)) | Python frame-server | Python scripts | Native filters | LGPL-2.1 | 2,121 | R81 (2026-10-04) ([PyPI](https://pypi.org/project/vapoursynth/)) | Active. Mostly restoration/encoding, not NLE | L | L | L |
| libopenshot ([repo](https://github.com/OpenShot/libopenshot)) | C++ lib with Python bindings (OpenShot) | Timeline objects/JSON | Native | LGPLv3 | 1,580 | n/a (not checked) | Active | M | M | M |
| auto-editor ([repo](https://github.com/WyattBlue/auto-editor)) | Silence/motion auto-cut CLI | CLI flags | Native; exports NLE XML | Unlicense | 5,638 | 29.3.1 on PyPI (2025-11-04) ([PyPI](https://pypi.org/project/auto-editor/)) | Active (push 2026-10-26) | **H** (jump-cut pass) | – | M |
| OpenTimelineIO ([repo](https://github.com/AcademySoftwareFoundation/OpenTimelineIO)) | Interchange format + API (ASWF) | `.otio` JSON | Doesn't render | Apache-2.0 | 2,039 | 0.18.1 (2025-11-09) ([PyPI](https://pypi.org/project/opentimelineio/)) | Active | H (handoff) | M | **H** (JSON) |
| pyJianYingDraft ([repo](https://github.com/GuanYixuan/pyJianYingDraft)) | 剪映 draft generator (Python) | Python API → draft_content.json | 剪映 renders (Windows auto-export ≤6.8) | Apache-2.0 | 4,700 | 0.3.1 (2026-10-14) ([PyPI](https://pypi.org/project/pyJianYingDraft/)) | Active | **H** (human fine-tune) | H | M–H |
| pyCapCut ([repo](https://github.com/GuanYixuan/pyCapCut)) | CapCut (intl.) draft generator | Python | CapCut renders | (not stated) | 725 | 0.0.4 (2026-10-16) ([PyPI](https://pypi.org/project/pyCapCut/)) | Early | H | H | M |
| capcut-mate ([repo](https://github.com/Hommy-master/capcut-mate)) | 剪映 draft HTTP API (FastAPI) + Coze plugin | REST/OpenAPI | Drafts + async `gen_video` render | Apache-2.0 (GitHub metadata) | 2,041 | n/a | Active (push 2026-10-25) | H | H | **H** (REST, Coze, n8n) |
| VectCutAPI ([repo](https://github.com/sun-guannan/VectCutAPI)) | 剪映/CapCut draft HTTP API + MCP | REST + MCP (stdio) | Drafts. Cloud render closed-source (vectcut.com) | Apache-2.0 (GitHub metadata) | 2,337 | n/a | Active (push 2026-10-24) | H | H | **H** (MCP) |
| DaVinci Resolve API | NLE scripting | Python/Lua | Resolve's own GPU renderer | External scripting is **Studio-only** ([Arch Wiki](https://wiki.archlinux.org/title/Davinci)) | – | – | – | H (finishing) | L | M |
| OpenCut ([repo](https://github.com/OpenCut-app/OpenCut)) | Open-source CapCut-style web editor | GUI. Editor API/MCP/headless planned | Browser (rewrite in progress) | MIT | 96,474 | none | **Rewrite in progress**, contributions closed | L (today) | L | L (today) |
| Omniclip ([repo](https://github.com/omni-media/omniclip)) | Web video editor app | GUI | Browser | MIT | 1,469 | n/a | Active (push 2026-10-27) | L | L | L |
| ffmpeg.wasm ([repo](https://github.com/ffmpegwasm/ffmpeg.wasm)) | FFmpeg in WebAssembly | FFmpeg CLI args | Browser WASM (0.04–0.08× native speed) | MIT | 17,912 | @ffmpeg/ffmpeg 0.12.15 (2025-01-07) ([npm](https://www.npmjs.com/package/@ffmpeg/ffmpeg)) | Maintained, slow | L | L | M |
| Shotstack | Cloud JSON render API | JSON timeline→tracks→clips→asset | Cloud | $0.05–0.20/min | – | – | Commercial | M–H | H | **H** (has agent docs + llms-full.txt) |
| Creatomate | Cloud template/JSON API | Templates + JSON (RenderScript) | Cloud | ~14 credits/min @720p25. Essential $54, Growth 10K $129 | – | – | Commercial | M | H | H |
| JSON2Video | Cloud JSON API | movie/scenes/elements JSON | Cloud | 1 credit = 1 s. ~$0.20–0.42/min (calc) | – | – | Commercial | M | H | H |
| Plainly | After Effects template automation | AE templates + data | Cloud AE | $69–649/mo for 50–600 min | – | – | Commercial | L | M (brand templates) | M |
| Bannerbear | Template image/video API | Templates | Cloud | 2 credits per second of animation | – | – | Commercial | L | L–M | M |
| Rendi | FFmpeg-as-a-service | Raw FFmpeg commands via REST | Cloud CPU (GPU not stated) | Free 50 GB. Pro $25/mo 250 GB; $0.10/GB | – | – | Commercial | H | M | M–H |
| Aliyun IMS 云剪辑 | Cloud Timeline JSON API | Timeline JSON (VideoTracks/AudioTracks/SubtitleTracks/EffectTracks) | Cloud | ¥0.015–0.24/min by resolution (1080P ¥0.06) | – | – | Commercial (CN) | **H** (ASR captions, TTS, avatar built in) | H | **H** |
| Tencent MPS EditMedia | Cloud compose API | ComposeConfig JSON (Tracks/Items/Styles) | Cloud | price not found | – | – | Commercial (CN) | M–H | M | H |
| Volcano/BytePlus VOD direct edit | Cloud edit API | EditParam JSON (Canvas/Output/Track/Upload) | Cloud | billed by output resolution × duration (rates not found) | – | – | Commercial (CN) | M | M | H |

Reference points (covered elsewhere): Remotion ★68,140 with npm `remotion` 4.0.539 on 2026-10-26 ([repo](https://github.com/remotion-dev/remotion), [npm](https://www.npmjs.com/package/remotion)). HyperFrames ★73,662, repo created 2026-03-10, npm `hyperframes` 0.8.208 on 2026-10-27, Apache-2.0, described as "Write HTML. Render video. Built for agents." ([repo](https://github.com/heygen-com/hyperframes), [npm](https://www.npmjs.com/package/hyperframes)).

### Inferences
- By 2026 the momentum in code-first web frameworks sits with Remotion and HyperFrames. Revideo, Motion Canvas, Twick, Etro and WebAV all have single-digit-thousand stars or fewer and slow release cadence. Treat them as niche or risky foundations.
- For 口播 footage, the heavy lifting (decode → cut → scale/crop → overlay captions/b-roll → encode) is best done natively with FFmpeg/PyAV/MLT plus NVENC. Browser-screenshot engines are optimized for motion graphics, not for re-encoding long camera footage.
- The most LLM-friendly contracts are declarative JSON or XML timelines: Aliyun Timeline, Shotstack, OTIO, MLT XML, editly spec, and 剪映 draft APIs over REST/MCP. They can be schema-validated before rendering. Code-generating frameworks (Revideo, MoviePy) are flexible but harder to validate and sandbox.

### Gaps
- Release dates for libopenshot, Omniclip, capcut-mate and VectCutAPI (no GitHub Releases API access in this session).
- A head-to-head benchmark of these frameworks on identical 口播 footage. None was found.

---

## Q2. Code-first web frameworks (Revideo, Motion Canvas, Twick, Diffusion Studio, Etro, editly, WebAV, Mediabunny)

### Takeaway
**Revideo** is still alive but thinly staffed. It was renamed from redotvideo to midrender, last npm release 0.11.0 in July 2026, and is backed by a one-person YC company. **Motion Canvas** has not shipped an npm release since Dec 2024. **editly** and **FFCreator** are effectively unmaintained. **Diffusion Studio** pivoted from an SDK into an agent-oriented editor. None is a safer bet than Remotion or HyperFrames for production, though Revideo (MIT, parallel rendering) remains the main MIT-licensed code-first alternative.

### Cited Findings
- **Revideo**
  - Repo now lives at `midrender/revideo`: ★4,149, MIT, last push 2026-07-15, 63 open issues ([GitHub](https://github.com/midrender/revideo)).
  - npm `@revideo/core` 0.11.0 published 2026-07-10 ([npm](https://www.npmjs.com/package/@revideo/core)).
  - The README describes a TypeScript scene → video engine with a headless render API and a React player. It says the engine "borrows concepts from Remotion and Rive", runs "anywhere Node and a headless browser run", can split renders across workers, exposes a rendering endpoint via its CLI, and runs on serverless platforms such as Google Cloud Run ([README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)).
  - It is "the engine behind Midrender". The README claims scenes are plain TypeScript, so "Claude or Codex can generate one from a prompt". Anonymous PostHog telemetry is on by default and is disabled with `DISABLE_TELEMETRY=true` ([README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)).
  - YC lists Midrender as Active with team size 1 ([YC Midrender](https://www.ycombinator.com/companies/midrender)). An aggregator claims Midrender supports CLI and MCP workflows; this is unverified ([Extruct](https://extruct.ai/hub/re-video/)).
- **Motion Canvas**: ★19,507, MIT, last push 2026-07-02 ([GitHub](https://github.com/motion-canvas/motion-canvas)). The latest npm `@motion-canvas/core` is still 3.17.2 from 2024-12-14 ([npm](https://www.npmjs.com/package/@motion-canvas/core)).
- **Twick**
  - Describes itself as "AI-powered video editor SDK built with React. Features canvas timeline, drag-and-drop editing, AI captions, and serverless MP4 export". ★544, last push 2026-06-04 ([GitHub](https://github.com/ncounterspecialist/twick)).
  - Latest npm `@twick/video-editor` and `@twick/timeline` are 0.15.31 from 2026-05-07 ([npm](https://www.npmjs.com/package/@twick/video-editor)).
  - Licensed under the **Sustainable Use License v1.0**. That license is source-available, not OSI. It bans offering the software "as a hosted service, platform, or SaaS without a commercial agreement" and requires a commercial license for "substantial revenue" use, with no threshold defined ([LICENSE.md](https://raw.githubusercontent.com/ncounterspecialist/twick/main/LICENSE.md)).
- **Diffusion Studio**
  - The core repo describes "A fast, browser based video compositing engine powered by WebCodecs". ★1,249, MPL-2.0, last push 2025-11-18 ([GitHub](https://github.com/diffusionstudio/core)). The latest npm `@diffusionstudio/core` is 4.0.3 from 2025-11-30 ([npm](https://www.npmjs.com/package/@diffusionstudio/core)).
  - The v2 README advertised a 38 KB bundle with a single dependency ([jsDelivr README](https://cdn.jsdelivr.net/npm/@diffusionstudio/core-v2@2.0.1/README.md)).
  - The site now positions Diffusion Studio as "an AI video editor for both agents and humans": web editor, macOS/Windows desktop app, `dapi` CLI and agent skills, all MPL-2.0. The editor, exports and coding-agent workflows are free; credits pay for AI model usage. Scenes can use HTML/WebGL/3D/shaders and TSX compositions ([diffusion.studio](https://diffusion.studio/)).
- **Etro**: "Typescript video-editing library for the browser". ★1,154, **GPL-3.0**, last push 2026-10-24 ([GitHub](https://github.com/etro-js/etro)). npm `etro` 0.14.1 published 2026-08-12 ([npm](https://www.npmjs.com/package/etro)).
- **editly**: "Slick, declarative command line video editing & API". ★5,558, MIT, last push 2025-05-12 ([GitHub](https://github.com/mifi/editly)). The latest npm release is 0.14.2 from 2022-12-23 ([npm](https://www.npmjs.com/package/editly)).
- **FFCreator** (Tencent tnfe team): "A fast video processing library based on node.js (一个基于node.js的高速视频制作库)". ★3,166, last push 2024-12-19 ([GitHub](https://github.com/tnfe/FFCreator)). npm 7.5.8 from 2024-07-27 ([npm](https://www.npmjs.com/package/ffcreator)).
- **WebAV**: "A web-based Video Editing SDK built on WebCodecs. 基于 WebCodecs 构建的网页视频编辑 SDK". ★2,093, MIT, last push 2026-01-10 ([GitHub](https://github.com/WebAV-Tech/WebAV)). npm `@webav/av-cliper` 1.2.8 published 2026-01-10 ([npm](https://www.npmjs.com/package/@webav/av-cliper)).
- **Mediabunny**: "Pure TypeScript media toolkit for reading, writing, and converting video and audio files". ★7,388, MPL-2.0, pushed 2026-10-27 ([GitHub](https://github.com/Vanilagy/mediabunny)). npm 1.62.1 published 2026-10-22 ([npm](https://www.npmjs.com/package/mediabunny)).
- **openvideodev/react-video-editor**: "Online react video editor using remotion. Capcut and canva clone". ★1,824, non-standard license, last push 2026-06-30 ([GitHub](https://github.com/openvideodev/react-video-editor)). It is a Remotion-based editor UI, not an alternative engine.
- **bbc/VideoContext**: self-described as "An experimental HTML5 & WebGL video composition and rendering API". ★1,353 ([GitHub](https://github.com/bbc/VideoContext)).
- **WebCodecs status**: W3C history shows WebCodecs still a Working Draft, with its latest entry dated 8 July 2026 ([W3C](https://www.w3.org/standards/history/webcodecs/)). A 2026 article reports it near-Baseline, with Safari 26.4 shipping support in March 2026 ([Utsubo](https://www.utsubo.com/blog/frontier-web-apis-2026-production-ready)).

### Inferences
- Revideo is the only MIT-licensed, actively released code-first alternative with parallel/serverless rendering. Bus-factor risk is high (YC "team size 1"). Revideo also renders through a headless browser, so for long 口播 footage it shares Remotion's cost profile of per-frame browser rendering.
- Twick's SUL license rules it out if the user's system will ever be offered as SaaS without negotiating a license.
- Etro's GPL-3.0 is a copyleft risk for a closed product.
- WebCodecs engines (Diffusion Studio, WebAV, Mediabunny) are compelling for **client-side preview/export** in an editing UI. They don't suit headless server batch rendering unless run inside headless Chrome.
- Mediabunny is a building block (muxing/demuxing/transcoding), not a timeline engine.

### Gaps
- No published Revideo vs Remotion render-speed benchmark was found in this round.
- Twick's export path ("serverless MP4 export") was not inspected in detail.
- It is unclear whether Diffusion Studio's new editor repo is separate from `diffusionstudio/core`.

---

## Q3. Python / native toolkits (MoviePy v2, FFmpeg filtergraph & wrappers, PyAV, MLT/melt, GStreamer/GES, VapourSynth, Blender VSE, auto-editor)

### Takeaway
For real-footage 口播 editing, **FFmpeg (driven through typed-ffmpeg or generated filtergraphs) plus PyAV** is the throughput king and GPU-encodable. **MLT** is the most "NLE-like" native engine: an XML timeline, the engine behind Shotcut/Kdenlive, very active, with GPU modules arriving in 2026. **MoviePy v2** is ergonomic but its last release was May 2025 and it moves frames through NumPy. **ffmpeg-python** is abandoned; use **typed-ffmpeg** instead. **auto-editor** is a ready-made silence-cut pass that exports to NLE XML.

### Cited Findings
- **MoviePy**
  - ★15,047, MIT, last push 2026-08-26 ([GitHub](https://github.com/Zulko/moviepy)). The latest PyPI release is 2.2.1 from 2025-05-21 ([PyPI](https://pypi.org/project/moviepy/)).
  - v2 breaking changes ([MoviePy v2 migration guide](https://zulko.github.io/moviepy/getting_started/updating_to_v2.html)):
    - `moviepy.editor` is removed.
    - `.set_*` methods become `.with_*`, which return copies.
    - `resize/crop/rotate` become `resized/cropped/rotated`.
    - Effects are now classes applied via `with_effects()`.
    - ImageMagick, PyGame, OpenCV and scipy dependencies are dropped in favor of Pillow.
    - `TextClip` now requires a font file path.
    - Tracking, segmenting and sliders tools are removed.
- **ffmpeg-python**: ★11,014, last push 2024-08-04 ([GitHub](https://github.com/kkroening/ffmpeg-python)). The latest PyPI release is 0.2.0 from 2019-07-06 ([PyPI](https://pypi.org/project/ffmpeg-python/)).
- **typed-ffmpeg**: "Type-safe FFmpeg bindings for Python & TypeScript — filters, typing, and docs". ★1,164, MIT, last push 2026-10-23 ([GitHub](https://github.com/lucemia/typed-ffmpeg)). PyPI 4.6.2 published 2026-10-21 ([PyPI](https://pypi.org/project/typed-ffmpeg/)).
- **PyAV**: "Pythonic bindings for FFmpeg's libraries". ★3,319, BSD-3-Clause, last push 2026-10-26 ([GitHub](https://github.com/PyAV-Org/PyAV)). PyPI `av` 19.0.2 published 2026-10-21 ([PyPI](https://pypi.org/project/av/)).
- **MLT Framework**
  - ★1,869, LGPL-2.1, pushed 2026-10-27 ([GitHub](https://github.com/mltframework/mlt)). Shotcut, built on MLT, has ★15,513 and is GPL-3.0 ([GitHub](https://github.com/mltframework/shotcut)).
  - Latest MLT release is **v7.42.0 (3 Oct)**. It adds a list-based image-conversion callback API, Adjustment Clips (`fx_cut`) that apply only to tracks below, float32 as the default audio sample format, a **libplacebo-based GPU module**, mix-transition ducking, and **FFmpeg 9 support** ([MLT releases](https://github.com/mltframework/mlt/releases)).
  - v7.40.0 (25 Jun) added multi-threaded OpenFX and an **rnnoise** audio noise-reduction module. v7.38.0 (22 Apr) added basic OpenFX plugin support and a hardware-accelerated scale filter for preview ([MLT releases](https://github.com/mltframework/mlt/releases)).
- **GStreamer**: GitHub mirror ★3,352 ([GitHub](https://github.com/GStreamer/gstreamer)). OTIO ships an `xges` adapter (GStreamer Editing Services XML) in its plugin bundle ([OTIO adapters](https://opentimelineio.readthedocs.io/en/latest/tutorials/adapters.html)).
- **VapourSynth**: "A video processing framework with simplicity in mind". ★2,121, LGPL-2.1 ([GitHub](https://github.com/vapoursynth/vapoursynth)). PyPI R81 published 2026-10-04 ([PyPI](https://pypi.org/project/vapoursynth/)).
- **libopenshot**: "API currently supports C++, Python, and Ruby". ★1,580, LGPLv3 topic ([GitHub](https://github.com/OpenShot/libopenshot)).
- **auto-editor**
  - CLI that cuts "dead space", mainly by audio loudness and optionally by motion, with `--edit` and `--margin` options ([README](https://raw.githubusercontent.com/WyattBlue/auto-editor/master/README.md)).
  - Exports to Adobe Premiere Pro XML (`--export premiere`), DaVinci Resolve, Final Cut Pro, ShotCut, Kdenlive, or a clip sequence. The README carries a Nim badge ([README](https://raw.githubusercontent.com/WyattBlue/auto-editor/master/README.md)).
  - ★5,638, Unlicense, pushed 2026-10-26 ([GitHub](https://github.com/WyattBlue/auto-editor)). Latest on PyPI is 29.3.1 from 2025-11-04 ([PyPI](https://pypi.org/project/auto-editor/)).
- **ffmpeg.wasm performance** (for contrast with native): on a 10 s 720p WebM→MP4 job, native FFmpeg took 5.2 s, ffmpeg.wasm single-thread 128.8 s (0.04×) and multi-thread 60.4 s (0.08×) ([ffmpeg.wasm docs](https://ffmpegwasm.netlify.app/docs/performance)).

### Inferences
- **Recommended 口播 core:** ASR word timestamps → LLM decides keep/cut segments plus overlays → compile to FFmpeg filtergraph via typed-ffmpeg (or to MLT XML rendered with `melt`) → NVENC encode.
  - MLT gives NLE semantics (tracks, transitions, filters, keyframes) without hand-writing filtergraphs, and Shotcut can open the same XML for human review.
  - MLT 7.40 added rnnoise denoise, which is useful for 口播 audio.
- MoviePy v2 suits prototyping and simple generated videos. Per-frame Python/NumPy compositing will be far slower than FFmpeg filtergraphs on long talking-head footage. No benchmark was found to quantify this.
- auto-editor can be the first pass for silence and breath removal. Its Premiere/Resolve/FCP XML export makes it a bridge to human editing, though not directly to 剪映.

### Gaps
- **GStreamer Editing Services (GES)**: current release, Python usability, maturity. Not researched beyond the OTIO xges adapter.
- **Blender VSE scripting** (`bpy` sequencer API): not researched this round. Background knowledge suggests it is scriptable but heavy for server batch use; this is unverified.
- No quantitative MoviePy-vs-FFmpeg or MLT-vs-FFmpeg throughput benchmark was found.

---

## Q4. Interchange & NLE handoff: OpenTimelineIO, DaVinci Resolve scripting, 剪映/CapCut draft generation

### Takeaway
For Chinese creators who want to fine-tune in 剪映 after auto-editing, **generating 剪映 drafts** is the most relevant path. pyJianYingDraft is the most mature Python library. capcut-mate and VectCutAPI wrap draft generation in REST/MCP for agents. Major caveats:
- Newer 剪映 versions encrypt/obfuscate `draft_content.json`.
- Automated export works only on Windows 剪映 ≤6.8, via UI automation.
- 剪映 has no official API.

**OTIO** is the clean, open interchange path to Premiere/Resolve/FCP. **Resolve's external scripting requires the paid Studio edition.**

### Cited Findings
- **pyJianYingDraft** ("轻量、灵活、易上手的Python剪映草稿生成及导出工具，构建全自动化视频剪辑/混剪流水线"): ★4,700, Apache-2.0, last push 2026-10-14 ([GitHub](https://github.com/GuanYixuan/pyJianYingDraft)). PyPI 0.3.1 published 2026-10-14 ([PyPI](https://pypi.org/project/pyJianYingDraft/)).
  - Feature tables target **剪映 5.9 and 10.8** ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).
  - In newer 剪映 versions `draft_content.json` "is often not plain-text readable". Template mode on those versions needs a custom `fallback_loader` ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).
  - **Batch export works only on 剪映 ≤6.8**, not 7+. It uses `JianyingController` (Windows `uiautomation`) and takes over the mouse and window. It requires VIP/export permission or "may loop indefinitely". Resolution and fps export options exist only on ≤6.8 ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).
  - Linux/macOS support draft generation and template mode only ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).
  - Features: video/image segments with trim/speed, transforms, keyframes, masks, chroma key, blend modes; audio fades/volume/effects; stickers; filters/effects/transitions/animations; rich text with outline/shadow/background and auto-wrap; **SRT import (SRT only)**; template mode (replace materials/text by name, import tracks). Limits: no keyframes on effect/filter params, no curved speed ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).
- **pyCapCut** (CapCut international version from the same author): ★725, pushed 2026-10-16 ([GitHub](https://github.com/GuanYixuan/pyCapCut)). PyPI 0.0.4 published 2026-10-16 ([PyPI](https://pypi.org/project/pyCapCut/)).
- **capcut-mate** ("开源剪映小助手｜剪映API | 扣子插件"): ★2,041, Apache-2.0 per GitHub metadata, pushed 2026-10-25 ([GitHub](https://github.com/Hommy-master/capcut-mate)).
  - FastAPI server on port 30000 under `/openapi/capcut-mate/v1/` ([README](https://raw.githubusercontent.com/Hommy-master/capcut-mate/main/README.md)).
  - Endpoints: `create_draft`, `save_draft`, `add_videos`, `add_images`, `add_audios`, `add_captions`, `add_effects`, `add_keyframes`, `add_masks` and `add_beauty`, plus **`gen_video` / `gen_video_status`** for async rendering ([README](https://raw.githubusercontent.com/Hommy-master/capcut-mate/main/README.md)).
  - Integrations: `openapi.yaml` imports into Coze, works with n8n, and has an Electron "剪映小助手" desktop client. Deploys via Docker. Hosted `upload_file` costs ¥0.005/MB ([README](https://raw.githubusercontent.com/Hommy-master/capcut-mate/main/README.md)).
  - The README does not state supported 剪映 versions.
- **VectCutAPI** (formerly CapCutAPI): ★2,337, Apache-2.0 per GitHub metadata, pushed 2026-10-24 ([GitHub](https://github.com/sun-guannan/VectCutAPI)).
  - HTTP server on port 9001 (`/add_video`, `/add_text`, …) plus an **MCP server over stdio** with about 11 tools (`create_draft`, `add_video`, `add_text`, `add_video_keyframe`, `save_draft`, …) ([README](https://raw.githubusercontent.com/sun-guannan/VectCutAPI/main/README.md)).
  - Draft profiles: `capcut_legacy`, `jianying_legacy`, `jianying_pro_10` (剪映专业版 10.x, Windows) ([README](https://raw.githubusercontent.com/sun-guannan/VectCutAPI/main/README.md)).
  - The README says the **cloud rendering module is not open-sourced**. The open code produces draft folders, and hosted rendering is at vectcut.com. It claims integrations with Coze/Dify/n8n and Claude Code/Trae ([README](https://raw.githubusercontent.com/sun-guannan/VectCutAPI/main/README.md)).
- **OpenTimelineIO**: ★2,039, Apache-2.0, pushed 2026-10-25 ([GitHub](https://github.com/AcademySoftwareFoundation/OpenTimelineIO)). PyPI 0.18.1 published 2025-11-09 ([PyPI](https://pypi.org/project/opentimelineio/)).
  - Built-in adapters: `otio_json`, `otiod`, `otioz`. The separate **OpenTimelineIO-Plugins** package adds AAF, ALE, burnins, `cmx_3600` (EDL), `fcp_xml`, maya_sequencer, svg and `xges`; `fcpx_xml` and `hls_playlist` live in separate projects ([OTIO docs](https://opentimelineio.readthedocs.io/en/latest/tutorials/adapters.html)).
- **Aliyun IMS → Premiere export**: IMS can export a project as AdobePremierePro (billed as video editing) or as BaseTimeline (charged only for dubbing/subtitle features) ([Aliyun IMS billing](https://help.aliyun.com/zh/ims/video-clip)).
- **DaVinci Resolve**: the free version runs scripts only from inside Resolve (Console/Scripts menu); **external scripting is Studio-only** ([Arch Wiki](https://wiki.archlinux.org/title/Davinci); [Blackmagic forum](https://forum.blackmagicdesign.com/viewtopic.php?p=677825)).
  - Third-party Resolve MCP servers exist ([glama.ai listing](https://glama.ai/mcp/servers/y5vtdfkv6k)).
  - One project claims free-edition Python scripting changed in Resolve 21.1. This is unverified ([search summary of glama listing](https://glama.ai/mcp/servers/dz6mliu9t6)).

### Inferences
- Recommended dual-output design: keep an internal canonical timeline (own JSON or OTIO) and compile it to (a) FFmpeg/MLT for automatic final render and (b) a 剪映 draft via pyJianYingDraft, or capcut-mate/VectCutAPI as a service, for human fine-tuning. This avoids locking the pipeline to 剪映's undocumented, version-fragile format.
- 剪映 export automation (UI automation, Windows, ≤6.8, VIP) is too brittle for server-side final rendering. Use 剪映 drafts as a *human handoff*, not as the render engine.
- capcut-mate and VectCutAPI already expose agent-native interfaces (OpenAPI/Coze, MCP), so they can serve as the LLM tool surface for "edit in 剪映" flows.
- OTIO has no 剪映 adapter in its curated list. A custom OTIO→剪映 bridge (OTIO → pyJianYingDraft) would be needed.

### Gaps
- Exactly which 剪映 version introduced draft encryption, and whether pyJianYingDraft's generated (not read) drafts open in the latest 剪映 (2026). The README lists 10.8 as supported for generation.
- capcut-mate `gen_video`: whether rendering is open-source/self-hostable or proxies a paid backend. The README is ambiguous.
- No verified OTIO adapter for 剪映/CapCut was found.

---

## Q5. Browser/client-side: OpenCut, Omniclip, ffmpeg.wasm, WebCodecs editors

### Takeaway
**OpenCut** has huge mindshare (★96k) but is mid-rewrite, with its Editor API, MCP server and headless batch mode only *planned*. It is not usable as a programmatic renderer today. **ffmpeg.wasm** is 12–25× slower than native. Browser tools fit an in-app preview/editor UI, not the batch render backend.

### Cited Findings
- **OpenCut** ("The open-source CapCut alternative"): ★96,474, MIT, last push 2026-09-24 ([GitHub](https://github.com/OpenCut-app/OpenCut)).
  - The README says it is "being rewritten from the ground up". The classic editor runs at opencut.app and the rewrite at new.opencut.app ([README](https://raw.githubusercontent.com/OpenCut-app/OpenCut/main/README.md)).
  - Planned: Editor API, plugin-first architecture, **MCP server for AI agents**, **headless mode for automation and batch rendering**, a scripting tab, and a Rust core shared across platforms ([README](https://raw.githubusercontent.com/OpenCut-app/OpenCut/main/README.md)).
  - A desktop app is in development, outside contributions are not accepted yet, and fal.ai is a sponsor ([README](https://raw.githubusercontent.com/OpenCut-app/OpenCut/main/README.md)).
- **Omniclip** ("Open source video editing web application"): ★1,469, MIT, pushed 2026-10-27 ([GitHub](https://github.com/omni-media/omniclip)).
- **ffmpeg.wasm**: ★17,912, MIT, pushed 2026-09-29 ([GitHub](https://github.com/ffmpegwasm/ffmpeg.wasm)). npm `@ffmpeg/ffmpeg` 0.12.15 published 2025-01-07 ([npm](https://www.npmjs.com/package/@ffmpeg/ffmpeg)). It runs at 0.04× (single-thread) and 0.08× (multi-thread) of native speed ([docs](https://ffmpegwasm.netlify.app/docs/performance)).
- WebCodecs-based SDKs (WebAV, Diffusion Studio, Mediabunny): see Q2.

### Inferences
- If the user's system needs a web UI for reviewing and adjusting auto-edits, a WebCodecs SDK (WebAV has Chinese docs; Mediabunny for I/O) or a Remotion-based editor (react-video-editor) can preview the same timeline JSON. Final renders should stay server-side.
- OpenCut should be re-evaluated once its headless/MCP mode ships. Its star count suggests it could become a major open alternative.

### Gaps
- Omniclip's rendering technology (WebCodecs vs other) was not verified.
- No date or roadmap for OpenCut's headless/MCP release was found.

---

## Q6. Commercial cloud render APIs (Western): pricing models and timeline schemas

### Takeaway
**Shotstack** is the most developer-/agent-oriented JSON timeline API, at $0.05–0.20/min with 4K from the Pro plan, and it publishes agent convention docs and `llms-full.txt`. **JSON2Video** prices flat per second ($0.20–0.42/min calc). **Creatomate** prices by credits (~14 credits/min at 720p25, roughly $0.18–0.38/min calc). **Plainly** (After Effects) and **Bannerbear** are much costlier per minute and template-centric. **Rendi** sells raw FFmpeg compute per GB ($0.10/GB), ideal if the user already compiles FFmpeg commands. Cloudinary, Mux, VEED and Submagic are not general timeline compositors.

### Cited Findings
- **Shotstack** ([pricing](https://shotstack.io/pricing/))

  | Plan | Price | Minutes | Rate | Max resolution |
  |---|---|---|---|---|
  | Pay-as-you-go | $10 one-time | 50 min | 20¢/min | 1080p |
  | Starter | $39/mo | 250 min | 15.6¢/min | 1080p |
  | Pro | $99/mo | 750 min | 13.2¢/min | 4K |
  | Scale | $199/mo | 2,000 min | 10¢/min | 4K |
  | Volume | $499/mo | 10,000 min | 5¢/min | 4K |

  - Minutes are counted per second, rounded down. Unused plan minutes roll over 3 months. New sign-ups get 10 credits, and every plan has a free sandbox ([pricing](https://shotstack.io/pricing/)).
  - Credits also pay for AI generation (e.g., Seedance video, ElevenLabs voice/music, Nano Banana images) ([pricing](https://shotstack.io/pricing/)).
  - Schema: an edit = `timeline` (tracks → clips, each clip with `asset`, `start`, `length`) + `output`. `start: "auto"` and `length: "auto"|"end"` are smart values. Rendering is a POST to `api.shotstack.io/edit/{version}/render` ([core concepts](https://shotstack.io/docs/guide/getting-started/core-concepts/); [hello world](https://shotstack.io/learn/hello-world); [API ref](https://shotstack.io/docs/api/)).
  - Shotstack publishes agent conventions and an `llms-full.txt` ([agent conventions](https://shotstack.io/docs/guide/agents/conventions/); [llms-full.txt](https://shotstack.io/docs/guide/llms-full.txt)).
  - The docs conflict on layer order: agent conventions say `tracks[0]` is the TOP layer, while the guidelines page reads differently ([guidelines](https://shotstack.io/docs/guide/architecting-an-application/guidelines)).
- **Creatomate**
  - Plans: Essential 2,000 credits, Growth 10,000 (up to 40,000), Beyond 50,000 (up to 200,000). About 14 credits per minute of 720p/25fps video; resolution, fps and length all affect cost ([pricing](https://creatomate.com/pricing)).
  - The docs list **Essential at $54/mo** and **Growth 10K at $129/mo**, and credits do not roll over ([Creatomate docs](https://creatomate.com/docs/account/how-does-the-pricing-work)). Third-party sites list different prices (e.g., $29/$99) and are likely stale ([ToolRadar](https://toolradar.com/tools/creatomate/pricing)).
  - Free trial is 50 credits; renders are deleted after 30 days ([pricing](https://creatomate.com/pricing)).
  - (calc) About $0.38/min at 720p on Essential and about $0.18/min on Growth 10K.
- **JSON2Video** ([pricing](https://json2video.com/pricing/))
  - 1 credit = 1 second regardless of resolution, including 4K.
  - Subscriptions: Hobby $16.63/mo billed annually (50 min), Professional $49.95 (200 min), Startup $99.95 (500 min).
  - Prepaid: $49.95 for 120 min.
  - Free tier: 600 credits with watermark. Max video length 30 min. (calc) $0.20–0.42/min.
- **Plainly** (After Effects templates) ([pricing](https://www.plainlyvideos.com/pricing))
  - Starter $69/mo (50 min), Explorer $134 (100), Team $259 (200), Pro $649 (600), Unlimited from $1,500/mo.
  - Concurrent renders: 2 / 4 / 8 / 16. Every exported second counts. (calc) About $1.08–1.38/min.
- **Bannerbear** ([pricing](https://www.bannerbear.com/pricing/))
  - Plans: Automate $49 (1,000 API credits), Scale $149 (10,000), Enterprise $299 (50,000).
  - Video animations cost 2 credits per second; 60fps doubles it. Video tools cost 1–4 credits per operation (burn subtitles = 4).
  - (calc) About $5.9/min on Automate, $1.8/min on Scale, $0.72/min on Enterprise.
- **Rendi** (FFmpeg-as-a-service) ([pricing](https://rendi.dev/pricing))
  - Free: 4 vCPU, 50 GB processing/month, 1-min command limit.
  - Pro: $25/mo for 4 vCPU and 250 GB, scaling to 256 vCPU at $1,600/mo. Unlimited-runtime tiers cost 4× more.
  - "Processing" means input + output size, from $0.10/GB. No duration, resolution or codec tiers. Up to 32 vCPU per command. GPU availability is not stated.
- **Cloudinary**: 1 credit ≈ 500 s of SD or 250 s of HD video processing. Each SD second counts as 2 transformations and each HD second as 4 ([Cloudinary pricing doc](https://cloudinary.com/documentation/pricing.md); [credits FAQ](https://cloudinary.com/documentation/developer_onboarding_faq_credits)).
- **Submagic API** (caption/short-form tool): third-party sources say the Business plan ($69/member/mo) includes 100 API minutes, with extra packs at about $0.10–0.23/min. This was not confirmed on Submagic's own site ([hooked.so](https://www.hooked.so/compare/submagic-pricing); [ToolRadar](https://toolradar.com/tools/submagic/pricing)).
- **VEED**: sources conflict. One says VEED shipped OpenEdit, Lip Sync 2.0 and Subtitle APIs on fal.ai; another says there is no public API on listed plans (Enterprise only) ([vmeg.ai](https://www.vmeg.ai/blog/veed-alternatives/); [Trupeer](https://www.trupeer.ai/ko/tools-comparison/veed-vs-trupeer-pricing)).

### Inferences
- For generated (script→TTS→visuals) videos at moderate volume, Shotstack (5–20¢/min, AI generation included) or JSON2Video (flat per-second) are the cheapest Western JSON APIs. Shotstack's agent docs make it the most LLM-ready.
- For 口播 footage, uploading long raw camera files to Western clouds adds latency and egress friction for China-based users. Aliyun IMS is far cheaper and closer.
- (calc) Rendi suits a pipeline that already emits FFmpeg commands. At roughly 120 MB of input+output for a 1-min 1080p clip, cost is about $0.012/min.

### Gaps
- Creatomate credits per minute at 1080p/30fps (only 720p/25fps is given). Its RenderScript JSON schema was not fetched.
- **Mux** was not researched. It is primarily hosting/streaming, not a timeline compositor; that is an inference, not verified this round.
- Official Submagic and VEED API pricing pages were not reached.
- JSON2Video and Creatomate schema details were not fetched; only their pricing was verified.

---

## Q7. Chinese cloud equivalents: Aliyun IMS 云剪辑, Tencent Cloud (MPS EditMedia / VOD), Volcano Engine / BytePlus VOD

### Takeaway
**Aliyun IMS 智能媒体服务 视频剪辑** is the strongest fit for an automated 口播 pipeline in China:
- A documented Timeline JSON with video/audio/subtitle/effect tracks.
- Built-in **AI_ASR** (auto captions), **AI_TTS** (dubbing, including cloned voices), **AI_Avatar** (digital human) and rich subtitle styling.
- Very low cost: ¥0.06/min at 1080P, ¥0.24/min at 4K. Advanced templates cost ¥1.5–3/min.

Tencent MPS EditMedia and Volcano/BytePlus VOD direct-edit both accept JSON timelines. Their per-minute prices were not found publicly.

### Cited Findings
- **Aliyun IMS 视频剪辑 billing** ([help.aliyun.com/zh/ims/video-clip](https://help.aliyun.com/zh/ims/video-clip))
  - Billed on output duration × resolution. Under 1 minute is billed as 1 minute; failed jobs are free. Billing is hourly and requires an IMS subscription.
  - China mainland prices (¥/min):

    | Resolution | ¥/min |
    |---|---|
    | 480P | 0.015 |
    | 720P | 0.03 |
    | 1080P | 0.06 |
    | 2K | 0.12 |
    | 4K | 0.24 |

  - Singapore and US-West cost 3× (e.g., 1080P 0.18).
  - **Advanced templates** (mainland only): ¥1.5/min at 1080P and ¥3/min at 4K.
  - Example from the page: 30×0.06 + 3×0.06 + 45×0.03 = ¥3.33.
- **Aliyun legacy VOD 云剪辑** (older product): splits basic and advanced editing, e.g., H.264 4K basic ¥0.28/min vs advanced ¥1.26/min. This comes from a search summary of [help.aliyun.com/document_detail/188310.html](https://help.aliyun.com/document_detail/188310.html) and was not directly fetched.
- **Aliyun IMS Timeline schema** ([Timeline configuration](https://help.aliyun.com/en/ims/developer-reference/timeline-configuration-description))
  - Top level: `VideoTracks`, `AudioTracks`, `SubtitleTracks`, `EffectTracks`. `ImageTracks` is deprecated and merged into video tracks. Later VideoTracks overlay earlier ones.
  - VideoTrack: `MainTrack`, plus `TrackShortenMode`/`TrackExpandMode` (`AutoSpeed`).
  - VideoTrackClip:
    - Source and type: `MediaId|MediaURL`; `Type` = Video/Image/GlobalImage/AI_Avatar.
    - Position and fit: `X/Y/Width/Height` (as percentages or pixels); `AdaptMode` (Contain/Cover/Fill).
    - Timing and look: `In/Out`, `TimelineIn/TimelineOut`, `Speed` 0.1–100, `Opacity`, `MaskVideoUrl`.
    - Alignment and effects: `ClipId/ReferenceClipId` for alignment; `Effects[]`.
  - AudioTrackClip `Type=AI_TTS` takes `Content`, `Voice|CustomizedVoice`, `SpeechRate` and `PitchRate`.
  - Effect types: Text, DeWatermark, Crop, Pad, Scale, Transition, VFX, Volume, AFade, **AI_ASR**.
  - SubtitleTrackClip:
    - `Type` = Subtitle (SRT/ASS file) or Text.
    - Text styling: `Font` (default SimSun), `FontSize`, `FontColor`, `FontFace`, `Alignment` (nine positions), `Outline`/`Shadow`/`Box` SubtitleEffects, bubble styles.
    - Animation: `AaiMotionIn/Out/LoopEffect`.
    - Layout: `AdaptMode` (AutoWrap/AutoScale).
  - EffectTrack items: VFX/Filter, including `mosaic_rect/blur` regions.
  - AI_Avatar and AI_TTS are available only in Beijing, Shanghai and Hangzhou.
- **Aliyun Timeline Web SDK**: Aliyun documents Timeline support for its web editing/preview component ([Timeline support guide](https://help.aliyun.com/en/ims/developer-reference/timeline-support-guide-for-editing-and-previewing-the-component-web-sdk)).
- **Tencent Cloud MPS `EditMedia`** ([API doc](https://cloud.tencent.com/document/api/862/43010))
  - Two modes: clip (trim/concat) or compose (multi-track). Compose mode is selected when `ComposeConfig` is present.
  - `ComposeConfig` contains `TargetInfo` (container, fps), `Styles` (reusable subtitle styles referenced by `StyleId`) and `Tracks[]`. Each track has `Type` (Video/Audio/Title) and `Items[]` (Video/Image/Audio/Subtitle/Transition/Empty).
  - Items use `SourceMedia.FileId`, `StartTime/EndTime` and `TrackTime`, plus `XPos`, `YPos` and `Width`.
  - Limits: default 20 requests/s. Transitions consume time from adjacent elements. Speed changes cannot be combined with transitions.
  - The API page states no billing. Tencent MPS has billed enhancement/recognition sub-capabilities separately since 2023-10-01 ([Tencent MPS billing](https://www.tencentcloud.com/zh/document/product/1041/56692)).
- **Volcano Engine / BytePlus VOD `SubmitDirectEditTaskAsync`** ([BytePlus doc](https://docs.byteplus.com/zh-CN/docs/byteplus-vod/reference-submitdirectedittaskasync))
  - API Version 2025-01-01. A one-shot direct edit with `Application=VideoTrackToB` (the only value), `EditParam` JSON, `Priority` and `CallbackArgs` (≤64 KB).
  - The example EditParam has `Canvas` (e.g., 3840×2160), `Output` (Fps, codec, CRF, preset, AAC bitrate), `Track` (array of track arrays with typed elements and `TargetTime`) and `Upload`.
  - Results come back via `GetDirectEditProgress` / `GetDirectEditResult`.
  - Billing is pay-as-you-go by output resolution × duration; rates are not on the page.

### Inferences
- (calc) Aliyun IMS at ¥0.06/min (about US$0.008/min at roughly ¥7.1/US$) for 1080P is about 6–25× cheaper than Shotstack ($0.05–0.20) and 25–50× cheaper than JSON2Video. ASR captions and TTS are billed separately (smart subtitle/dubbing fees).
- Aliyun's Timeline maps almost 1:1 to what a 口播 auto-editor needs:
  - Main track = A-roll with In/Out cuts.
  - Upper tracks = b-roll/PiP via X/Y/Width/Height.
  - SubtitleTracks = styled 花字 captions.
  - AI_ASR = auto captions; AudioTracks = BGM with AFade/Volume.
  - LLM output can be schema-validated against it. It is a strong candidate as the "cloud render target" alongside a local FFmpeg renderer.
- Tencent's ComposeConfig and Volcano's EditParam are viable but less documented publicly. Price discovery requires the console or sales.
- Volcano (ByteDance) is the same company as 剪映/CapCut. No public bridge between Volcano VOD editing and 剪映 drafts was found.

### Gaps
- **Tencent Cloud editing per-minute price**: not found. The VOD/MPS billing pages did not surface an EditMedia rate. Tencent's 智能创作/CME product status was not checked.
- **Volcano Engine domestic pricing** for direct edit, and the full EditParam element spec (text/image/audio/effects): the "Editing params" page was not retrieved.
- Aliyun smart subtitle (ASR) and smart dubbing (TTS) unit prices inside IMS were not captured.
- Whether Aliyun IMS outputs 9:16 vertical with burned-in Chinese subtitles at quality comparable to 剪映 花字. The schema supports styling, but output quality was not verified.

---

## Q8. GPU acceleration: NVENC/NVDEC with FFmpeg, how frameworks use GPU, rough throughput

### Takeaway
A single modern NVENC engine encodes 1080p H.264 at roughly **210–290 fps at quality presets (P5–P7)** and **~850–980 fps at P1**. Ada/Blackwell AV1 P1 reaches ~740–1,090 fps. That is roughly 7–35× realtime at 30 fps per engine. GeForce cards are capped at **8 concurrent NVENC sessions per system**; data-center/pro cards have no such cap. Native FFmpeg and MLT pipelines can use this directly. Browser/headless-Chrome frameworks are bottlenecked by frame capture, not encode.

### Cited Findings
- NVIDIA's NVENC performance table (per engine, 1080p, 8-bit 4:2:0) ([NVENC Application Note, SDK 13.0](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.0/nvenc-application-note/index.html)):

  | Codec / preset | Ada (fps) | Blackwell (fps) |
  |---|---|---|
  | H.264 P1 | 885–910 | 948–977 |
  | H.264 P3 | ~647–652 | – |
  | H.264 P5 | 283–291 | – |
  | H.264 P7 | 211–247 | – |
  | HEVC P1 | 1,037–1,055 | – |
  | AV1 P1 | 741–1,090 | 957–1,076 |

- Some GPUs have 2–3 NVENC engines (e.g., AD104, GP104) ([NVENC Application Note](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.0/nvenc-application-note/index.html)).
- Non-qualified GPUs (GeForce) are limited to **8 concurrent encode sessions per system** across all cards. Qualified GPUs are limited only by resources ([NVENC Application Note](https://docs.nvidia.com/video-technologies/video-codec-sdk/13.0/nvenc-application-note/index.html)). The 8-session limit needs Windows driver ≥551.76 or Linux ≥550.54.14, per a forum post quoting the SDK 12.2 note ([NVIDIA forum](https://forums.developer.nvidia.com/t/how-to-increase-number-of-nvenc-concurrent-sessions/169367)). The limit was earlier 3, then 5 ([Guru3D](https://www.guru3d.com/news-story/nvidia-removes-encoding-limitations-on-consumer-gpus-allowing-up-to-5-simultaneous-streams.html)).
- PyTorch/torchaudio benchmark at 1080p ([PyTorch NVENC tutorial](https://pytorch.org/audio/main/tutorials/nvenc_tutorial.html)):
  - Software encode: about 25 fps on 1 thread, 65 fps on 4 threads, 76 fps on 8 threads.
  - NVENC: about 167–215 fps from host-memory frames, and about 371 fps when frames are already on the CUDA device.
- **MLT** added a hardware-accelerated scale filter (v7.38) and a **libplacebo GPU module** (v7.42) ([MLT releases](https://github.com/mltframework/mlt/releases)).
- **Rendi** does not state GPU availability; it sells vCPU tiers ([pricing](https://rendi.dev/pricing)).
- **Revideo** renders via headless browser and scales by splitting across workers ([README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)).
- **ffmpeg.wasm** runs at 0.04–0.08× native speed ([docs](https://ffmpegwasm.netlify.app/docs/performance)).

### Inferences
- For 口播 batch rendering, a full-GPU FFmpeg path (NVDEC decode → CUDA scale/overlay → NVENC encode) keeps frames on the GPU. The PyTorch data shows the GPU-resident path is about 2× faster than copying frames back to host. Caption burn-in via libass `subtitles` filters runs on CPU and forces a host round-trip, which is a likely bottleneck. This is inference; no benchmark was found.
- (calc) One GeForce card with 8 sessions × ~250 fps at P5 gives roughly 2,000 fps of aggregate H.264 1080p encode, if the CPU and decoder keep up. That is about 66 minutes of 30 fps video per wall-clock minute, a theoretical encode ceiling only.
- Headless-browser frameworks (Revideo, and likewise Remotion/HyperFrames) are typically limited by per-frame page rendering and screenshotting. GPU encode helps little there. This is why they scale horizontally across workers.

### Gaps
- No public benchmark was found comparing end-to-end 口播 render time (cut + captions + overlays) across FFmpeg-CUDA, MLT, MoviePy and headless-browser engines.
- Whether Aliyun/Tencent/Volcano cloud editing uses GPU, and their typical render latency per output minute, is undocumented in the pages retrieved.

---

## Q9. Suitability for talking-head overlay editing vs generated videos, and LLM/agent friendliness

### Takeaway
- **Talking-head (口播):** the best fits are the native FFmpeg/PyAV/MLT stack plus auto-editor for silence cuts, Aliyun IMS (ASR+TTS+subtitles built in), and 剪映 draft generation for human finishing.
- **Generated videos (script→TTS→visuals):** JSON cloud APIs (Shotstack, JSON2Video, Creatomate, Aliyun IMS), or a code framework (Revideo; or Remotion/HyperFrames, covered elsewhere) when motion-graphics richness matters.
- **LLM/agent friendliness:** best where a validated declarative schema exists (Aliyun Timeline, Shotstack JSON with llms-full.txt/agent conventions, OTIO JSON, MLT XML) or where an MCP/REST tool surface exists (VectCutAPI MCP, capcut-mate OpenAPI/Coze, Diffusion Studio `dapi` + skills).

### Cited Findings
- Aliyun Timeline natively supports `AI_ASR` captions, `AI_TTS` dubbing with cloned voices, `AI_Avatar` digital humans, PiP via X/Y/Width/Height, and styled subtitles ([Aliyun Timeline](https://help.aliyun.com/en/ims/developer-reference/timeline-configuration-description)).
- Shotstack provides agent conventions documentation and `llms-full.txt` ([agent conventions](https://shotstack.io/docs/guide/agents/conventions/); [llms-full.txt](https://shotstack.io/docs/guide/llms-full.txt)).
- VectCutAPI exposes an MCP server with draft-editing tools and claims Claude Code/Trae/Coze/Dify/n8n integration ([README](https://raw.githubusercontent.com/sun-guannan/VectCutAPI/main/README.md)). capcut-mate exposes OpenAPI importable into Coze and works with n8n ([README](https://raw.githubusercontent.com/Hommy-master/capcut-mate/main/README.md)).
- Revideo claims TypeScript scenes can be generated by Claude/Codex from prompts ([README](https://raw.githubusercontent.com/midrender/revideo/main/README.md)). Diffusion Studio ships a `dapi` CLI and agent skills ([diffusion.studio](https://diffusion.studio/)).
- OpenCut plans, but has not shipped, an MCP server and headless mode ([README](https://raw.githubusercontent.com/OpenCut-app/OpenCut/main/README.md)).
- auto-editor cuts by audio loudness/motion and exports Premiere/Resolve/FCP/Shotcut/Kdenlive timelines ([README](https://raw.githubusercontent.com/WyattBlue/auto-editor/master/README.md)).
- pyJianYingDraft supports SRT caption import, rich text styling, keyframes and template-based material replacement for 剪映 ([README](https://raw.githubusercontent.com/GuanYixuan/pyJianYingDraft/main/README.md)).

### Inferences
- **Suggested architecture** for the user's system:
  1. ASR (word-level timestamps) → LLM produces a **canonical timeline JSON**. Use a self-defined schema close to Aliyun Timeline or OTIO: tracks/clips with in/out/timelineIn/out, caption segments, b-roll and PiP overlays, BGM.
  2. Validate the JSON against the schema.
  3. Compile to one or more of:
     - (a) **FFmpeg filtergraph via typed-ffmpeg** with NVENC, for fast local or self-hosted renders.
     - (b) **MLT XML** if NLE semantics or Shotcut review are wanted.
     - (c) **Aliyun IMS Timeline** for cheap, elastic cloud renders with built-in ASR/TTS.
     - (d) a **剪映 draft** via pyJianYingDraft/capcut-mate for creators to fine-tune 花字 and effects in 剪映.
  4. Optionally route motion-graphics-heavy generated segments (title cards, animated charts) through Revideo or Remotion/HyperFrames, then composite the rendered clips in step 3.
- JSON/XML timelines are safer for LLM emission than free-form code: they can be validated and diffed, re-rendered deterministically, and kept away from arbitrary code execution.
- Western JSON APIs (Shotstack, JSON2Video) are good for YouTube/TikTok generated content. For Chinese platforms (抖音/视频号/小红书/B站), the 剪映 ecosystem's 花字, effects and fonts matter. Generating 剪映 drafts lets creators reach that look without re-implementing it.

### Gaps
- No independent evaluation was found of how reliably LLMs emit valid Aliyun/Shotstack/OTIO timelines, or 剪映 draft API calls.
- Licensing and terms of use for automating 剪映 drafts and exports (ByteDance ToS) were not researched.
