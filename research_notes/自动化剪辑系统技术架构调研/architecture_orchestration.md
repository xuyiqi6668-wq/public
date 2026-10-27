# AI 剪辑系统端到端架构与编排调研（口播 + 文案视频）

> 调研范围：系统如何拼起来（中间表示、LLM/Agent 决策、流水线编排、媒体基础设施与成本、人在回路 UX、参考架构、合规与分发）。单个模型（ASR、TTS、AI 画面）和渲染框架细节由其他研究员负责，这里只在与架构相关时提及。
> 调研日期：2026-10-27。价格均为抓取当日页面或检索摘要中的数字，标注了来源；第三方转述的数字已明确标出。汇率仅在成本模型中使用，假设 1 USD ≈ 7.1 CNY（这是作者假设，没有引用来源）。

---

## 1. 中间表示（IR）：LLM 能产出、渲染器能消费的 EDL / 时间线

### Takeaway
现有格式没有一个能同时满足"LLM 好写、渲染器直接吃、能交给 NLE 精修"三个要求。OTIO 适合与 Resolve/Premiere 交换；Shotstack/Creatomate/阿里云 IMS 的 JSON 适合各自的云渲染；剪映草稿适合交给剪映精修，但新版本做了加密/混淆。小团队的务实做法是：自己定义一份有版本号的 JSON 时间线（canonical IR，用 Zod/Pydantic 校验），再写适配器导出到 Remotion inputProps、OTIO、剪映草稿，需要时再导出 IMS Timeline。

### Cited Findings

**OpenTimelineIO (OTIO)**
- OTIO 文件是 JSON，结构是嵌套对象树，每个对象都是一个 JSON 字典。维护者强烈建议用 OTIO 库读写，不要自己实现解析器或写入器 — [OTIO File Format Spec](https://jcmorin-opentimelineio.readthedocs.io/en/stable/tutorials/otio-file-format-specification.html)
- Timeline 唯一的子节点是一个名为 "tracks" 的 Stack，Stack 的子节点是 Track，Track 的子节点可以是 Clip、Filler、Stack 或 Track — [OTIO v0.15 spec](https://opentimelineio.readthedocs.io/en/v0.15/tutorials/otio-file-format-specification.html)
- 各类的序列化 schema 文档是自动生成的，并保存在单元测试中，所以可以作为校验生成输出的可靠参考 — [otio-serialized-schema.md](https://github.com/AcademySoftwareFoundation/OpenTimelineIO/blob/v0.16.0/docs/tutorials/otio-serialized-schema.md)
- 适配器：内置 `otio_json`、`otiod`（目录包）、`otioz`（zip 包，含媒体）。`pip install OpenTimelineIO-Plugins` 额外提供 AAF、ale、burnins、cmx_3600（EDL）、fcp_xml、maya_sequencer、svg、xges，这些由社区维护，维护程度不一。`fcpx_xml` 和 `hls_playlist` 是单独的适配器 — [OTIO Adapters](https://opentimelineio.readthedocs.io/en/latest/tutorials/adapters.html)
- DaVinci Resolve 手册说明支持 OTIO 时间线导入导出（`.otio` 或含媒体的 `.otioz`），导出 OTIO 需要 18.5 及以上版本。该资料是 Resolve 18.x 版本 — [Resolve 18.6 manual 镜像](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part1410.htm)
- Adobe 于 2024 年 10 月在 Premiere Pro Beta 中加入 OTIO 导入导出，并提醒外部生成的文件可能有部分序列设置无法自动带入。未找到其已转为正式功能的确认 — [Adobe Community: OTIO import and export beta](https://community.adobe.com/t5/premiere-pro-beta-discussions/now-in-beta-otio-import-and-export/m-p/14985932)
- 跨 NLE 交换时，特效和转场通常无法转换，因为它们的存在、名称和参数都是各软件私有的。2020 年有用户反馈 OTIO 生成的 FCPXML 需要补充缺失的 XML 标签才能在 Resolve 打开 — [KDE forum](https://forum.kde.org/viewtopic.php%3Ff=265&t=165060.html)
- 公开检索没有找到 LLM 直接生成 OTIO 的工作流资料；有一个 R 包 rotio 采用"生成后用 OTIO C++ 参考实现校验"的方式 — [rotio NEWS](https://cran.r-universe.dev/rotio/NEWS)

**MLT XML（Shotcut/Kdenlive 的底层格式）**
- Producer 负责产出帧；Playlist 是一组 `<entry producer in out>`，in/out 是相对于该 producer 的绝对帧号；`<blank length>` 插入空隙；Tractor 的 `<multitrack>` 包含多条 `<track>`；Filter 作用于轨道或输出；Transition 通过 `a_track`/`b_track` 在 in/out 范围内合成两条轨道（例如 `luma` 用于划像/叠化，`mix` 用于混音）。MLT 不采用传统的图模型 — [MLT XML docs](https://www.mltframework.org/docs/mltxml/)

**Shotstack Edit JSON**
- 顶层是 `timeline` + `output`（模板还有 `merge`）。`timeline` 包含 `background`、`fonts`、`tracks[]`（每条轨道含 `clips[]`）、`soundtrack` 和 `cache`。clip 的字段有 `asset{type}`、`start`/`length`（秒；音频的 `length` 可以写 `"end"`）、`transition{in,out}`、`effect`（如 zoomIn）、`filter`、`fit/scale/position/offset/opacity/transform`。视频 asset 有 `trim`、`volume`、`speed`、`crop`、`chromaKey`。schema 中还列出了 CaptionAsset、RichCaptionAsset、HtmlAsset、TextToSpeechAsset、TextToImageAsset、ImageToVideoAsset，以及 Tween（关键帧）schema。模板使用 `{{NAME}}` 占位符配合 `merge:[{find,replace}]`，适合批量生产 — [Shotstack API reference](https://shotstack.io/docs/api/)

**Creatomate RenderScript**
- 顶层字段为 `output_format`（mp4/jpg/png/gif）、`width`、`height`、`elements[]`。`duration` 可省略，省略时根据内容自动计算时长。`composition` 元素有自己的子时间线，可用 `time` 指定起点，用于同步一组元素 — [Creatomate JSON intro](https://creatomate.com/docs/json/introduction)

**阿里云 IMS Timeline（智能媒体服务）**
- 顶层是 `VideoTracks`、`AudioTracks`（两者至少有一个）、`SubtitleTracks`、`EffectTracks`；`ImageTracks` 已废弃，图片并入视频轨。VideoTrack 有 `Type`（普通或 Effect）、`MainTrack`、`TrackShortenMode/TrackExpandMode`（支持 AutoSpeed）。VideoTrackClip 需要 `MediaId` 或 `MediaURL` 二选一，`Type` 可取 Video/Image/GlobalImage/AI_Avatar，时间字段为 `In/Out/MaxOut/Duration/TimelineIn/TimelineOut`，`Speed` 范围 0.1–100，另有 `X/Y/Width/Height/AdaptMode`，可以用 `ClipId/ReferenceClipId` 做对齐。AudioTrackClip 可以是 `Type: AI_TTS`（字段有 Content、Voice、SpeechRate 等）。SubtitleTrackClip 的 `Type: Subtitle` 引用外部 srt/ass 文件，`Type: Text` 用于花字/横幅。转场没有独立对象，而是 `Effect.Type=Transition`；Effect 类型还包括 `AI_ASR`（从音轨生成字幕）。文档未提到关键帧，也未提到字级时间戳字段 — [IMS Timeline configurations](https://help.aliyun.com/en/ims/developer-reference/timeline-configuration-description)
- 轨道叠放顺序与数组顺序一致，第一个元素在最底层 — [IMS Web SDK Timeline 支持说明](https://help.aliyun.com/en/ims/developer-reference/timeline-support-guide-for-editing-and-previewing-the-component-web-sdk)

**Remotion inputProps（编辑器数据模型）**
- 官方推荐的模型是 `BaseItem {from, durationInFrames, id}`，`Item = SolidItem | TextItem | VideoItem`（判别联合，以 `type` 区分），`Track {name, items}`。编辑器把 `tracks` 放在 React state 中，经 `useMemo` 作为 `inputProps` 传给 `<Player>`，时间线组件拿到 `setTracks` 修改同一份状态，预览随之更新。每个 item 渲染为以 `item.id` 为 key 的 `<Sequence>` — [Remotion: Building a timeline](https://www.remotion.dev/docs/building-a-timeline)

**剪映 draft_content.json**
- 剪映草稿以 JSON 存储，只需生成 `draft_content.json` 和 `draft_meta_info.json`，其他文件在打开剪映后自动补全 — [JianYingDraft.PY](https://github.com/notinmood/JianyingDraft.PY)
- pyJianYingDraft（Apache-2.0，约 4.7k stars）支持视频/图片裁剪与变速、关键帧、蒙版、色度键、贴纸、音频淡入淡出、特效/滤镜/转场、富文本与 SRT 导入，以及模板模式（替换素材和文本）。功能表标注支持剪映 5.9 和 10.8。新版剪映的 `draft_content.json` 往往不是可直接读取的明文 JSON，模板模式需要 `fallback_loader`。自动导出只能在 Windows 上用 uiautomation 实现，要求剪映 ≤6.8，7 及以上版本通常不满足条件，并且需要 VIP 导出权限。Linux/macOS 只能生成草稿 — [pyJianYingDraft](https://github.com/GuanYixuan/pyJianYingDraft)
- 来源冲突：另一个仓库称剪映 6+ 对 `draft_content.json` 做了加密，只支持 5.9 及以下版本 — [JianYingDraft.PY (PyPI)](https://pypi.org/project/JianYingDraft.PY/1.0.2)；而 pyJianYingDraft 声称可以生成 10.8 版本的草稿 — [pyJianYingDraft](https://github.com/GuanYixuan/pyJianYingDraft)
- VectCutAPI 的服务端使用 pyJianYingDraft 生成草稿目录（含 draft_content.json 与 material_*.json） — [VectCutAPI docs](https://docsearch.algolia.com/mcp/docs/repo/sun-guannan/vectcutapi)；另有 jianying-mcp 提供 `export_draft` 工具 — [glama: jianying-mcp](https://glama.ai/mcp/servers/hey-jian-wei/jianying-mcp/tools/export_draft)

### Inferences
- **建议的 IR 设计**（综合以上格式，属于作者推断）：
  - 时间单位用整数帧加有理数 fps（例如 `{num:30000, den:1001}`），对应 Remotion 的 `from/durationInFrames` 和 MLT 的帧号 in/out。避免 Shotstack 那种以浮点秒表示，否则在 LLM、编辑器和渲染器之间来回传递会累积误差。导出到 IMS/Shotstack 时再换算为秒。
  - clip 同时保存**源区间**（`sourceIn/sourceOut`，对应 IMS 的 `In/Out`、OTIO 的 `source_range`）和**时间线位置**（`timelineStart`，对应 IMS 的 `TimelineIn`、Remotion 的 `from`）。口播剪辑的核心操作是对源素材做"剪掉若干区间"，最好保留一层 `cuts: [{sourceIn, sourceOut, reason, origin: 'llm'|'rule'|'user'}]`，再由编译步骤生成时间线 clip，方便撤销、解释和人工复核。
  - 字幕不要写死成 SRT/ASS，而是引用 transcript 的 word ID：`captions: [{wordIds:[...], style:'karaoke', ...}]`。transcript 单独作为资产保存（每个词带 begin/end 和置信度）。剪掉片段后，字幕时间由编译器根据剪辑映射重新计算。导出 IMS 或剪映时再生成 ASS/SRT 或文本片段。
  - 特效、转场、关键帧采用判别联合 `{type:'transition', kind:'fade', durationFrames}`。在 schema 中只暴露少量可移植的类型；NLE 私有的特效放在 `vendorExtensions.{remotion|jianying|ims}` 下，因为跨 NLE 时特效本来就无法转换（见 KDE 论坛）。
  - 文档顶层放 `schemaVersion`（semver）和 `generator`（模型/提示词版本），并写迁移函数（v1→v2）。在 TypeScript 中用 Zod 定义（同一份 schema 供 Remotion 组件 props、前端编辑器和 LLM 工具参数使用，再用 zod-to-json-schema 导出给 Python/Pydantic 和 LLM 的 structured output）。
- OTIO 适合作为"导出给专业 NLE"的出口格式，不适合作为 LLM 直接生成的目标：对象树层级深、类型名冗长，官方也不推荐手写。
- 剪映草稿是中国用户最常用的精修出口，但版本兼容性是持续风险，应作为"best-effort 导出"而非核心路径，并锁定已测试的剪映版本。

### Gaps
- 未取到剪映 10.x 草稿加密机制的权威说明；两个开源项目的说法冲突。
- Shotstack Tween/关键帧和 CaptionAsset 字段细节没有读到（页面截断）。
- Creatomate 的 transcript/自动字幕和关键帧字段页面没有抓取。
- 未找到"LLM 直接产出 OTIO/FCPXML"的生产实践资料。

---

## 2. LLM 作为剪辑师 / Agent 式剪辑

### Takeaway
研究和产品趋同于一个模式：先把媒体转成文本（转写文本和画面描述），由 LLM 规划并调用受限的工具/函数（通过 ID 引用片段，不直接输出时间戳），每步由用户审批或可回退，最终交给确定性的渲染器执行。用 VLM 看渲染帧做自我审查已有论文验证（如 Manim 代码生成、多镜头编辑），但厂商自己也说"大多数管线对输出是盲的"，这还是新兴做法。口播剪辑适合"规则 + LLM"混合；文案视频的动效场景适合生成代码（Remotion/HyperFrames）。

### Cited Findings

**学术系统**
- LAVE 发表于 **IUI 2024**（不是 CHI 2024，任务描述中的会议有误），作者来自多伦多大学和 Meta 等 — [arXiv 2402.10294](https://arxiv.org/abs/2402.10294v1)；[项目页](https://dgp.toronto.edu/~bryanw/lave)
- LAVE 实现细节：视频按 1 fps 抽帧，用 LLaVA v1.0 生成帧描述，再由 GPT-4 汇总成标题和摘要（称为 "visual narrations"）。每个视频分配数字 ID 供 LLM 引用。Agent 采用 plan-and-execute 设计（Planning/Executing 两个状态），输出格式为 "GOAL" 加 "ACTIONS" 列表，用户逐个批准动作后，由微调过 function calling 的 gpt-4-0613 转成函数调用。对话历史上限 6,000 token，超出时从最早的消息开始丢弃。动作包括 Footage Overview、Idea Brainstorming、Video Retrieval（ada-002 embedding + ChromaDB）、Storyboarding（输出 JSON `{storyboard, video_ids}`）。Clip Trimming 不属于 agent，而是单独功能，输出 `{segment:{start, end, rationale}}`，精度 1 秒。技术栈为 React + Flask + ffmpeg + V100。局限包括上下文窗口限制素材数量、storyboard 理由出现幻觉、对亮度和运动等描述中缺失的属性剪辑不准 — [LAVE full text (arXiv HTML)](https://arxiv.org/html/2402.10294v1)
- ExpressEdit（IUI '24，KAIST/Yale）：形成性研究从 10 名剪辑师处收集到 176 条多模态命令，约 44.3% 带草图（主要用于标注空间位置）。系统用 LLM 加视觉模型解析命令中的时间、空间和操作指代，并向用户展示每部分是如何被解释的，用户可以调整 — [arXiv 2403.17693](https://arxiv.org/html/2403.17693v1)；[Moonlight review](https://themoonlight.io/review/expressedit-video-editing-with-natural-language-and-sketching)
- EditDuet（arXiv 2509.10761）：由 Editor agent 和 Critic agent 组成的多智能体非线性剪辑系统，通过自监督探索学习 agent 间通信 — [alphaXiv](https://www.alphaxiv.org/overview/2509.10761)
- MMLVE-Agent（arXiv 2608.26809，"Thinking on Shots"）：在图像级和视频级用 VLM QA agent 审查编辑结果（P-NEF 闭环），迭代修正提示，报告 MMLVE-Bench 平均分 81.84（这是生成式视频编辑，不是 NLE 剪辑） — [arXiv 2608.26809](https://arxiv.org/pdf/2608.26809)
- PhysicsSolutionAgent（arXiv 2601.13453）：渲染出视频后，由 VLM 检查元素重叠、文字可读性差、内容被裁切等视觉问题，再把批评转成新提示，让编码 agent 修改 Manim 代码。这是"渲染→VLM 审查→改代码"闭环最直接的公开例子 — [arXiv 2601.13453](https://arxiv.org/pdf/2601.13453)
- LumiVideo（arXiv 2604.02409）：调色 agent，示例中最多迭代 5 轮反思循环 — [arXiv 2604.02409](https://arxiv.org/pdf/2604.02409)

**产品**
- Descript Underlord 是 Descript 内置的 AI co-editor，从项目右侧栏打开，可以代用户执行操作（agentic），而不只是给建议 — [Descript Help: Underlord](https://help.descript.com/hc/en-us/articles/36803785502221-Underlord-beta-Your-AI-co-editor-in-Descript)；它通过编辑转写文本来剪视频，文本和时间线剪辑保持联动 — [Descript blog: Underlord primer](https://www.descript.com/blog/article/underlord-ai-video-editor-primer)
- Underlord 的计费：可以在聊天窗口选择模型；当它调用工具或应用特效时，"agent brain"和工具本身都要计费，同一提示多次运行的费用可能不同 — [Descript Help: Underlord](https://help.descript.com/hc/en-us/articles/36803785502221)
- Shotstack（厂商文章）描述的 agentic 管线分四层：输入 → LLM 编排（"LLM only decides what to do"）→ 工具执行（转写、场景检测、TTS、生图等，返回结构化数据）→ 渲染（时间码 JSON 时间线交给渲染 API）。工具结果回流到 LLM 上下文（例如配音超长 4 秒时，删减脚本或调整时间）。建议让 LLM 远离渲染、确保同一时间线渲染结果一致、按内容理解/脚本/素材检索/时间线构建拆分子 agent。文章承认"大多数管线对输出是盲的"，用视觉模型对照 brief 检查帧是新兴做法 — [Shotstack: How an agentic video editing pipeline works](https://shotstack.io/learn/how-an-agentic-video-editing-pipeline-works/)（注意：Shotstack 销售的正是它推荐的渲染层）

**代码生成路线（Remotion / HyperFrames）**
- Remotion Agent Skills 是一组指令，不是渲染器：它教 agent 正确使用 compositions、sequences、`interpolate()`、`spring()` 等 API。第三方教程中的流程是先调研、写分镜脚本，用户批准分镜后再写代码并渲染。适用于动画演示、数据可视化、UI 演示，不适合传统剪辑和特效 — [Tella blog](https://www.tella.com/blog/how-to-use-remotion-agent-skills-with-claude-code)；[OpenReplay blog](https://blog.openreplay.com/making-videos-claude-code-remotion/)
- HyperFrames（HeyGen，Apache 2.0）：agent 写 HTML/CSS/JS，冻结浏览器时钟后逐帧渲染为 MP4，在本地运行，附带 20 个 agent skills。开源日期（2026-03-10 或 04-17）和 star 数（23k+ 或约 32.5k，v0.7.22 于 2026-06-30 发布）各来源说法不一 — [yuv.ai](https://yuv.ai/blog/heygen-hyperframes-html-video)；[noqta](https://www.noqta.tn/en/blog/heygen-hyperframes-html-to-mp4-ai-agent-video-2026)；[aitoolly](https://aitoolly.com/en/ai-news/article/2026-09-10-heygen-releases-hyperframes-on-github-writing-html-to-render-video-built-for-ai-agents)

**MCP 服务器（2026 年生态，多为厂商榜单，需谨慎）**
- Kinocut：约 87 个本地 FFmpeg 工具（裁剪、拼接、音频、字幕），开源，2026-07-13 收录，在 Claude Desktop/Code/Cursor 上测试过；mcp-video：基于 FFmpeg 的 MCP + Python 库 + CLI（约 29 stars）；有服务器可以根据 JSON 时间线一次执行多轨剪辑；Clipkit 提供 journaled edits，用 FFmpeg/MLT 渲染；fcpxml-mcp 把自然语言转成 FCPXML — [Tella roundup](https://www.tella.com/blog/best-mcp-servers-for-video-editing)；[Enterprise DNA: kinocut](https://enterprisedna.co/directories/mcp/kyanitelabs-kinocut)；[glama: mcp-video](https://glama.ai/mcp/servers/KyaniteLabs/mcp-video)；[fcpxml-mcp](https://enterprisedna.co/directories/mcp/daredev256-fcpxml-mcp-server)

**长上下文能力（与长转写稿策略相关）**
- DeepSeek `deepseek-flash`（V4.1-Flash-1017）和 `deepseek-v4-pro` 的上下文长度均为 1M token，最大输出 384K — [DeepSeek 定价](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)
- 阿里百炼的 qwen3.8-flash 和 qwen3.8-max 最低档位为 0–1M token — [百炼模型价格](https://help.aliyun.com/zh/model-studio/model-pricing)

### Inferences
- **口播的推荐决策模式（混合）**：
  1. 确定性规则先处理：静音和气口（基于 VAD 或 ASR 时间戳间隙阈值）、明显的口癖词（"嗯/啊/那个"白名单配合置信度）、超出阈值的停顿压缩。
  2. LLM 只处理需要语义判断的部分：重复/NG 段（retake，选最后一遍或最流畅的一遍）、跑题段、重点句（用于花字/放大/B-roll）、标题、封面文案、章节。
  3. LLM 输出的不是时间戳，而是对 transcript 的**引用式编辑操作**，例如 `{"op":"delete","fromWord":"w_0412","toWord":"w_0437","reason":"retake"}`。由确定性编译器转换成帧精确的 cuts（并加 padding 和对齐到零交叉点）。这与 LAVE 用数字 ID 引用片段、Descript"文本即时间线"的思路一致，可以避免 LLM 输出浮点时间戳导致的幻觉和误差。
  4. 使用 structured output 或工具调用加 Zod 校验，失败时把校验错误回传重试（最多 N 次）。
- **长转写稿**：5 分钟中文口播约 1,000–1,500 字（按常见语速 200–300 字/分钟估算，作者推断），即使带句级 ID 也只有几千 token，在 1M 上下文的模型中无需分块。只有 30–60 分钟以上的长视频（如直播切片）才需要"按句/段分块 → 局部判断 → 全局汇总"的 map-reduce，或先做章节摘要再逐章处理。不建议把逐字时间戳 JSON 原样放进提示；应压缩为 `[w_0412]那个 [w_0413]我们...` 这样的行内 ID 格式，或只给句级 ID，由编译器回查字级时间。
- **生成 JSON 还是生成代码**：口播剪辑决策（删除哪些段、放哪些花字）用 JSON/工具调用，可校验、可 diff、可回放。文案视频中的动效场景和信息图可以让 LLM 生成 Remotion/HyperFrames 代码，但要限制在沙箱中、限制可用组件，并且必须经过渲染和视觉检查才能上线。更稳的折中是"预制组件库 + LLM 填参数（JSON props）"，代码生成只用于新模板研发（离线由工程师审核后入库）。
- **视觉反馈回路**：对口播最有价值的检查是：字幕是否落入平台 UI 遮挡区、是否越界或与人脸重叠、花字与人脸是否冲突、黑帧/跳帧、首帧是否为显式 AI 标识（若适用）。实现方法是在关键时间点（每个花字/转场出现时、每 N 秒）用低分辨率预览抽帧，交给 VLM（如 qwen3-vl-plus）按清单打分，失败项转成结构化 patch 回到 IR。这类检查应设置最大迭代次数（参考 LumiVideo 的 5 轮），并与确定性检查结合（如用安全区矩形与文本包围盒做几何判断，比 VLM 更便宜也更可靠）。

### Gaps
- 没有找到 Descript、CapCut、Opus Clip 关于 agent 内部架构（工具清单、上下文管理）的公开工程博客。
- 任务中提到的 "VideoAgent"（LLM 工具调用剪辑）这次检索没有命中，未核实。
- 剪映/CapCut AI 功能（如"AI 剪口播"）的内部实现无公开技术资料。

---

## 3. 流水线编排：工作流引擎、幂等、缓存、重试、GPU/CPU 池与扩缩容

### Takeaway
多步媒体任务（上传 → 转码/代理 → ASR → LLM 决策 → 人工审阅 → 渲染 → 发布）本质上是长时、可失败、需要等待人工的 DAG，适合 durable execution。1–5 人团队起步：Postgres 任务表 + Redis 队列（BullMQ/Celery）或托管的 Trigger.dev。出现长时等待人审、多步补偿和大规模并发后，再迁移到 Temporal。渲染和转码用 K8s Job + KEDA 按队列长度扩缩，或用 Remotion Lambda/Modal 这类 serverless。

### Cited Findings

**Temporal（durable execution）**
- Start-To-Close 是单次 Activity 执行的最长时间，对每次重试都生效，必须设置并长于 Activity 合理的最长耗时。Worker 失联或崩溃时 Server 本身检测不到，要靠这个超时触发重试。Schedule-To-Close 限制整个 Activity（含所有重试）的总时长，默认无限 — [Temporal: Detecting activity failures](https://docs.temporal.io/encyclopedia/detecting-activity-failures)
- Heartbeat Timeout 是两次心跳之间允许的最长间隔，不能超过 Start-To-Close。心跳可以携带进度 payload，重试时下一次尝试可以读取并从断点继续。SDK 会对心跳节流（取 0.8×Heartbeat Timeout 与 60s 中的较小值），失败前的最后一次心跳不节流。取消信号只在心跳时送达，因此从不发心跳的 Activity 无法被取消。长任务应使用较短的心跳超时，并在心跳中保存进度（文档举的例子正是读取大型 S3 文件、ML 训练） — [同上](https://docs.temporal.io/encyclopedia/detecting-activity-failures)

**Trigger.dev / Inngest / BullMQ**
- Trigger.dev 官方文档以 FFmpeg 为例：一个 task 处理视频、上传 S3、更新数据库并发邮件 — [Trigger.dev](https://trigger.dev)；它可以运行 Python 脚本、安装系统包、使用 FFmpeg 和浏览器自动化 — [Enterprise DNA: trigger.dev](https://enterprisedna.co/directories/open-source/trigger-dev)
- 第三方对比称：Inngest 不运行你的计算，而是通过 HTTP 调用你的 serverless 端点，每个 step 仍受 serverless 执行时长限制（约 15 分钟）；Trigger.dev 在长生命周期容器中直接运行代码，不需要拆分 step — [openalternative](https://openalternative.co/trigger)（第三方说法，未与官方核对）
- BullMQ 是基于 Redis 的 Node.js 任务队列库，适合想要轻量队列且完全掌控技术栈的团队（Trigger.dev 自家对比页的说法） — [Trigger.dev vs BullMQ](https://trigger.dev/vs/bullmq)

**K8s + KEDA**
- KEDA ScaledJob 为每个事件创建一个 Kubernetes Job，Job 取一个事件、运行到结束后退出，主要用于长时执行。队列长度 scaler 按 target（单个 Job 预期消费的消息数）计算，`maxReplicaCount` 限制并发，正在运行的 Job 也计入。默认每 30 秒轮询一次 trigger。Job 可以设置 `activeDeadlineSeconds` 和 `backoffLimit`（默认 6）。更新 ScaledJob 时默认会终止正在运行的 Job（对正在进行的渲染有影响，应改用相应的 rollout 策略） — [KEDA: Scaling Jobs](https://github.com/kedacore/keda-docs/blob/main/content/docs/2.12/concepts/scaling-jobs.md)；[keda.sh](https://keda.sh/docs/2.8/concepts/scaling-jobs/)

**Serverless GPU/CPU**
- Modal 按需价格（由每秒价格换算为每小时）：T4 $0.59、L4 $0.80、A10 $1.10、L40S $1.95、A100 40GB $2.10、A100 80GB $2.50、H100 $3.95；CPU 约 $0.047/物理核·小时，内存约 $0.008/GiB·小时；Starter 每月送 $30 额度 — [Modal pricing](https://modal.com/pricing)
- 阿里云函数计算（FC）GPU：旧版（FC 2.0，2023-09-01 起）按阶梯计费，第一档 0.00011 元/GB·秒（按显存计）。新版 FC 3.0 改为 CU 计费，活跃态系数为 tesla.1 2.1、ampere.1 1.8、ada.1 1.7、hopper.1 2.31，浅休眠系数明显更低（tesla.1 0.5、ada.1 0.2）。`fc.gpu.tesla.1` 性能约等于 T4（16GB，可切分为 1–16GB vGPU）。计费按配置规格 × 时长，而不是实际占用 — [FC 3.0 计费概述](https://help.aliyun.com/zh/functioncompute/fc-3-0/product-overview/billing-overview-1)；[FC 实例规格](https://help.aliyun.com/zh/functioncompute/instance-types-and-specifications)（CU 与人民币的换算没有查到）

**开源项目里的编排做法（作为反例/起点）**
- MoneyPrinterTurbo（约 135.7k stars）：提供 API（`main.py`，端口 8080 带 `/docs`、`/redoc`）、Streamlit WebUI、CLI 和 Agent Skill。产物存放在 `storage/tasks`。批量 manifest 上限 100 个任务、1 MiB，任务**顺序执行**，单个失败不影响其他任务 — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
- NarratoAI（v0.8.6，2026-07-16）：Python 3.12 + uv + Streamlit + Docker Compose，用 Qwen2-VL/TwelveLabs 做画面理解，LLM 走 OpenAI 兼容接口（v0.7.7 出于安全原因移除了 LiteLLM），用 Fun-ASR 转写字幕。README 未提到任务队列 — [NarratoAI](https://github.com/linyqh/NarratoAI)

### Inferences
- **推荐的步骤划分与幂等键**（作者推断）：每个步骤是纯函数式的 `artifact = f(inputs, params, version)`，缓存键为 `sha256(source_bytes) + step_name + step_version + hash(params)`，产物写到 `oss://bucket/cache/{key}/...`，并在 Postgres `artifacts` 表登记。重跑时命中缓存直接跳过。ASR 结果、代理文件、波形、抽帧和 VLM 描述最值得缓存（与上游素材同生命周期）；LLM 决策按 `prompt_version + model` 缓存，以便 A/B 测试和回放。
- **建议的 DAG**：`ingest(探测/校验) → [proxy_transcode ‖ audio_extract] → asr → rules_cut → llm_decide → compile_timeline → (human_review: 等待信号) → render(分片?) → qc(VLM+几何检查) → aigc_label(元数据写入) → publish`。其中 `human_review` 可能等待数小时甚至数天，这是 Temporal 一类引擎（signal + 长时等待不占资源）最有优势的地方；用 BullMQ 时需要把它拆成"两个独立 job + 数据库状态机"。
- **队列分层**：`cpu-light`（探测、LLM 调用、元数据）、`cpu-heavy`（FFmpeg 转码/渲染）、`gpu`（自托管 ASR/VLM/TTS/抠像）、`render`（Remotion Chromium 渲染，吃 CPU 和内存）。每个队列设置独立的并发上限，并按租户限流，避免某个用户的批量任务把共享渲染池占满（参考 MoneyPrinterTurbo 的批量顺序执行，可以改为"每租户并发 N + 全局公平调度"）。
- **进度上报**：FFmpeg 的 `-progress pipe:1` 和 Remotion 的 `onProgress` 回调 → 写入 Redis/DB → 通过 SSE/WebSocket 推送到前端。在 Temporal 中，进度同时写入 heartbeat details，崩溃后可以续跑。
- **起步路径**：0→1 阶段使用托管 ASR/LLM API（不用自建 GPU），渲染用单机或 2–3 台 CPU 机器跑 FFmpeg/Remotion，加 BullMQ（TS 栈）或 Celery/Dramatiq（Python 栈）。月渲染量上来后，再引入 KEDA ScaledJob 或 Remotion Lambda 分片，自托管 FunASR/SenseVoice 迁移到 Modal 或 FC GPU 按秒计费。

### Gaps
- 没有找到公开的"Temporal 用于视频转码/渲染"的生产案例博客（只找到 ittybit 的指南链接，未读取全文：[ittybit guide](https://ittybit.com/guides/temporal)）。
- Prefect、Argo Workflows、Ray 在媒体场景中的对比资料这次没有检索。
- FC 3.0 的 CU 单价和 RunPod 价格没有查到。

---

## 4. 媒体基础设施与成本模型

### Takeaway
5 分钟口播端到端的边际云成本大约在 **0.7–2 元人民币**（约 0.14–0.4 元/分钟），渲染和存储/分发占大头，ASR 和 LLM 都很便宜（各几分到几毛钱）。使用阿里云 IMS 托管剪辑合成会贵一个数量级（2K 高级剪辑 0.63 元/分钟）。Remotion 对 4 人以上团队还要收许可费（Automator 每次渲染 $0.01，最低 $100/月）。

### Cited Findings

**渲染与分片**
- Remotion Lambda 的并发数 = 帧数 / framesPerLambda，最多 200 个函数，framesPerLambda 至少为 4。默认 framesPerLambda 不低于 20，30fps 下 10 分钟以内的视频并发数在 75–150 之间插值。framesPerLambda 越小，并发越高、耗时越短，但开销更大、更贵，到一定程度后收益递减。内存越大，CPU 按比例增加，成本也线性增加 — [Remotion Lambda concurrency](https://www.remotion.dev/docs/lambda/concurrency)；[optimizing speed](https://remotion.dev/docs/lambda/optimizing-speed)
- Remotion 官网标称 $0.01/分钟渲染视频，这是以 framesPerLambda=12、ARM64 2048MB、热启动、us-east-1 渲染官方预告片得出的估算，不含 S3 和流量费用 — [remotion.dev/lambda](https://remotion.dev/lambda)
- Remotion Lambda 官方成本示例（2048MB，默认并发，us-east-1，v4.0.381）：1 分钟视频（素材在同一 S3 桶）热启动 $0.017/18.91s、冷启动 $0.021；10 分钟远程 HD 视频热启动 $0.103/56s；10 秒远程 4K 视频 $0.013/45s。在视频中嵌入视频会显著增加成本。数据传输、S3 存储和 CloudWatch 日志不计入 — [Remotion cost example](https://www.remotion.dev/docs/lambda/cost-example)
- Remotion 许可：个人和小公司免费；4 人及以上团队需要 Company License — [cost example 页](https://www.remotion.dev/docs/lambda/cost-example)；Creator $25/seat/月，Automator $0.01/次渲染且最低 $100/月，Enterprise 起价 $500/月 — [remotion.pro](https://www.remotion.pro/)
- 阿里云视频点播云剪辑示例价：基础剪辑 LD（640×480）0.0217 元/分钟；高级剪辑 2K（2560×1440）0.63 元/分钟；直播剪辑专业版 1080P 0.375 元/分钟（属于另一个产品）。1080P 剪辑合成的单价没有直接查到 — [VOD/IMS 计费示例（检索摘要）](https://help.aliyun.com/document_detail/188310.html)；[IMS 直播剪辑](https://help.aliyun.com/zh/ims/live-clip)

**NVENC**
- NVIDIA 将消费级 GeForce 的 NVENC 并发编码会话数从 3 提高到 5（Maxwell 2 至 Ada），数据中心和专业卡没有会话上限 — [Tom's Hardware](https://tomshardware.com/news/nvidia-increases-concurrent-nvenc-sessions-on-consumer-gpus)；冲突：Wikipedia 称 2025 年消费卡上限为 12 路 — [Wikipedia: NVENC](https://en.wikipedia.org/wiki/NVENC)；Livepeer 文档称消费卡通常 2–3 路后就会降速或报错 — [Livepeer GPU support](https://docs.livepeer.org/v2/resources/references/go-livepeer/gpu-support)
- AD102 有 3 个 NVENC 单元，但 RTX 4090 只启用 2 个 — [Wikipedia: NVENC](https://en.wikipedia.org/wiki/NVENC)

**存储与分发**
- 阿里云 OSS（第三方整理，非官方页面）：标准存储本地冗余约 0.09 元/GB/月，同城冗余约 0.12 元/GB/月；外网流出流量闲时（00–08 点）0.25 元/GB，忙时 0.50 元/GB；CDN 回源流量约 0.15 元/GB；上传流量和同地域内网流出免费。旧公告中有忙时 0.75 元/GB 的说法，可能已过时 — [阿里云开发者社区文章](https://developer.aliyun.com/article/1691983)
- Cloudflare Stream：存储 $5/每 1,000 分钟/月，播放 $1/每 1,000 分钟，上传和编码免费，带宽包含在播放分钟数中；Media Transformations 为 $0.50/每 1,000 次（每月免费 5,000 次） — [Cloudflare Stream pricing](https://developers.cloudflare.com/stream/pricing/)

**ASR 价格（阿里云百炼）**
- 录音文件识别：`fun-asr` 0.00022 元/秒，免费额度 36,000 秒（10 小时，开通后 90 天内有效）（检索摘要引用官方页面，抓取页面时未直接看到价格表） — [百炼: 录音文件识别](https://help.aliyun.com/zh/model-studio/recording-file-recognition)；`fun-asr-realtime` 0.00033 元/秒 — [fun-asr-realtime](https://help.aliyun.com/zh/model-studio/fun-asr-realtime)
- 单个文件 ≤2GB、≤12 小时。Fun-ASR 的输出包含词级 begin_time/end_time 数组；Qwen3-ASR-Flash-Filetrans 设置 `enable_words=true` 后返回字级时间戳；说话人分离建议音频 ≤2 小时且为单声道 — [百炼: 录音文件识别](https://help.aliyun.com/zh/model-studio/recording-file-recognition)
- 当前百炼 ASR 模型列表包括 qwen-audio-3.1-asr-flash-filetrans、fun-asr、qwen3-asr-flash-filetrans、paraformer-v2 等 — [百炼 ASR 模型](https://help.aliyun.com/zh/model-studio/asr-model)

**LLM / VLM 价格**
- DeepSeek（元/百万 token，2026-10）：`deepseek-flash`（V4.1-Flash-1017）高峰时段输入 2（缓存命中 0.04）、输出 8，空闲时段减半（1 / 0.02 / 4）；`deepseek-v4-pro` 高峰时段输入 9（缓存命中 0.30）、输出 27，空闲时段 4.5 / 0.15 / 13.5；上下文 1M。高峰时段为北京时间工作日 9–12 点和 14–18 点 — [DeepSeek 定价](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)
- 阿里百炼（北京地域原价，元/百万 token，最低档）：qwen3.8-flash 输入 0.8/输出 2.7；qwen3.5-flash 0.2/2；qwen3.7-plus 2/8（限时 8 折）；qwen3.8-max 12/36；qwen3-vl-plus（≤32K）输入 1/输出 10。百炼上的 deepseek-v4.1-flash 是峰谷价 2/8 与 1/4 — [百炼模型价格](https://help.aliyun.com/zh/model-studio/model-pricing)
- 自托管 GPU 参考：Modal L4 $0.80/小时，T4 $0.59/小时 — [Modal pricing](https://modal.com/pricing)

### Inferences

**5 分钟口播成本模型**（1080×1920、30fps，单条视频，作者推断，所有假设已标明）

| 环节 | 假设 | 计算 | 成本（元） |
|---|---|---|---|
| ASR | fun-asr，300 秒 | 300 × 0.00022 | **0.066** |
| LLM 决策（经济档） | deepseek-flash 高峰价；3 次调用合计 60k 输入 + 8k 输出 token | 0.06×2 + 0.008×8 | **0.18**（空闲时段 0.09） |
| LLM 决策（高配档） | deepseek-v4-pro 高峰价，token 量同上 | 0.06×9 + 0.008×27 | **0.76** |
| VLM 质检 | qwen3-vl-plus；30 帧，假设每帧约 1k token，共 30k 输入 + 2k 输出（每帧 token 数为假设） | 0.03×1 + 0.002×10 | **0.05** |
| 渲染 A：自托管 FFmpeg/CPU | 假设 8 物理核 × 3 分钟，16GiB；按 Modal CPU 价 | (0.4 核·时 × $0.047 + 0.8 GiB·时 × $0.008) ≈ $0.025 | **≈0.18** |
| 渲染 B：Remotion Lambda | 参考官方示例插值（1 分钟 $0.017、10 分钟 HD $0.103），5 分钟且嵌入视频取 $0.05–0.10 | | **≈0.36–0.71** |
| Remotion 许可（≥4 人） | Automator $0.01/次 | | **0.07**（最低 $100/月） |
| 渲染 C：阿里云 IMS 高级剪辑 | 只有 2K 档价格 0.63 元/分钟 | 5 × 0.63 | **3.15**（1080P 价格未知） |
| 存储 | 原片约 375MB（10Mbps）+ 代理约 56MB（1.5Mbps）+ 成片约 300MB（8Mbps）≈0.73GB，同城冗余 1 个月 | 0.73 × 0.12 | **0.09** |
| 分发/下载 | 成片下载 1 次 + 预览约 0.1GB，忙时外网价 | 0.4 × 0.5 | **0.2** |

- **经济档合计**（fun-asr + deepseek-flash + VLM + 自托管 FFmpeg + OSS）：≈0.066+0.18+0.05+0.18+0.29 ≈ **0.77 元/条 ≈ 0.15 元/分钟（约 $0.02/分钟）**。
- **高配档合计**（deepseek-v4-pro + Remotion Lambda + 许可）：≈0.066+0.76+0.05+0.71+0.07+0.29 ≈ **1.95 元/条 ≈ 0.39 元/分钟（约 $0.055/分钟）**。
- **托管 IMS 档**：渲染一项就 ≥3 元，适合不想自建渲染、需要 IMS 模板/数字人/AI_TTS 一体化的场景。
- 结论：AI 部分（ASR + LLM + VLM）只占几毛钱，**真正的成本杠杆是渲染方式、存储生命周期（原片/代理在 7–30 天后转低频或删除）和外网流量（预览走 CDN/HLS，用户下载走带时效的签名 URL）**。人工复核时间远比云成本贵，UX 设计（第 5 节）对单位经济的影响更大。
- 文案视频还要加 TTS 和 AI 画面（文生图/视频）费用，这部分通常远超上述成本，由其他研究员估算。

**基础设施建议**（作者推断）
- 上传：浏览器直传 OSS（STS 临时凭证 + 分片上传），完成后由 OSS 事件或回调触发 `ingest`。
- 代理：统一转成 720p/540p H.264 的低码率 proxy，加关键帧密集的 GOP（例如每秒一个关键帧），方便浏览器 seek，加上波形 JSON 和缩略图雪碧图。浏览器预览直接用 proxy MP4，或者 HLS（短视频用 MP4 + Range 请求就够了；长素材才需要 HLS）。
- 最终渲染用原片（或 mezzanine），走"proxy 编辑、原片渲染"的经典 offline/online 模式，IR 中的 `sourceIn/Out` 对两者通用，前提是 proxy 保留原始帧率和时间基。
- 分片渲染：Remotion Lambda 本身就是"按帧区间分块渲染 + 拼接"。自建时可以按场景边界或固定 N 秒分块，分别编码后用 FFmpeg concat demuxer 拼接（需要统一编码参数，分块边界对齐 GOP，音频单独整轨渲染后再 mux，避免块边界出现爆音）。对 5 分钟口播，单机一次渲染通常就够快，分片只在批量出片或长视频时才值得做。
- NVENC：数据中心卡（L4/T4/A10）没有会话限制，适合转码农场；消费卡受 3/5 路会话限制（各来源冲突）。Remotion/Chromium 的渲染瓶颈通常在逐帧截图，而不在编码，GPU 编码的收益有限，需要实测。

### Gaps
- 阿里云 OSS 和 CDN 的价格来自第三方整理；官方价格页需要 JS 渲染，没有抓到。
- 阿里云 IMS 1080P 剪辑合成单价、火山引擎 ASR（豆包语音）价格没有查到。
- 没有找到权威的 NVENC 1080p H.264 吞吐（fps）数据；需要自测。
- VLM 图像 token 计数规则（qwen3-vl 每张图多少 token）没有查证，成本模型中是假设值。

---

## 5. 人在回路 UX："AI 起草，人微调"

### Takeaway
成熟产品和研究系统都让 AI 生成可撤销、可解释的草稿，人在文本/时间线两种视图中批改：Descript 用文本驱动时间线，Underlord 的编辑需要审批；LAVE 逐个动作审批；ExpressEdit 展示每部分指令是如何被解释的。浏览器端用 Remotion Player 共享同一份 IR 做实时预览是最省事的做法（Player 开源，官方 Timeline 组件付费）。精修出口优先做剪映草稿（国内用户）和 OTIO（Resolve/Premiere）。

### Cited Findings
- Remotion Player 是开源的，可以在浏览器中预览 React 视频并响应用户输入；官方 `<Timeline>`（多轨拖拽、快捷键、缩放）在 remotion.pro 上付费购买，受 Remotion License 加自身许可约束；也可以按文档自建时间线 — [Remotion Player](https://remotion.dev/player)；[Remotion Timeline](https://companies.remotion.dev/timeline)；[Building a timeline](https://www.remotion.dev/docs/building-a-timeline)
- 社区有 Next.js + Tailwind + Remotion 的 Web 编辑器教程 — [DEV Community](https://dev.to/sambowenhughes/building-a-web-based-video-editor-with-remotion-nextjs-and-tailwind-css-pfg)
- Underlord：在聊天中链式执行指令，编辑结果可以接受或拒绝（第三方总结） — [howaiworks.ai](https://howaiworks.ai/ai-tools/descript.md)；它通过转写文本剪辑视频，文本与时间线联动 — [Descript blog](https://www.descript.com/blog/article/underlord-ai-video-editor-primer)
- 有第三方评论认为 Underlord 在给出明确创意方向时效果最好 — [gotranscript](https://gotranscript.com/public/underlord-ai-editing-needs-clear-creative-direction)
- LAVE：agent 计划中的动作需要用户逐个批准才执行，用户也可以直接用 UI 操作来修正 agent 的结果；设计启示包括"自适应辅助（可开关）""为不熟悉 LLM 的用户提供指引""警惕 LLM 建议窄化创意" — [LAVE (arXiv HTML)](https://arxiv.org/html/2402.10294v1)
- ExpressEdit：向用户展示命令各部分的解释，用户可以调整建议或自己编辑；研究发现能帮助新手表达剪辑意图 — [ExpressEdit](https://arxiv.org/html/2403.17693v1)
- 阿里云 IMS 提供 Web SDK 剪辑和预览组件（有专门的 Timeline 支持说明），并有云剪辑工程、模板工厂、批量智能一键成片等 API 族 — [IMS Web SDK Timeline 支持说明](https://help.aliyun.com/en/ims/developer-reference/timeline-support-guide-for-editing-and-previewing-the-component-web-sdk)；[IMS 智能生产](https://help.aliyun.com/zh/ims/user-guide/intelligent-production-1/)；[IMS 高级模板](https://help.aliyun.com/zh/ims/user-guide/advanced-template/)
- 批量/模板：Shotstack 模板用 `{{NAME}}` merge 字段批量渲染 — [Shotstack API](https://shotstack.io/docs/api/)；MoneyPrinterTurbo CLI 支持批量 manifest（≤100 任务） — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
- 精修出口：pyJianYingDraft 生成剪映草稿（Linux/macOS 只能生成，导出需在 Windows 剪映中完成） — [pyJianYingDraft](https://github.com/GuanYixuan/pyJianYingDraft)；OTIO → Resolve（18.5+）/ Premiere（2024 beta） — [Resolve manual](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part1410.htm)；[Adobe Community](https://community.adobe.com/t5/premiere-pro-beta-discussions/now-in-beta-otio-import-and-export/m-p/14985932)
- 有一个商业 React 编辑器（React Video Editor）的需求板在调研以 OTIO 作为导出到 DaVinci/Premiere/CapCut 的标准 — [reactvideoeditor featurebase](https://reactvideoeditor.featurebase.app/p/investigate-opentimelineio-standard)

### Inferences
- **口播编辑器的核心交互**（作者推断）：左侧是 transcript 视图，AI 删除的词用删除线并按原因着色（静音/口癖/NG/跑题），可以一键恢复；右侧是 Remotion Player 预览；下方是简化时间线（主轨 + 花字/B-roll/BGM/字幕轨）。每个 AI 决策都带 `reason` 和 `confidence`，低置信度的放进"待确认"队列，让人只复核少数片段，而不用整片重看。这是降低人工成本的关键。
- **Brand Kit / 模板**：在 IR 中把 `style` 与 `content` 分离，模板 = 一组 Remotion 组件 + 默认 style token（字体、配色、字幕样式、片头片尾、LOGO 位置、安全区预设：抖音/小红书/视频号）。批量生产 = 同一模板 × 多份素材，每条由 LLM 填 props，再并发渲染。
- **"AI 起草 → 人工微调 → 再交给 AI"**：人工修改应写回 IR 的 `origin:'user'` 并加锁。后续 LLM 重跑时把这些作为约束（不得覆盖），否则会出现"AI 把人改过的又改回去"的体验问题。
- 前端预览和最终渲染使用同一套 Remotion 组件，可以保证所见即所得；若最终渲染走 FFmpeg/IMS，需要维护两套实现，容易出现预览与成片不一致，这是选型时的一个重要考量。

### Gaps
- 没有找到 CapCut/剪映"AI 剪口播"、Opus Clip 编辑界面的公开交互或数据流文档。
- Remotion `<Timeline>` 的价格没有取到。

---

## 6. 参考架构

### Takeaway
公开可读的"完整架构"主要来自开源项目（MoneyPrinterTurbo、NarratoAI，单体 Python + Streamlit + MoviePy/FFmpeg，没有分布式队列）、学术原型（LAVE：React + Flask + ffmpeg）和厂商文章（Shotstack 四层 agent 管线、Remotion 编辑器 + Lambda）。Opus Clip、Captions、Descript 和国内大厂（剪映、火山引擎）都没有找到可靠的系统架构工程博客。阿里云 IMS 的 API 分层（工程/模板/批量一键成片/Timeline）是国内最完整的"智能剪辑云服务"公开参考。

### Cited Findings
- **MoneyPrinterTurbo**（文案视频）：LLM 生成或改写文案 → 模型提取素材搜索关键词 → 从 Pexels/Pixabay/Coverr、AI 视频服务或本地素材取素材 → TTS（Edge TTS 免费，Azure 等）→ 字幕（`edge` 模式用 TTS 时间戳，`whisper` 模式用 faster-whisper）→ 剪辑合成（用到 ffmpeg）。提供 API、WebUI、CLI 和 Agent Skill，批量任务顺序执行 — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
- **NarratoAI**（解说/二创）：VLM 理解画面（Qwen2-VL / TwelveLabs Pegasus）→ LLM 写解说文案 → TTS（豆包、腾讯云、IndexTTS 克隆等）→ Fun-ASR 字幕 → 合成。"导出剪映草稿"和"自动匹配片段与配音"仍在 roadmap 上 — [NarratoAI](https://github.com/linyqh/NarratoAI)
- **LAVE**：React 前端 + Flask 后端 + ffmpeg 渲染，用 V100 做预处理（LLaVA 帧描述），向量库为 ChromaDB — [LAVE (arXiv HTML)](https://arxiv.org/html/2402.10294v1)
- **Shotstack agentic pipeline**：输入 → LLM 编排 → 工具执行（感知类/素材类）→ 渲染 API，并建议按子 agent 拆分 — [Shotstack](https://shotstack.io/learn/how-an-agentic-video-editing-pipeline-works/)
- **Remotion 编辑器参考**：React state 中的 tracks → Player inputProps；官方推荐 Jonny Burger 的 "Build a video editor in React" 演讲（涵盖 timeline、canvas、captioning、export） — [Remotion: Building a timeline](https://www.remotion.dev/docs/building-a-timeline)
- **阿里云 IMS**：Timeline JSON（第 1 节）、Web SDK 剪辑组件、云剪辑工程、模板工厂、批量智能一键成片，SubmitMediaProducingJob 提交合成 — [IMS Timeline](https://help.aliyun.com/en/ims/developer-reference/timeline-configuration-description)；[SubmitMediaProducingJob](https://www.alibabacloud.com/help/zh/ims/developer-reference/api-ice-2020-11-09-submitmediaproducingjob)；[IMS 视频生成与剪辑 API 目录](https://help.aliyun.com/zh/ims/developer-reference/api-ice-2020-11-09-dir-video-generation-and-editing/)
- **火山引擎/字节**：公开报道只提到基于豆包大模型和视频云自研算法，以及自研编解码芯片在同等压缩效率下成本节省 95% 以上，没有涉及剪辑系统架构 — [量子位 2024-10](https://www.qbitai.com/2024/10/207363.html)。关于剪映"端云协同、设备性能不足时把渲染分流到云端"的说法只见于来源不明的 CSDN 转载，可信度低 — [CSDN](https://adg.csdn.net/694cf3ca5b9f5f31781aa39e.html)
- **VectCutAPI**：服务化的剪映草稿生成（基于 pyJianYingDraft），属于"云端生成 → 本地剪映精修"的国内常见模式 — [VectCutAPI docs](https://docsearch.algolia.com/mcp/docs/repo/sun-guannan/vectcutapi)

### Inferences
- **为 1–5 人团队推荐的参考架构**（作者推断，综合以上来源）：
  - **前端**：Next.js + Remotion Player + 自建简化时间线 + transcript 编辑器；
  - **API**：TypeScript（与 Remotion 共享 Zod schema）或 Python FastAPI（AI 生态更好），只选一种主语言，另一种作为 worker；
  - **数据**：Postgres（projects、assets、artifacts、timelines（JSONB + schemaVersion）、jobs、publish_records）；
  - **队列/编排**：Phase 1 用 BullMQ 或 Trigger.dev；Phase 2 用 Temporal（需要人审等待、跨天流程、补偿时）；
  - **Workers**：`media`（FFmpeg 探测/代理/抽帧/音频）、`ai`（ASR/LLM/VLM 的 API 调用，CPU 即可）、`render`（Remotion renderMedia，CPU 容器或 Lambda）、可选 `gpu`（自托管 FunASR/SenseVoice/抠像，部署在 Modal 或 FC GPU）；
  - **存储**：OSS（raw/、proxy/、cache/、renders/ 四个前缀，各自配置生命周期规则）+ CDN；
  - **出口**：MP4（带 AIGC 隐式标识）、剪映草稿 zip、OTIO、SRT/ASS；
  - **发布**：抖音开放平台 API；视频号/小红书没有官方开放 API，只能让用户手动发布或用 RPA（有合规风险）。
- 先把口播链路做成"同步可演示、异步可扩展"：同一个 `pipeline(steps)` 定义既能在本地脚本中顺序运行（便于调试和评测），也能由队列 worker 分步执行。这样可以避免过早引入分布式复杂度。

### Gaps
- Opus Clip、Captions、Descript 的系统架构/基础设施博客没有找到（检索命中的都是无关的图形学 "clipping" 结果）。
- 字节/剪映、腾讯云智能剪辑的工程架构分享（如 QCon、火山引擎 Force 大会演讲）没有找到可读的原文。
- Mux 的定价和用法没有检索。

---

## 7. 合规与平台分发

### Takeaway
《人工智能生成合成内容标识办法》和强制性国标 GB 45438-2025 自 2025-09-01 起施行：生成服务提供者必须在文件元数据中写入隐式标识（AIGC 属性、提供者编码、内容编号），对视频还要求在"起始画面和播放周边"加显式提示；传播平台（抖音等）会读写元数据并自动检测、打标。对剪辑系统而言，用 TTS 或 AI 画面生成的文案视频明确属于生成合成内容；仅做剪辑和字幕的口播是否必须标识存在灰区，最好提供"标识开关 + 默认开启隐式标识 + 日志留存"。抖音有正式的上传/发布 API（≤4GB、≤15 分钟、每用户每应用每天 75 条）；视频号和小红书没有官方开放的发布 API；B站开放平台有投稿接口，但能找到的文档较旧。

### Cited Findings

**法规原文（网信办等四部门）**
- 第三条：显式标识是"在生成合成内容或者交互场景界面中添加的，以文字、声音、图形等方式呈现并可以被用户明显感知到的标识"；隐式标识是"采取技术措施在生成合成内容文件数据中添加的，不易被用户明显感知到的标识" — [网信办: 标识办法](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 第四条（四）："在视频起始画面和视频播放周边的适当位置添加显著的提示标识，可以在视频末尾和中间适当位置添加显著的提示标识" — [同上](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 第五条："在生成合成内容的文件元数据中添加隐式标识，隐式标识包含生成合成内容属性信息、服务提供者名称或者编码、内容编号等制作要素信息" — [同上](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 第六条（传播平台）：在文件元数据中添加"生成合成内容属性信息、传播平台名称或者编码、内容编号等传播要素信息" — [同上](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 第八条：服务提供者应在用户服务协议中说明标识方法和样式；第九条：用户申请不含显式标识的内容时，可以在协议中明确用户义务后提供，并"依法留存提供对象信息等相关日志不少于六个月"；第十条：用户发布时"应当主动声明并使用服务提供者提供的标识功能"，"任何组织和个人不得恶意删除、篡改、伪造、隐匿"标识，也不得为此提供工具或服务 — [同上](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 施行日期为 2025-09-01，与强制性国标 GB 45438-2025《网络安全技术 人工智能生成合成内容标识方法》同步施行 — [新华网](https://www.news.cn/politics/20250314/b7a24028f2924b7681e6ed1bfbd8fade/c.html)；[IT之家](https://www.ithome.com/0/837/887.htm)

**隐式标识的技术格式**
- TC260 视频文件元数据隐式标识实践指南：可用原生结构或 XMP 命名空间嵌入，必选字段为 `Label`、`ContentProducer`、`ProduceID`、`ContentPropagator`、`PropagateID`，并规定了存储位置、键名和序列化格式。该指南以 GB 45438-2025 为规范性引用 — [Digital Policy Alert: TC260 video guideline](https://digitalpolicyalert.org/event/33150-tc260-adopted-guidelines-on-identification-methods-for-ai-generated-synthetic-video-content)
- GB 45438-2025 附录 E 规定文件元数据隐式标识格式 — [Sidley 托管的标准 PDF](https://www.sidley.com/en/-/media/resource-pages/ai-monitor/20250314-china-standard-gb-454382025-labeling-method-for-content-generated-by-ai.pdf?la=en)（PDF 超过 10MB，未能抓取正文）
- 阿里云 SASE 的视频 AIGC 标识接口（厂商实现参考）：元数据通过 `MetadataControl.XmpKvBase64` 传入，键前缀为 `AIGC=`（标准 Base64，需补位）。字段：`Label`（1 = AI 生成；2、3 仅供传播平台使用）、`ContentProducer`（由格式版本码、主体类型、绑定标志、统一社会信用代码和服务类型/模型扩展位组成）、`ProduceID`、`ReservedCode1`（制作方完整性校验，可用 ContentProducer + ProduceID 的哈希）、`ContentPropagator`、`PropagateID`、`ReservedCode2`。显式水印参数有 VisibleText、Mode（pos/bottom-right）、Opacity、FontSize、FontColor 等 — [阿里云: AIGC 视频标识添加指南](https://help.aliyun.com/zh/sase/getting-started/aigc-video-logo-add-guide)

**平台执行（抖音）**
- 抖音 AI 内容标识规则自 2025-09-01 起试行：上线 AI 内容标识功能和 AI 内容元数据读写功能。创作者需主动添加显式标识；未标识时，平台检测到疑似 AI 内容会加"疑似使用了AI生成技术"；若元数据中已有服务提供者的隐式标识，则补充"作品含AI生成内容"。平台为所有 AI 内容添加或更新含传播要素的隐式标识 — [IT之家](https://www.ithome.com/0/879/586.htm)；[财联社](https://www.cls.cn/detail/2133981)；[澎湃](https://m.thepaper.cn/newsDetail_forward_31523045)

**抖音开放平台 API**
- 上传视频 `POST https://open.douyin.com/api/douyin/v1/video/upload_video/`（multipart，需 `access-token`、`open_id`）：超过 50MB 建议分片，超过 300MB 必须分片，总大小 ≤4GB；分片建议 20MB，最小 5MB；推荐 mp4/webm、720p 以上；时长 ≤15 分钟（错误码 2114006）；scope 为 `video.create.bind`，需要在控制台"能力实验室"申请"代替用户发布内容到抖音"并获得用户授权 — [抖音开放平台: 上传视频](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/create-video/upload-video)
- 创建视频 `POST .../video/create_video/`：必填加密的 `video_id`；`text` 标题 ≤1000 字，可带 #话题 和 @；`cover_tsp` 指定某一时间点的帧作为封面，或用 `custom_cover_image_url`；`private_status` 控制可见范围（0/1/2）；小程序和 POI 锚点只限企业资质账号；创建后进入审核，审核期间仅自己可见；**一个用户在一个应用下每天最多发布 75 个作品**（错误码 2114007）。页面未找到 AIGC 声明字段 — [抖音开放平台: 创建视频](https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi/video-management/douyin/create-video/video-create)

**其他平台**
- 视频号：没有找到微信官方面向第三方开放的视频号发布 API；现有方案是用浏览器自动化操作视频号助手，需要扫码登录 — [tessl: wechat-channels-publish](https://tessl.io/registry/skills/github/TeamWiseFlow/xiaobei/wechat-channels-publish)；视频号助手是面向运营者的人工后台 — [爱范儿](https://www.ifanr.com/minapp/1356247)
- B站开放平台：`/arcopen/fn/archive/video/init` 预处理并返回 `upload_token` → 上传 → `/arcopen/fn/archive/add-by-utoken` 提交稿件（字段有标题、封面、分区 tid、标签、简介、版权类型），返回 resource_id（BV 号）。该文档最后修改于 2022 年 6 月，可能已过时 — [bilibili apifox](https://bilibili.apifox.cn/api-23706538)
- 小红书（第三方资料）：视频上限 20GB，支持 MP4/MOV，推荐 1080P+，标题 1–20 字（建议 15 字以内）。开源技能通过创作者平台 COS 上传 + `/web_api/sns/v2/note` 创建笔记（非官方接口） — [tessl: xhs-publish](https://tessl.io/registry/skills/github/TeamWiseFlow/xiaobei/xhs-publish)

**规格与安全区（无官方数据，以下均为第三方经验）**
- 竖屏基础画布 1080×1920；抖音底部是描述和音乐条，右侧是点赞/分享按钮列；字幕经验位置约为 Y=1200–1550（距底部不少于 370px）；有人建议避开顶部和底部各 10%。一份安全区检查工具文章明确说没有任何平台公布过非广告内容的安全区边距 — [blitzcut](https://blitzcutai.com/blog/best-caption-placement-short-form-video)；[visu.network](https://visu.network/tools/safe-zone-checker/)；[trymypost](https://www.trymypost.com/blog/social-media-safe-zones-templates-2026)
- 抖音国际版"有效安全区约 840×1280"的说法来源不明 — [nemovideo](https://www.nemovideo.com/zh-CN/blog/seedance-2-vertical-video-tiktok-reels)
- 抖音码率：2020 年的一篇 B 站用户文章称超过 6000Kbps 会触发压缩，建议 ≤1080P（个人经验，已过时） — [bilibili opus](https://www.bilibili.com/opus/447634956319510993)

### Inferences
- **合规模块设计**（作者推断）：
  1. IR 中有 `aigc: {containsGenerated: bool, components: ['tts','ai_image','ai_video','avatar'], explicitLabel: {...}}`，由流水线根据实际使用的生成步骤自动置位，用户不能静默关闭隐式标识。
  2. 渲染后写入隐式标识：按 TC260 指南的字段（Label/ContentProducer/ProduceID/ReservedCode1…）写入 MP4 元数据（XMP 或原生 box）；也可调用阿里云 SASE 等现成接口。ProduceID 与内部 render_id 一一对应并入库，满足溯源要求。
  3. 显式标识：在 IR 中作为一条系统轨道（片头 N 秒 + 角标），模板中可配置位置和样式，但不能删除。用户选择去除显式标识时，记录协议同意和提供对象信息并留存日志 ≥6 个月（第九条）。
  4. 发布到抖音时，引导用户在平台侧主动声明（抖音 API 页面未见 AIGC 字段，需要关注平台更新）。
- **口播是否需要标识**：只做剪切、字幕和调色的真人口播一般不算"利用 AI 生成、合成"的内容，但若使用了 AI 配音、数字人、AI 换背景或 AI 扩图，就落入生成合成内容范围。这一判断是作者推断，需要法务确认。
- **平台适配**：安全区没有官方数据，应在 brand kit 中做成可配置预设，并用几何检查（字幕包围盒 vs 预设遮挡矩形）加 VLM 抽检兜底；导出预设建议 1080×1920、30fps、H.264 High、码率约 6–10Mbps（平台会二次转码，过高码率收益有限；这是推断，未找到抖音官方规格）。
- **自动发布**：抖音走官方 API（注意每天 75 条/用户/应用、≤15 分钟、需要能力审批）；视频号和小红书只能"一键下载 + 人工发布"，或使用 RPA（违反平台规则、导致账号风险的可能性高，不建议作为核心功能）。

### Gaps
- GB 45438-2025 对视频显式标识的具体量化要求（例如文字高度占比、持续时长）没有拿到原文，无法核实"文字高度 ≥5% 最短边""持续 ≥2 秒"这类常见说法。
- TC260 视频隐式标识指南中 MP4 具体 box/XMP 命名空间的定义没有读到原文。
- 抖音、小红书、视频号的官方上传规格（分辨率、码率、帧率、时长）和官方安全区规范没有找到。
- 抖音 API 的 QPS 限制、视频号是否有面向企业的发布接口、B站 2026 年现行投稿 API 都没有找到确证。
