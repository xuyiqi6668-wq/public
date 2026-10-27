# 文案视频 / 文字成片 生成链路调研（Script/Copy-driven Video Generation Pipeline）

> 调研日期：2026-10-27。范围：从选题/文案到成片（配音、画面、字幕、音乐）的生成链路各环节组件；不含渲染框架选型与整体架构（由其他研究员负责）。
> 说明：价格、版本变化很快。下文凡来自第三方聚合站/转售商的数字均已标注；尽量以官方页面为准。多处标注了"已过时/已下线"的信息（例如 Sora API 已于 2026-09-24 下线、MiniMax 音乐付费 API 自 2026-08-20 起不再对新用户开放）。

---

## Q1. 文案生成与分镜（Topic → Script → Structured Storyboard JSON）

### Takeaway
业界主流做法是"两段式/多段式 LLM 流水线"：先生成口语化文案，再把文案拆成结构化分镜 JSON（scene/narration/visual prompt/on-screen text/duration/素材类型），并用各家 API 的 JSON Schema 结构化输出（Qwen/百炼、Claude 已支持 strict schema；DeepSeek 只有 json_object；豆包方舟仍是 beta）保证可被程序解析。开源项目普遍通过 OpenAI 兼容接口同时接入 Claude/GPT/DeepSeek/Qwen/豆包/Kimi/MiniMax 等多家模型。

### Cited Findings
- **多模型接入是标配**：MoneyPrinterTurbo 支持 Kimi/Moonshot、OpenAI、Anthropic Claude、Google Gemini、DeepSeek、阿里 Qwen、Azure OpenAI、火山方舟（Volcengine Ark）、xAI Grok、MiniMax、小米 MiMo，并支持 OpenRouter、Ollama、LiteLLM、OneAPI、Groq 等网关；其功能包括多语言文案生成/改写或直接使用自定义文案 — [MoneyPrinterTurbo GitHub](https://github.com/harry0703/MoneyPrinterTurbo)
- NarratoAI（影视解说）通过 OpenAI 兼容接口接入 DeepSeek、Qwen2-VL 等；据资料称 2026 年 3 月起统一改用 OpenAI 兼容请求链路、不再依赖 LiteLLM（二手信息，需以仓库为准） — [NarratoAI README](https://cdn.jsdelivr.net/gh/linyqh/narratoai@main/README.md)；[dev.co 条目](https://dev.co/ai/frameworks/narratoai)
- **Agent 化多阶段流程**：OpenMontage（开源，运行在 Claude Code/Cursor/Copilot 等编码助手内）把每条流水线固定为 research → proposal → script → scene plan → assets → edit → compose 七个阶段，用 YAML pipeline manifest + Markdown skill 文件定义阶段和最佳实践 — [Pinggy 介绍](https://pinggy.io/blog/openmontage_agentic_video_production/)；[OpenMontage GitHub](https://github.com/calesthio/OpenMontage)
- **分镜 JSON 的常见字段**：某开源分镜工具读取 script.md，套用 prompt 模板调用 gemini-2.5-flash，解析 JSON 后输出 storyboard.json（机读）+ storyboard.md（人读），每条含镜头编号、时间段、旁白文本、素材类型，失败自动重试 1 次 — [video-agent-skills](https://tomevault.io/tome/chenyuxiaojin/video-agent-skills)
- 另一 skill 要求输出"严格、可机器解析"的镜头列表（默认 3 个镜头），每个镜头含图像提示词、视频提示词、旁白、屏幕文字 — [Tessl: ai-video-script](https://tessl.io/registry/skills/github/TokenRhythm/opensquilla/ai-video-script)
- 常见脚本模板把文案层拆为"开头钩子、旁白、字幕、结尾 CTA" — [termo.ai AI Video Script](https://www.termo.ai/skills/ai-video-script)
- **一致性约束**：分镜提示词需在每帧中固定背景、光照、机位、风格、分辨率、环境等静态元素，只让人物动作/表情随剧情变化 — [AutoSkill 生成视频分镜提示词](https://openskillindex.com/skills/ecnu-icalk-autoskill-e6d6ab)
- LTX Studio 认为把镜头类型、角度、运动拆成独立 JSON 字段比散文描述更稳定；推荐先用自然语言探索方向，再转 JSON — [LTX: JSON Prompting](https://ltx.studio/blog/json-prompting-for-video-image-generation)
- **结构化输出能力对比**：
  - 阿里云百炼（Qwen）：支持 JSON Object 与 JSON Schema 两种模式；Schema 模式通过 `response_format={"type":"json_schema","json_schema":{...,"strict":true}}` 严格遵循 schema；Object 模式要求提示词含 "JSON" 字样；Schema 模式仅部分模型支持（文档列出 Qwen3.8-Max、Qwen3.7-Plus、Qwen3.7-Flash 等） — [百炼 结构化输出](https://docs.bailian.console.aliyun.com/zh/model-studio/qwen-structured-output)；[阿里云 JSON mode](https://www.alibabacloud.com/help/zh/model-studio/json-mode)
  - Claude：JSON 结构化输出现位于 `output_config.format`（旧的 beta `output_format` + `structured-outputs-2025-11-13` header 在过渡期仍可用），要求对象设置 `additionalProperties: false`，SDK 支持 Pydantic/Zod — [Claude Docs: Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
  - DeepSeek：仅 `response_format={'type':'json_object'}`；需在提示词中包含 "json" 并给出示例格式；需合理设置 max_tokens 防截断；官方承认偶尔返回空内容；文档示例模型名为 `deepseek-flash` — [DeepSeek JSON Output](https://api-docs.deepseek.com/guides/json_mode)
  - 火山方舟（豆包）：结构化输出"尚在 beta 阶段，请谨慎在生产环境使用"，通过 Responses API 的 `text.format` 开启；doubao-seed-1-6-lite-251015 不支持 — [火山方舟 结构化输出](https://www.volcengine.com/docs/82379/1958523)
- **云厂商的文案→时间线服务**：阿里云智能媒体服务 IMS 提供"智能文案生成"（SubmitTextGenerateJob，0.12 元/千 tokens）、"脚本化自动成片"（`GeneratePreviewOnly=true` 时只生成 Timeline，免费；合成成片按视频剪辑计费）和"图文匹配"（通用场景 0.3 元/分钟，影视合集 1 元/分钟） — [阿里云 IMS 计费](https://help.aliyun.com/en/ims/one-key-into-a-piece)

### Inferences
- 推荐的分镜 JSON 最小字段集（综合上述来源）：`scene_id, narration（口播原文，用于 TTS 与字幕）, on_screen_text（大字/花字，常与 narration 不同）, visual_type（stock|ai_image|ai_video|avatar|chart|template）, visual_prompt / search_keywords（中英双语，库检索用英文关键词）, template_id + template_params（图表/列表/金句卡）, duration_hint（最终以 TTS 实际时长回填）, transition, bgm_mood`。时长应以 TTS 产出的真实音频时长为准反向对齐，而不是让 LLM 估算。
- 国内部署优先 Qwen（百炼 strict schema 最成熟）或 DeepSeek（便宜，但需自行做 schema 校验+重试）；对复杂分镜/创意要求高时可用 Claude/GPT。无论哪家，都应在应用层用 Pydantic/Zod 校验并自动重试（参考上面 storyboard 工具的"失败重试 1 次"）。
- 中文 Stock 素材库检索普遍需要英文关键词（Pexels/Pixabay 为英文标签），LLM 应同时输出英文 search terms（MoneyPrinterTurbo 的做法即先生成文案、再生成英文检索词——此为对其流程的常见理解，未在本次抓取的 README 中逐字核实）。

### Gaps
- 未找到公开的、针对"知识类/资讯类/带货类"中文短视频的 LLM 文案质量横评（Claude vs Qwen vs DeepSeek vs 豆包 vs Kimi）。
- 未核实 Kimi、MiniMax、豆包最新模型的 JSON Schema strict 支持细节；未找到掘金/知乎上高质量的分镜 JSON 实践文章（搜索未命中）。

---

## Q2. TTS / 声音克隆（中文）+ 合规

### Takeaway
2026 年中文 TTS 开源第一梯队为 Fun-CosyVoice3（Apache-2.0，test-zh CER 0.81–1.21）、IndexTTS-2/2.5（B站自定义许可证，情感控制强）、Qwen3-TTS（Apache-2.0，2026-01 开源）、VoxCPM；Fish Audio S2 Pro 为研究许可（商用需另购），F5-TTS 权重为 CC-BY-NC（不可商用）。商用 API 中阿里云 CosyVoice v3.5-flash 仅 0.8 元/万字符，是国内性价比最高的选项之一；MiniMax Speech 2.8 为 $60–100/百万字符；ElevenLabs 为 $50–100/百万字符。字幕同步需要字/词级时间戳——阿里云、ElevenLabs、Azure、Edge-TTS 均可返回，否则需 Whisper/强制对齐兜底。合规上，2025-09-01 起《人工智能生成合成内容标识办法》+ 强制性国标 GB 45438-2025 要求音视频显式标识 + 文件元数据隐式标识，克隆他人声音需取得被编辑者单独同意。

### Cited Findings
**开源模型 — 质量（Seed-TTS-eval，CER/WER 越低越好，SS 越高越好）**
- Fun-CosyVoice3-0.5B-2512：test-zh CER 1.21 / SS 78.0；test-en WER 2.24；test-hard CER 6.71。RL 版：test-zh 0.81 / SS 77.4，test-en 1.68，test-hard 5.44。同表：IndexTTS2（1.5B）test-zh 1.03 / SS 76.5、test-hard 7.12；F5-TTS（0.3B）1.52 / 74.1；Spark-TTS（0.5B）1.2 / 66.0；Seed-TTS（闭源）1.12 / 79.6；CosyVoice2 1.45 / 75.7 — [FunAudioLLM/CosyVoice GitHub](https://github.com/FunAudioLLM/CosyVoice)
- CosyVoice3 论文中 test-zh 的真人录音基线 CER 为 1.26（即顶级 TTS 已低于真人基线） — [CosyVoice 3 paper](https://arxiv.org/pdf/2505.17589)
- VoxCPM 论文报告中文 CER 0.93%，并称超过 IndexTTS2 与 CosyVoice2 — [VoxCPM paper](https://arxiv.org/pdf/2509.24650)
- Fun-CosyVoice3 能力：0.5B；9 种语言 + 18 种以上中文方言/口音（粤语、闽南语、四川话等）；指令控制语言/方言/情感/语速/音量；双流式（流式文本输入+流式音频输出）延迟低至 150 ms；拼音/CMU 音素发音修正；无需传统前端即可处理数字/符号；Apache-2.0；最新发布 2025/12 — [CosyVoice GitHub](https://github.com/FunAudioLLM/CosyVoice)
- IndexTTS（B站）：最新为 IndexTTS-2.5（News 标注 2026/08/10，但论文 arXiv 号 2601.03888 暗示 2026-01，日期存疑）；IndexTTS-2 发布于 2025/09/08。IndexTTS-2 情感控制：情感参考音频（`emo_alpha` 强度）、8 维情感向量、或由文本推断情感；IndexTTS-2 的精确时长控制"本版本尚未启用"，2.5 支持 `duration_factor` 0.5x–2.0x；2.5 支持中/英/日/西/阿语，支持拼音/CMU 音素/假名；可用 vLLM 部署。RTF（RTX 4090）：IndexTTS-2 fp16 0.326、IndexTTS-2.5 bf16 0.207。CV3-Eval 中文 WER/SS：IndexTTS2.5 4.36/77.10，RL 版 3.93/77.92。许可证为"bilibili Model Use License Agreement"，商用需邮件 indexspeech@bilibili.com 洽谈 — [index-tts GitHub](https://github.com/index-tts/index-tts)
- Qwen3-TTS：2026-01-22 开源，Apache-2.0；1.7B/0.6B 的 Base（3 秒克隆）、CustomVoice（9 个预置音色，含北京话 Dylan、四川话 Eric 等方言预置音色）、VoiceDesign；支持中英日韩德法俄葡西意 10 种语言 — [Gigazine](https://gigazine.net/gsc_news/en/20260123-qwen3-tts-family-opensource)；[lilting.ch](https://lilting.ch/en/articles/qwen3-tts-voice-synthesis)；[NYU Shanghai RITS](https://rits.shanghai.nyu.edu/ai/%F0%9F%93%A2-qwen3%E2%80%91tts-open%E2%80%91source-text%E2%80%91to%E2%80%91speech-tts-family/)
- Fish Audio S2 Pro：2026-03-09 发布开放权重（fishaudio/s2-pro），采用 Fish Audio Research License——研究/非商用免费，商用需另购许可；官方强调是"open weights 而非 OSI 意义上的 open source"；后继 S2.1 Pro 未开放权重 — [Fish Audio 博客](https://fish.audio/fr/blog/what-we-mean-by-open-source-for-s2/)；[gradually.ai](https://www.gradually.ai/en/ai-models/fish-audio-s2-pro/)
- F5-TTS：代码 MIT，但预训练权重因 Emilia 数据集为 CC-BY-NC-4.0（不可商用） — [vantaige F5-TTS](https://vantaige.io/ai-tool/f5-tts)；[tts.ai 开源 TTS 目录](https://tts.ai/tools/open-source-tts/)

**榜单**
- Artificial Analysis Speech Arena（2026-06-03 报道）：#1 阿里 Fun-Realtime-TTS Elo 1,219（$27.59/百万字符，阿里云 API 可用），#2 Gemini 3.1 Flash TTS 1,214（$18.30/M），#3 Inworld Realtime TTS-2 Research Preview 1,209，#4 Cartesia Sonic 3.5 1,203（$39/M）；前五名仅差 24 Elo — [Artificial Analysis](https://artificialanalysis.ai/articles/fun-realtime-tts-new-text-to-speech-model-topping-artificial-analysis-leaderboard)
- 同榜开放权重最高为 Fish Audio S2 Pro，Elo 约 1,117–1,121（不同快照） — [AA Speech Arena](https://artificialanalysis.ai/text-to-speech/leaderboard)
- 注意：Speech Arena 以英文为主，不能直接代表中文质量；其他快照（如 2026-07 博客称 Speechify Simba 3.2 第一）无法核实 — [offlinetts.com](https://offlinetts.com/blog/tts-arena-leaderboard-2026/)

**商用 API — 价格**
- 阿里云百炼 CosyVoice（北京地域原价）：cosyvoice-v3.5-plus 1.5 元/万字符；v3.5-flash 0.8 元/万字符（首包延迟大幅降低）；v3-plus 2 元/万字符（语音克隆，复刻相似度更高）；v3-flash 1 元/万字符；RPM 限流 180；新加坡地域 v3-flash 不支持复刻 — [cosyvoice-v3.5-plus](https://help.aliyun.com/zh/model-studio/cosyvoice-v3-5-plus)；[v3.5-flash](https://help.aliyun.com/zh/model-studio/cosyvoice-v3-5-flash)；[v3-plus](https://help.aliyun.com/zh/model-studio/cosyvoice-v3-plus)；[v3-flash](https://help.aliyun.com/zh/model-studio/cosyvoice-v3-flash)
- MiniMax（官方 PAYG，美元）：speech-2.8-hd $100/百万字符、speech-2.8-turbo $60/百万字符（2.6/02 系列已标记 legacy，同价）；快速声音克隆 $1.50/音色（首次合成时收费）；Voice Design $3/音色 — [MiniMax Pricing](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- 火山引擎/豆包：2025-10-16 发布豆包语音合成模型 2.0（Doubao-Seed-TTS 2.0）与声音复刻模型 2.0，宣称情感表现力、指令遵循更强，可朗读复杂公式 — [IT之家](https://www.ithome.com/0/889/985.htm)。一个未注明日期的第三方价目表显示"Doubao-语音合成 5 元/万字符、声音复刻 8 元/万字符"（不确定是否适用 2.0） — [ai-bot.cn](https://ai-bot.cn/sites/22232.html)。有用户反馈豆包 TTS 2.0 在某集成中"不同角色声音一样"（个案） — [pyvideotrans 论坛](https://bbs.pyvideotrans.com/show/2150)
- ElevenLabs 官方 API：Flash/Turbo $0.05/千字符，Multilingual v2/v3 $0.10/千字符，单请求上限 40,000 字符 — [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)
- Azure 神经 TTS：第三方普遍报价预置神经音色约 $16/百万字符，Neural HD $22/百万字符，自定义音色约 $24/百万字符，免费 50 万字符/月（未取得微软官方页面核实；较旧来源称 $15） — [texttolab](https://texttolab.com/blog/azure-text-to-speech-pricing)；[perkstack](https://perkstack.co/blog/cheapest-azure-tts-api)

**字/词级时间戳（字幕同步关键）**
- 阿里云语音合成时间戳：设置 `enable_subtitle=true` 返回句级/字级时间（可驱动虚拟人口型、做字幕）；仅部分发音人支持；RESTful 短文本接口不返回，需 WebSocket 流式接口；官方提醒返回字幕按发音切分，"不能直接用于上屏，需要使用您的原始文本"（该文档属智能语音交互 ISI，是否同样适用于百炼 CosyVoice 未核实） — [阿里云 时间戳功能](https://help.aliyun.com/zh/isi/developer-reference/timestamp-feature)
- Azure Speech SDK WordBoundary 事件在对应词播报前触发，和 Synthesizing 音频事件节奏可能不同步；有开发者反馈本地 Neural TTS 容器不触发 WordBoundary — [Microsoft Q&A](https://learn.microsoft.com/en-us/answers/questions/2260104/how-to-reliably-get-all-word-boundary-events-from)；[Microsoft Q&A（容器）](https://learn.microsoft.com/en-us/answers/questions/1613851/wordboundary-event-not-called-when-using-neural-te)
- MoneyPrinterTurbo 字幕两种模式：`edge`（使用 Edge TTS 时间戳，快、无需 GPU，默认）与 `whisper`（本地 faster-whisper 转写，时间更准，large-v3 约 3 GB、large-v3-turbo 约 1.6 GB） — [MoneyPrinterTurbo GitHub](https://github.com/harry0703/MoneyPrinterTurbo)
- 第三方技能页提到豆包语音 2.0 TTS 可在需要字符级时间戳元数据（用于字幕）时使用，但未给出参数名 — [claudeskills: doubao-tts](https://claudeskills.info/skills/calesthio/openmontage/doubao-tts/)

**合规（中国）**
- 《人工智能生成合成内容标识办法》第 4 条：音频需在起始、末尾或中间适当位置添加语音提示或音频节奏提示等标识（或在交互界面显著标识）；视频需在起始画面和视频播放周边适当位置添加显著提示标识（可在结尾/中间追加）；提供下载/复制/导出时文件中须含显式标识。第 5 条：须在文件元数据中添加隐式标识（内容属性、服务提供者名称或编码、内容编号），鼓励数字水印。第 6 条：传播平台须检测元数据并添加提示；无元数据但用户声明或平台检测疑似的也要提示。第 10 条：用户发布时应主动声明并使用平台标识功能，不得恶意删除、篡改、伪造、隐匿标识。第 14 条：2025-09-01 起施行 — [网信办原文](https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm)
- 配套强制性国标 GB 45438-2025 同日实施（AI 领域首个强制性国标），附录 E（规范性）为"文件元数据隐式标识格式"，TC260 另有分文件类型的元数据隐式标识实践指南 — [安全内参](https://www.secrss.com/articles/80110)；[Sidley 英文摘要](https://www.sidley.com/en/-/media/resource-pages/ai-monitor/20250314-china-standard-gb-454382025-labeling-method-for-content-generated-by-ai.pdf?la=en)
- 《互联网信息服务深度合成管理规定》第 12 条第 3 款：提供人脸、人声等生物识别信息显著编辑功能的，应提示使用者依法告知并取得被编辑个人的单独同意；第 14 条：合成人声、仿声等须在音频合理位置以语音说明等方式显著标识 — [China Law Translate](https://www.chinalawtranslate.com/deep-synthesis/)；[网信办 2022-12](https://www.cac.gov.cn/2022-12/11/c_1672221949354811.htm)
- 抖音自 2025-09-01 起：创作者发布 AI 内容需主动添加显式标识；平台对所有 AI 内容添加/更新隐式标识；未标识但检测为疑似的，标注"疑似使用了AI生成技术，请谨慎甄别"；元数据中已有 AIGC 服务方隐式标识的，显示"作品含AI生成内容" — [IT之家](https://www.ithome.com/0/879/586.htm)；[澎湃](https://m.thepaper.cn/newsDetail_forward_31523045)

### Inferences
- **选型建议（中文）**：
  - 云 API 首选：阿里云 CosyVoice v3.5-flash/plus（0.8–1.5 元/万字符，国内合规、延迟低），备选豆包 Seed-TTS 2.0（情感/指令遵循强，价格需官方确认）、MiniMax Speech 2.8（约 ¥4–7/万字符量级，按 $60–100/M 换算，音色丰富）。海外/多语言：ElevenLabs、Gemini TTS。
  - 自托管首选：Fun-CosyVoice3（Apache-2.0，商用无障碍，方言多）、Qwen3-TTS（Apache-2.0）；IndexTTS-2.5 质量/情感好但需与 B站确认商用授权；Fish S2、F5-TTS 不能直接商用。
  - 成本量级：60 秒中文口播约 250–300 字（按 4–5 字/秒的常见语速估算，属经验假设），用 CosyVoice v3.5-flash 仅约 0.02–0.03 元，TTS 成本可忽略；真正成本在视觉素材（见 Q3）。
- **字幕同步策略**：优先用 TTS 自带字/词时间戳并"用原文替换发音切分文本"（阿里云官方建议）；无时间戳的引擎（多数开源模型）则逐句合成 → 用每句音频时长拼接得到句级时间轴（最稳妥），需要字级高亮时再用 Whisper/强制对齐。逐句合成也便于单句重生成与分镜对齐。
- **Edge-TTS 风险**：MoneyPrinterTurbo/ShortGPT 默认用 Edge TTS（免费、无 key），其本质是调用微软 Edge 朗读服务的非官方接口，商业产品不宜依赖（此为推断，无官方条款引用）。
- **合规落地清单**：①视频片头/播放区加"AI生成"显式标识，配音若为合成/克隆音色需加语音或界面提示；②导出 MP4 写入 GB 45438-2025 附录 E 规定的元数据隐式标识；③发布时在抖音等平台勾选 AI 声明；④声音克隆必须取得本人单独同意并留存授权记录；⑤不得在后处理中裁剪/去除标识。

### Gaps
- 火山引擎豆包语音合成 2.0 / 声音复刻 2.0 的官方单价与字级时间戳参数未能抓取（官方计费页为动态加载）。
- 百炼 CosyVoice（非 ISI）API 是否返回字级时间戳、参数名为何，未找到官方文档确认。
- MegaTTS3、Spark-TTS、GPT-SoVITS 的许可证与最新版本未核实（搜索无可靠结果）；GPT-SoVITS 在中文社区声音克隆中仍广泛使用，但缺乏 2026 年基准数据。
- 未找到专门的中文 TTS 主观 MOS 横评（各家 CER 多为自报）。

---

## Q3. 视觉素材：Stock 素材库、AI 生图、AI 生视频、图生视频、Ken Burns/视差

### Takeaway
文案视频的视觉层通常是"免费素材库（Pexels/Pixabay）+ AI 生图（Seedream/Qwen-Image/Flux）+ 少量 AI 视频镜头 + 模板动效"的混合。2026 年 AI 视频第一梯队为 Seedance 2.0（字节）、HappyHorse（阿里）、Kling 3.0、Veo 3.1、MiniMax H3；价格区间约 $0.025–0.40/秒，国内 Seedance 2.0 约 1 元/秒、Seedance 2.0 Mini 约 0.5 元/秒。Sora 2 API 已于 2026-09-24 下线。开源可自托管的仅 Wan 2.2（Apache-2.0，Wan 2.5+ 仅 API）。静态图动画化可用 DepthFlow 等 2.5D 视差方案低成本实现。

### Cited Findings
**Stock 素材 API**
- Pexels API 免费，默认每个 key 20,000 次/月（第三方称另有 200 次/小时，未经官方证实）；若能展示署名，可免费申请提额；响应头 X-Ratelimit-* 可查实时配额 — [Pexels API](https://www.pexels.com/pl-PL/api)；[Pexels API 文档](https://cat.pexels.com/zh-tw/api/documentation/)；[freeapihub](https://freeapihub.com/apis/pexels-api)
- Pixabay API：第三方称默认约 100 次/60 秒，要求缓存响应 24 小时、下载到自有存储而非盗链；Pixabay 许可允许免署名商用，但禁止将素材作为独立文件再分发或用于竞争性图库；已不再是 CC0 — [freeapihub Pixabay](https://freeapihub.com/apis/pixabay-api)；[OpenReplay](https://blog.openreplay.com/fr/ressources-photos-stock-gratuites/)
- MoneyPrinterTurbo 素材源：Pexels、Pixabay、Coverr + 本地上传；short-video-maker 仅 Pexels，检索无结果时退回"nature/globe/space/ocean"等兜底词 — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)；[short-video-maker](https://github.com/gyoridavid/short-video-maker)
- 国内素材库（新片场素材/场选素材、包图网、视觉中国）未检索到公开的开发者 API；视觉中国品类全但价格偏高；多数平台条款禁止再分发/转授权 — [B站专栏 可商用素材网站](https://www.bilibili.com/read/cv50258223)

**AI 生视频 — 质量排名**
- Artificial Analysis 文生视频（含音频）榜：Dreamina Seedance 2.0 720p 1,211 Elo、HappyHorse-1.0 1,211、Kling 3.0 Omni 1080p (Pro) 1,099、Veo 3.1 1,094（快照日期不明） — [AA Text-to-Video Leaderboard](https://artificialanalysis.ai/video/leaderboard/text-to-video)
- 2026-06 fal 汇总：Seedance 2.0 1,216、HappyHorse 1.0 1,213 — [fal.ai](https://fal.ai/learn/tools/best-text-to-video-apis-2026)
- 2026-08 InVideo 博客称 Gemini Omni Flash 1,245 领先、MiniMax-H3 1,242、Seedance 2.0 1,225（单一二手来源，未核实） — [InVideo blog](https://invideo.io/blog/best-ai-video-model/)

**AI 生视频 — 价格/可用性**
- **Sora 2 已下线**：OpenAI 2026-03-24 宣布停止 Sora App 与 API；Videos API 及 sora-2、sora-2-pro 等全部别名于 2026-09-24 移除，无替代 — [Make 帮助中心](https://help.make.com/openai-sora-and-video-modules-deprecation-by-september-24-2026)；[Zilliz](https://zilliz.com/ai-faq/what-is-the-sora-shutdown-timeline)；[apiframe](https://apiframe.ai/blog/ai-video-api-pricing-2026)
- Seedance 2.0（火山方舟官方，按 tokens）：720p 不含视频输入 46 元/百万 tokens、含视频输入 28 元；15 秒视频约消耗 30.888 万 tokens ≈ 15 元（≈1 元/秒） — [17173](https://news.17173.com/content/03052026/080543693.shtml)；1080p 不含/含视频输入 51/31 元/百万 tokens（2026-04-21 公布，第三方整理） — [ai-indeed](https://www.ai-indeed.com/encyclopedia/20217.html)
- Seedance 2.0 Mini：2026-06-15 推出，720p 约 0.5 元/秒，较标准版降本约 50%（第三方） — [ai-indeed](https://www.ai-indeed.com/encyclopedia/23583.html)
- MiniMax 视频（官方，按输出秒）：MiniMax-H3 2K $0.13/s、768P $0.08/s；H3-Highspeed 768P $0.06/s；H3-Lite 768P $0.04/s、480P $0.025/s；旧 Hailuo-2.3：768P 6s $0.28、1080P 6s $0.49；Hailuo-2.3-Fast 768P 6s $0.19 — [MiniMax Pricing](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- Kling 3.0：未取得官方价目；第三方估算 Kling-V3 720p 约 $0.084/s、1080p 约 $0.168/s（按 $0.14/单位估算），单次 3–15 秒 — [Atlas Cloud](https://www.atlascloud.ai/blog/guides/kling-ai-api-pricing)；转售商 Evolink 自 $0.075/s 起（2026-03-26 快照） — [Evolink](https://evolink.ai/blog/kling-3-api-pricing-integration-guide)；加音频通常贵 30–100% — [apiframe](https://apiframe.ai/blog/ai-video-api-pricing-2026)
- Vidu Q3（官方，$0.005/credit）：Q3-pro 1080p 约 $0.15/s、720p $0.125/s、540p $0.05/s（闲时约半价）；Q3-turbo 1080p $0.07/s、720p $0.06/s — [Vidu Platform Pricing](https://platform.vidu.com/docs/pricing)
- HappyHorse 1.0（阿里）：2026-04 阿里认领并通过百炼上线 API；fal 为官方合作方（2026-04-27），1080p，3–15 秒，支持 T2V/I2V/参考生视频/视频编辑；OpenRouter 标价自 $0.0988/s 起（另一列表 $0.0425/s，冲突）；已有 1.1 版本 — [fal HappyHorse](https://fal.ai/happyhorse)；[DataNorth](https://datanorth.ai/news/alibaba-launches-happyhorse-video-model)；[OpenRouter](https://openrouter.ai/models/alibaba/happyhorse-1.0)
- Veo 3.1（Gemini API，第三方汇总）：Fast $0.10/$0.12/$0.30 每秒（720p/1080p/4K），标准 $0.40/s（720p/1080p）、4K $0.60/s，Lite $0.05/$0.08；无免费额度；音频是否另计各来源说法不一 — [benchlm](https://benchlm.ai/media-pricing/veo)
- Runway：Gen-4 Turbo $0.05/s，Gen-4.5 $0.12/s — [apiframe](https://apiframe.ai/blog/ai-video-api-pricing-2026)
- **开源 Wan**：Wan2.2（2025-07-28，Apache-2.0）含 T2V-A14B、I2V-A14B（480P/720P，单卡需 ≥80GB）、TI2V-5B（720P@24fps，RTX 4090 24GB 可跑，5 秒 720P 未优化 <9 分钟）、S2V-14B（语音驱动）、Animate-14B — [Wan2.2 GitHub](https://github.com/Wan-Video/Wan2.2)。Wan 2.5/2.6/2.7 仅 API（百炼），未开放权重（2.7 是否开源有争议） — [howaiworks](https://howaiworks.ai/models/wan)；[wan27.org](https://www.wan27.org/blog/wan-2-6-open-source-guide)
- MoneyPrinterTurbo 已集成 AI 视频/图片源：MiniMax H3、Seedance、WaveSpeed、OFox、MuAPI，以及 OpenAI 兼容文生图转视频片段 — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)

**AI 生图**
- Qwen-Image：2025-08-04 开源，Apache-2.0，20B MMDiT（Qwen2.5-VL 文本编码器 + Wan2.1 VAE），中文文字渲染尤其强 — [Qwen-Image HF](https://huggingface.co/Qwen/Qwen-Image)；[NVIDIA model card](https://build.nvidia.com/qwen/qwen-image.md)
- Seedream 4.5：官方约 $0.04/张，Evolink $0.03（2026-04），fal 约 $0.04、Replicate $0.06（1024²） — [Evolink Seedream 定价](https://evolink.ai/en/blog/seedream-pricing-guide-2026)；[pricepertoken](https://pricepertoken.com/image/model/bytedance-seedream-4-5)
- MiniMax image-01：$0.0035/张 — [MiniMax Pricing](https://platform.minimax.io/docs/guides/pricing-paygo.md)

**静态图动画化（Ken Burns / 2.5D 视差）**
- DepthFlow：开源，将图片 + 深度图（示例用 Depth Anything 估计）渲染为 2.5D 视差视频，支持 Zoom/Dolly/Circle 等运动、H264/HEVC/AV1 + NVENC 导出，宣称 RTX 3060 可 8k50 渲染，有 Gradio 界面与 ComfyUI 节点；AGPL-3.0 — [DepthFlow PyPI](https://pypi.org/project/depthflow)；[HF Space README](https://huggingface.co/spaces/BrokenSource/DepthFlow/blame/main/README.md)；[ComfyUI Depthflow Nodes](https://comfy.icu/extension/akatz-ai__ComfyUI-Depthflow-Nodes)

### Inferences
- **成本梯度（60 秒成片的视觉成本量级）**：全用 Stock ≈ 0；12 张 AI 图 + Ken Burns/视差 ≈ $0.05–0.5；全部 AI 视频：Seedance 2.0 ≈ 60 元、Seedance 2.0 Mini ≈ 30 元、MiniMax H3-Lite 768P ≈ $2.4、Kling V3 720p ≈ $5、Veo 3.1 标准 ≈ $24。因此知识/资讯类建议"AI 图 + 动效模板 + 少量 AI 视频点缀（开头钩子镜头）"，带货类可对商品图做图生视频。
- 中文场景生图优先 Seedream（即梦同源）与 Qwen-Image（能直接渲染中文字），可省去后期加字；Midjourney 无官方 API（常识，未在本次检索中核实），不适合自动化。
- AI 视频生成延迟（排队 + 生成）通常为数十秒到数分钟（本次未取得可靠数据），流水线需异步任务 + 回调/轮询，并对每个镜头并发提交。
- 开源 Wan2.2-TI2V-5B 在 4090 上 5 秒需近 9 分钟，对批量生产吞吐有限；除非有 80GB 级 GPU 集群，否则 API 更经济。
- 素材匹配质量是"文字成片"的公认痛点（见 Q7 剪映"讲人工智能配猫图"案例），建议用多模态模型（Qwen-VL/Gemini）对候选素材做语义重排。

### Gaps
- 可灵、即梦/Seedream、GPT-image、Flux 的官方人民币/美元单价未能取得（官方页面动态加载或未命中）；各模型生成延迟（P50/P95）无可靠公开数据。
- Storyblocks API 价格、国内素材库 API 授权条款未找到。
- "Gemini Omni Flash""MiniMax-H3 视频榜单第二"仅有单一二手来源。

---

## Q4. 数字人 / Avatar（无真人素材时）

### Takeaway
无真人素材时，数字人播报是文案视频常见形态。商用侧 HeyGen（Avatar IV 约 20 credits/分钟）、腾讯智影、蝉镜（App 会员 39 元/月起）、硅基智能等；开源侧以硅基智能开源的 HeyGem/Duix-Avatar（10 秒视频克隆形象+声音、Docker 部署）、LatentSync 1.6（口型精度最高、约 18GB 显存）、MuseTalk 1.5（实时、约 8GB、256×256 面部区域）为主，Wan2.2-S2V、OmniHuman 1.5 代表"图片+音频生成全身/半身说话视频"的新路线。合规上须取得形象/声音本人单独同意并做 AI 标识。

### Cited Findings
- HeyGen：消费订阅中 Avatar IV 消耗 20 credits/分钟；Creator 计划每月 credits 数各来源不一（200 或 600）；第三方称 2026-02 起 API 改为纯按量付费、取消免费 API credits，API 的 Avatar IV 计价说法冲突（6 或 75 credits/分钟） — [Arcade](https://www.arcade.software/post/heygen-pricing)；[Creatify](https://creatify.ai/blog/heygen-pricing-(2026)-plans-and-what-you-ll-actually-pay)
- HeyGem（硅基智能 / Duix.com）：提交约 10 秒视频即可克隆数字人外观与声音，文本/音频驱动口型；Docker 部署，支持 Windows 与 Ubuntu 22.04；镜像包含 fun-asr、fish-speech-ziming、heygem.ai；Windows 需 D 盘 >30GB、C 盘 >100GB — [DEV: HeyGem](https://dev.to/heygem/heygem-open-source-alternative-to-heygen-4d21)；后续品牌为 Duix-Avatar（离线视频生成与数字人克隆，支持含中文在内 8 种语言） — [Duix-Avatar README](https://cdn.jsdelivr.net/gh/duixcom/duix-avatar@main/README.md)；[Spheron 2026 自托管指南](https://www.spheron.network/blog/self-host-ai-avatar-generator-heygen-alternative-2026/)
- LatentSync（字节）：论文称口型同步精度明显优于 MuseTalk 等方法；MuseTalk 自己的论文也承认 LatentSync 在 HDTF 上 LSE-C 最佳（7.90），MuseTalk 身份保持能力有限 — [LatentSync paper](https://arxiv.org/pdf/2412.09262)；[MuseTalk paper](https://arxiv.org/pdf/2410.10122)
- LatentSync 1.6（2025-06，512×512）显存约 18GB，MuseTalk 1.5 约 8GB（单一来源）；MuseTalk 面部区域固定 256×256；LatentSync 许可证说法冲突（Apache-2.0 vs OpenRAIL++），商用前需核对 — [Creeta](https://news.creeta.com/en/open-source-lip-sync-models-2026/)；[aireiter](https://aireiter.com/blog/musetalk-lipsync-review-cost-vs-paid-apis)
- Wan2.2-S2V-14B（2025-08-26，语音驱动视频，480P/720P，Apache-2.0）与 Wan2.2-Animate-14B（角色动画/替换） — [Wan2.2 GitHub](https://github.com/Wan-Video/Wan2.2)
- OmniHuman 1.5（字节）：输入参考图 + 音频 + 提示词生成逼真人物视频，口型与表情一致性突出（第三方 API 指南，未取得火山官方价） — [PiAPI 指南](https://piapi.ai/es/blogs/omnihuman-1-5-api-guide)
- 蝉镜：数字人口播/带货视频 App，会员 39 元/月起，可解锁定制数字人（非 API 价格） — [ai-bot.cn 蝉镜](https://ai-bot.cn/app/57231.html)
- 腾讯智影：PC 浏览器在线工具，核心功能含数字人播报、文本配音、自动字幕、文章转视频 — [ai-bot.cn](https://ai-bot.cn/sites/360.html)
- 合规：深度合成规定第 12 条要求对人脸/人声显著编辑取得被编辑者单独同意 — [China Law Translate](https://www.chinalawtranslate.com/deep-synthesis/)

### Inferences
- 对"文案视频"而言，数字人通常只占画面一角（画中画）或开头/结尾，主体仍是 B-roll/图文模板；因此口型模型选 MuseTalk 1.5（实时、低显存）往往够用，需近景高清时用 LatentSync 1.6 或商用 API。
- "图片 + 音频 → 说话视频"（OmniHuman、Wan-S2V、HappyHorse/Kling 等带音频的参考生视频）可在没有真人录像的情况下生成虚拟主播，省去录制 10 秒素材的步骤，但必须使用自有/授权形象，避免用真人照片冒充。
- 用户主线是真人口播，可复用真人的授权形象训练数字人分身来批量生产文案视频——这要求保存本人书面授权，且每条视频均需 AI 标识。

### Gaps
- 硅基智能、蝉镜、腾讯智影、HeyGen 的 API 按分钟单价均未找到官方数据。
- EchoMimic、Hallo 系列、LivePortrait 的 2026 年版本与对比数据未在本次检索中获取。
- OmniHuman 1.5 在火山引擎/即梦的官方计费未找到。

---

## Q5. 动效 / 动态字体 / 图文模板（图表、标题卡、列表、金句卡、文字快闪、对比布局）

### Takeaway
图文类动效普遍以"模板 + 参数（JSON）"方式实现：SaaS 侧有 Creatomate（可视化编辑模板、标记动态字段、按 JSON 批量替换）、Shotstack（JSON 时间线、多轨灵活）；代码侧以 Remotion（React）为主（short-video-maker 即基于 Remotion）；云厂商（阿里云 IMS）则输出 Timeline JSON 再合成。复杂动态字体（stagger/overshoot/自定义缓动）难以用纯 JSON 表达，通常需要代码模板。

### Cited Findings
- Creatomate：在浏览器编辑器中设计模板、将字段标记为动态，再对每个变体以 JSON payload 调用 API；REST API 接收模板 ID + 命名修改项，异步渲染，可 webhook 或轮询 — [Creatomate API automation](https://creatomate.com/docs/fundamentals/getting-started/api-automation)；[Creatomate: JSON to video](https://creatomate.com/blog/json-to-video-how-to-create-videos-from-json)
- Shotstack 是"JSON 进、视频出"，时间线模型对复杂多轨更灵活；其 JSON schema 与 Creatomate 不互通；有评论指出 overshoot、stagger、手调缓动曲线不易用纯 JSON 表达 — [Motionbox](https://motionbox.io/blog/best-json2video-alternatives-in-2026)
- 价格（竞品博客转述，需核实）：Creatomate Essential $54/月 2,000 credits；Shotstack $49/200 分钟 720p — [Wireflow](https://www.wireflow.ai/blog/best-creatomate-alternatives-in-2026)
- short-video-maker 用 Remotion 渲染 + FFmpeg 处理音视频；Remotion 渲染吃 CPU — [short-video-maker GitHub](https://github.com/gyoridavid/short-video-maker)
- 阿里云 IMS"脚本化自动成片"可只生成 Timeline（免费），再按剪辑计费合成，说明云端方案也采用"时间线 JSON → 渲染"的分离设计 — [阿里云 IMS 计费](https://help.aliyun.com/en/ims/one-key-into-a-piece)
- 剪映"图文成片"2021 年推出：输入文字后智能匹配图片素材、添加字幕、旁白和音乐自动生成视频，面向泛知识创作者 — [中国日报](https://cn.chinadaily.com.cn/a/202104/01/WS606584cca3101e7ce97471f7.html)；"文字成片"可自写或由系统生成文案，选择"智能匹配素材"后按文字内容配图/视频/配乐 — [KOC](https://www.koc.com.tw/archives/513023)

### Inferences
- **文案视频常见格式/模板库（建议内置）**：
  1. 图文成片/B-roll 解说：素材 + 逐句字幕 + 配音 + BGM（剪映图文成片、MoneyPrinterTurbo 默认形态）
  2. 文字快闪/大字报：纯文字逐词弹出、强节奏卡点（适合观点/金句）
  3. 列表/盘点（Top N）：编号卡 + 每项一屏
  4. 数据图表：柱状/折线/饼图动画、数字滚动（资讯/财经类）
  5. 金句/引用卡：人物头像 + 引文
  6. 对比布局：左右/上下分屏 A vs B（测评、带货）
  7. 时间线/流程图：历史事件、步骤教程
  8. 新闻播报：标题条 + 角标 + 数字人画中画
  9. 商品卖点卡：商品图 + 卖点标签 + 价格（带货）
  10. 影视/小说解说：原片切片 + 解说（NarratoAI 形态，注意版权）
- 模板参数应纳入分镜 JSON 的 `template_id + template_params`，由 LLM 选择模板并填参；Remotion/HTML 模板天然适合代码化、版本化管理，对中文字体（思源/阿里巴巴普惠体等商用免费字体）与竖屏安全区需统一设计规范。
- 动态字体的逐字动画可直接复用 TTS 字级时间戳驱动（字幕高亮/卡拉OK 效果、文字快闪卡点）。

### Gaps
- 未找到中文"文字快闪"等模板化实现的公开技术文章或开源模板库；After Effects 模板（MOGRT/nexrender）路线未调研。
- 腾讯智影、一帧秒创的模板体系细节未获取。

---

## Q6. 音乐与音效（BGM/SFX、AI 音乐、卡点）

### Takeaway
BGM 有三条路：免版税曲库（需注意开源项目自带曲库的版权问题）、AI 音乐 API（Suno 无官方 API 仅转售，Mureka 有官方预付费 API，MiniMax 音乐付费 API 自 2026-08-20 起停止向新用户开放）、以及按情绪标签选曲。卡点（beat-sync）在调研中没有找到专门方案，需自建节拍检测。

### Cited Findings
- MiniMax 音乐（官方，标注"discontinued"）：Music-3.0、Music-2.6、Music-2.5(+) 均为 $0.15/首（≤5 分钟），Music-2.0 $0.03，歌词生成 $0.01/首；付费音乐 API 自 2026-08-20 起不再向新用户开放，存量付费用户可继续使用 — [MiniMax Pricing](https://platform.minimax.io/docs/guides/pricing-paygo.md)
- Suno：无官方按首计费 API，以订阅为主（Pro $8/月 2,500 credits、Premier $24/月 10,000 credits，另有来源称 Premier $30）；第三方转售约 $0.11/次（2 首） — [CostBench](https://costbench.com/software/ai-music-apis/suno-api/)；[apiframe Suno](https://apiframe.ai/models/suno/pricing)
- Mureka：官方 API 为预付费，无公开固定单价；CometAPI 称官方起价约 $0.045/首（未核实），apiframe 为 $0.06/次（2 首） — [CometAPI](https://www.cometapi.com/ai-music-api-pricing/)；[apiframe Mureka](https://apiframe.ai/models/mureka/pricing)
- ElevenLabs Eleven Music：官方表约 $0.30/分钟（另有来源称 $0.15） — [ElevenLabs API Pricing](https://elevenlabs.io/pricing/api)；[happyrobot](https://www.happyrobot.ai/hub/elevenlabs-pricing)
- MoneyPrinterTurbo 支持随机/本地/AI 生成背景音乐，但其自带 BGM 来自 YouTube 视频，README 提示如侵权请删除 — [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo)
- short-video-maker 背景音乐按情绪/风格标签选择（chill、happy、dark 等） — [short-video-maker](https://github.com/gyoridavid/short-video-maker)

### Inferences
- 生产系统应建立"自有授权曲库 + 情绪/BPM/时长标签"，由分镜 JSON 的 `bgm_mood` 选曲；AI 音乐作为补充（注意各平台生成音乐的商用条款）。抖音/视频号等平台内置曲库通常只能在平台内使用，外部自动化流程不能直接调用（推断）。
- 卡点可用 librosa 等做节拍检测，把镜头切换/文字快闪对齐到 beat，再与 TTS 句边界做折中（推断，无引用）。
- BGM 需自动 ducking（人声出现时压低 BGM），这是渲染层通用做法。

### Gaps
- 未找到中文免版税曲库（如国内版权音乐平台）的 API 与授权条款；未找到 Udio 2026 年 API 状态；未找到 SFX 库（如 Freesound、ElevenLabs SFX）在此类流水线中的成本数据；未找到开源 beat-sync 实践资料。

---

## Q7. 现有开源项目与商业产品（技术栈与局限）

### Takeaway
开源侧 MoneyPrinterTurbo（135.7k stars，MIT，Python + ffmpeg + faster-whisper，2026-10 仍上 GitHub Trending）是"文案→素材→配音→字幕→成片"的事实标准参考实现，但本质是"关键词检索 Stock 素材拼接"，画面与文案匹配粗糙、无模板动效；NarratoAI 面向影视解说（许可证有非商用争议）；ShortGPT 基于 MoviePy、偏英文；short-video-maker（Remotion + Kokoro + MCP）仅英文；OpenMontage（AGPL-3.0）代表"编码 Agent 驱动的多阶段生产"新范式。LibreTV 是影视聚合播放站，与视频生成无关。商业侧剪映图文/文字成片、腾讯智影、一帧秒创、阿里云 IMS（API）、Pictory、InVideo AI、Fliki、HeyGen 等。

### Cited Findings
**开源项目**
- **MoneyPrinterTurbo**（harry0703）：Python 3.11+；WebUI（Streamlit）/API（/docs）/CLI/Agent 四种入口，PyPI 包 `mpt`、Docker、Colab；ffmpeg（自动下载）；faster-whisper 字幕；LLM 见 Q1；TTS 支持 Edge TTS、Azure、SiliconFlow、Gemini、MiMo、MiniMax、ElevenLabs、Chatterbox、Kokoro、Fish Audio、VoxCPM（含参考音频声音克隆）；素材 Pexels/Pixabay/Coverr/本地 + AI 视频（MiniMax H3、Seedance 等）；输出 9:16/16:9/1:1；批量生成（≤100 任务）；自动上传 TikTok/Instagram/YouTube Shorts；MIT；135.7k stars、21.5k forks。局限：Windows 包路径不能含中文/空格、需手动处理 ffmpeg/Whisper 下载、"Too many open files"、自带 BGM 版权问题、README 含大量赞助推广 — [MoneyPrinterTurbo GitHub](https://github.com/harry0703/MoneyPrinterTurbo)；2026-10 上 GitHub Trending — [aitoolly](https://aitoolly.com/ai-news/article/2026-10-02-moneyprinterturbo-gains-traction-on-github-trending-as-an-automated-ai-powered-hd-short-video-genera)
- **NarratoAI**（linyqh）：Python + Streamlit；用 Gemini、Qwen-VL 等多模态模型理解视频提取剧情点，生成解说文案并自动剪辑；TTS 集成 Azure、腾讯云、SoulVoice、IndexTTS2；Docker Compose / Windows 整合包；许可证存在分歧（MIT vs 自定义非商用声明，商用需书面许可）；官方提醒有人在抖音/B站改名售卖属诈骗 — [CSDN 使用指南](https://adg.csdn.net/696f55fe437a6b40336a0cb1.html)；[少数派](https://sspai.com/post/108382)；[OSS Insight](https://ossinsight.io/analyze/linyqh/NarratoAI)；[README](https://cdn.jsdelivr.net/gh/linyqh/narratoai@main/README.md)
- **ShortGPT**（RayVentura）：OpenAI 生成脚本/提示词，ElevenLabs + EdgeTTS 配音，Pexels + Bing Image 素材，MoviePy 剪辑渲染，TinyDB 持久化；需安装 ImageMagick、FFmpeg；文档不完整；作者另推出付费后继 ShortX — [ShortGPT README](https://cdn.jsdelivr.net/gh/rayventura/shortgpt@stable/README.md)；[HF README 镜像](https://huggingface.co/spaces/HashScripts/Shorts/blob/e75f6c7634bdd1bb0d08e4fe4311f72330606744/README.md)
- **short-video-maker**（gyoridavid）：Kokoro（kokoro-js）TTS、Whisper.cpp 字幕、Pexels 素材、Remotion 渲染、MCP（create-short-video / get-video-status）+ REST API；仅英文配音、只能用 Pexels、不支持图片/视频输入、核心无 UI；需 ≥3GB 内存、2 vCPU；MIT；约 1.4k stars — [short-video-maker GitHub](https://github.com/gyoridavid/short-video-maker)；第三方目录标注其约 11 个月未更新（stale） — [BeamForAI](https://www.beamforai.com/tools/gyoridavid/short-video-maker)
- **AI-Youtube-Shorts-Generator**（SamurAIGPT）：并非文案生成，而是把长视频切成竖屏短视频：Whisper 转写 + GPT-4o-mini 选高光 + OpenCV 裁剪人脸竖屏 — [Mintlify 文档](https://www.mintlify.com/SamurAIGPT/AI-Youtube-Shorts-Generator/introduction)；[ai-bot.cn](https://ai-bot.cn/ai-youtube-shorts-generator/)
- **OpenMontage**（calesthio）：在 Claude Code/Cursor/Copilot 中运行的 Agent 视频生产系统，宣称 12 条流水线、52 个工具、500+ skills（另一来源称 100+ 工具、700+ skill 文件）；素材生成接 Veo、Kling、FLUX、Stable Diffusion、gpt-image-1，TTS 接 ElevenLabs、OpenAI、Google Chirp3-HD（另有豆包 TTS、Azure TTS skill）；AGPL-3.0；曾登 GitHub Trending #1，stars 由约 4k（2026-05）到约 32k（后续快照） — [OpenMontage GitHub](https://github.com/calesthio/OpenMontage)；[ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fcalesthio%2FOpenMontage)；[dsebastien](https://www.dsebastien.net/openmontage/)；[claudeskills doubao-tts](https://claudeskills.info/skills/calesthio/openmontage/doubao-tts/)
- **LibreTV**：基于 JavaScript 的免费影视搜索/播放聚合站（Apple CMS V10 源、Node 代理、Vercel/Docker 部署），与视频生成无关，且聚合第三方片源存在版权风险 — [OSS Insight](https://ossinsight.io/analyze/LibreSpark/LibreTV)；[51sec](https://blog.51sec.org/2025/07/one-minute-deploy-online-aggregated.html)

**商业产品**
- 剪映"图文成片/文字成片"：见 Q5；第三方教程对字数上限（3000/5000 字）、免费次数（每天 20/100 次）说法不一；有案例"讲人工智能却配了猫的图片"，需人工检查替换 — [KOC](https://www.koc.com.tw/archives/513023)；[aitoollab 2026 教程](https://www.aitoollab.cn/articles/jianying-ai-tutorial-2026/)
- 腾讯智影：在线工具，含数字人播报、文本配音、自动字幕、文章转视频 — [ai-bot.cn](https://ai-bot.cn/sites/360.html)
- 一帧秒创：图文转视频，自动分析文案为各段匹配素材、配音、BGM，支持粘贴文章链接导入 — [量子位](https://www.qbitai.com/2023/03/42829.html)；[mergeek](https://www.mergeek.com/en/latest/32NwznajbqEA0LQ5)
- 阿里云 IMS（可 API 集成的"一键成片"）：智能文案 0.12 元/千 tokens、图文匹配 0.3 元/分钟、脚本化成片按剪辑计费、失败不收费 — [阿里云 IMS 计费](https://help.aliyun.com/en/ims/one-key-into-a-piece)
- Pictory：Starter $25/月（年付）200 分钟视频，Professional $35/月（年付），可检索 Getty Images 与 Storyblocks，场景式编辑器 — [Pictory vs Fliki](https://pictory.ai/blog/pictory-vs-fliki)；[marcandrews](https://marcandrews.com/invideo-vs-pictory-2026-which-ai-video-tool-wins/)
- Fliki：免费层 720p 带水印；Standard $21/月（年付）、Premium $66/月（年付）；2,000+ 音色、80+ 语言、声音克隆，幻灯片式编辑 — [Capterra Fliki](https://www.capterra.com/p/246351/Fliki/)；[Pictory vs Fliki](https://pictory.ai/blog/pictory-vs-fliki)
- InVideo AI：prompt 优先，自动生成含素材、转场、文字、音乐的草稿；付费约 $17–20/月起（credit 制） — [marcandrews](https://marcandrews.com/invideo-vs-pictory-2026-which-ai-video-tool-wins/)；[jupitrr](https://jupitrr.com/alternatives/invideo-alternatives)

### Inferences
- **开源项目共同局限**：①画面靠英文关键词检索 Stock，语义匹配粗、中文场景（中国城市、人物、商品）素材稀缺；②缺少图表/列表/金句等模板动效层，成片"PPT 感/素材拼接感"强；③基于 MoviePy/ffmpeg 的渲染难做精细动效（Remotion 系可解但中文支持弱）；④无 AI 标识/元数据写入等合规功能；⑤字幕时间轴依赖 Edge TTS 时间戳或 Whisper 回识别，中文同音字/断句易错；⑥缺乏审核/人工复核环节与素材版权追踪。
- **可借鉴点**：MoneyPrinterTurbo 的多 Provider 抽象（LLM/TTS/素材/AI 视频可插拔）、OpenMontage 的"阶段化 + skill 文件"Agent 编排、short-video-maker 的 MCP 接口（便于被 Agent 调用）、阿里云 IMS 的"Timeline 预览免费、合成再计费"分离设计。
- 商业 SaaS（剪映、智影、Pictory 等）适合人工单条创作，缺少开放 API（阿里云 IMS、Creatomate/Shotstack 除外），不适合嵌入自动化系统作为核心；可作为效果对标。

### Gaps
- 度加（百度）当前状态与功能、Synthesia 2026 年定价未检索到。
- 剪映"图文成片"是否有开放 API（如火山引擎智能创作云）未核实。
- Open-Sora 系衍生工具在 2026 年的活跃度未调研（鉴于 Wan/商用 API 已显著领先，优先级低）。
