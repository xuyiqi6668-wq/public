# 口播视频自动剪辑：AI/媒体处理链路与产品调研（截至 2026-10-27）

> 范围：从原始口播素材到成片的 AI/媒体处理各步骤（ASR → 清理 → 字幕 → 画面增强 → B-roll → 音频 → 长转短 → 产品对标）。渲染框架与整体系统架构由其他研究员负责，这里不涉及。
> 说明：价格均为厂商页面标注的"原价/刊例价"，不含限时优惠；"折合每小时"为本文按单价换算，并非厂商原话。WER/CER 数字大多为厂商自报。

## 1. 中文（含中英混说）ASR 与字/词级时间戳

### Takeaway
到 2026 年底，开源中文 ASR 的第一梯队是 **Qwen3-ASR（1.7B/0.6B）+ Qwen3-ForcedAligner** 和 **FireRedASR2**，两者在中文测试集上都已超过豆包 ASR，比 Whisper-large-v3 好得多。剪辑最看重字级时间戳，这方面目前最好的开源方案是 Qwen3-ForcedAligner（中文平均对齐误差约 33 ms）；FunASR 的 Paraformer-large 仍是"原生字级时间戳 + 热词 + 速度快"的老牌务实选择。云端方面，阿里百炼（qwen3-asr-flash-filetrans 开启 `enable_words`、paraformer-v2）和火山引擎豆包录音文件识别（返回逐字 words）都能直接给字级时间戳，每小时成本在 0.3–1 元人民币量级。Whisper / WhisperX 用于中文口播剪辑已不是首选。

### Cited Findings

**Qwen3-ASR / Qwen3-ForcedAligner（阿里通义，开源）**
- 2026-01-29 发布，Apache-2.0。包含 Qwen3-ASR-1.7B、Qwen3-ASR-0.6B（识别 + 语种识别）和非自回归的 Qwen3-ForcedAligner-0.6B（时间戳）。支持 52 种语言/方言（30 种语言 + 22 种中文方言），2026-06-26 起原生支持 Transformers — [QwenLM/Qwen3-ASR GitHub](https://github.com/QwenLM/Qwen3-ASR)
- 中文 WER（1.7B）：WenetSpeech net/meeting 4.97/5.88（Fun-ASR-MLT-Nano 为 5.97/6.88）；AISHELL-2 2.71（豆包 ASR 2.85）；SpeechIO 2.88（豆包 2.93）；Fleurs-zh 2.41（豆包 2.69）；CV-zh 5.35（豆包 5.95）；KeSpeech 5.10（豆包 5.27）。GPT-4o-Transcribe 和 Whisper-large-v3 在多数集上明显更差 — [Qwen3-ASR GitHub](https://github.com/QwenLM/Qwen3-ASR)
- ForcedAligner：可给最长 5 分钟音频中的任意单元打时间戳，支持 11 种语言（含中、英、粤）。在 MFA 标注集上平均对齐误差（AAS）为 42.9 ms，NFA 为 129.8 ms，WhisperX 为 133.2 ms。300 秒拼接音频上为 52.9 ms，WhisperX 达 2708.4 ms。中文单项 33.1 ms，NFA 109.8 ms — [Qwen3-ASR GitHub](https://github.com/QwenLM/Qwen3-ASR)；技术报告给出的跨语种（code-switch）Concat-300s AAS 为 34.2 ms；时间戳按"索引 × 80 ms"换算 — [Qwen3-ASR Technical Report, arXiv 2601.21337](https://arxiv.org/html/2601.21337)
- 速度：0.6B 单并发 TTFT 平均 92 ms；128 并发下离线 RTF 0.113，在线异步 RTF 0.064（吞吐 2000×）。1.7B 在 128 并发下离线 RTF 0.131。报告中 ForcedAligner 的 RTF 正文与表格数值不一致（正文约 0.001，表中 0.197） — [arXiv 2601.21337](https://arxiv.org/html/2601.21337)
- 鲁棒性：Mandarin ExtremeNoise WER 为 Qwen3-ASR-1.7B 16.17、豆包 17.04、GPT-4o 36.11、Whisper-large-v3 63.17。22 种方言平均为 1.7B 15.94、豆包 19.85、Whisper-large-v3 44.55。带 BGM 的整首中文歌 WER 13.91 — [arXiv 2601.21337](https://arxiv.org/html/2601.21337)
- 热词/上下文：SFT 阶段加入了 context biasing 数据，可在 system prompt 中放上下文 token（术语、背景）来定制转写。报告没有给出热词专项 benchmark — [arXiv 2601.21337](https://arxiv.org/html/2601.21337)
- 流式只在 vLLM 后端可用，且流式模式**不支持时间戳和批处理**；流式平均 WER 3.33，离线 2.69（1.7B） — [Qwen3-ASR GitHub](https://github.com/QwenLM/Qwen3-ASR)
- 第三方 GigaSpeechBench（2026）中，Qwen3-ASR-1.7B 在多数中文领域子集上错误率最低（约 2%–10%） — [GigaSpeechBench, arXiv 2606.28884](https://arxiv.org/pdf/2606.28884)

**FireRedASR2（小红书 FireRed 团队，开源）**
- FireRedASR2-LLM（8B+，Encoder-Adapter-LLM）：4 个公开普通话集平均 CER 2.89，豆包 ASR 3.69、Qwen3-ASR 3.76、Fun-ASR 4.16。19 个方言/口音集平均 11.55，豆包 15.39、Qwen3-ASR 11.85、Fun-ASR 12.76。权重 2026-02-25 发布，2026-03-05 支持 vLLM，Apache-2.0。**单段音频上限 40 秒**，输入要求 16 kHz 单声道 PCM。示例 RTF 0.068。模型卡没有提时间戳。FireRedASR2S 系统还包含 VAD、LID、标点模块 — [HF: FireRedTeam/FireRedASR2-LLM](https://huggingface.co/FireRedTeam/FireRedASR2-LLM)
- AED 版普通话平均 CER 3.05，方言 11.67 — [FireRedASR2 技术报告 arXiv 2603.10420](https://arxiv.org/pdf/2603.10420)
- 初代 FireRedASR（2025-01）：LLM 版 8.3B 平均 CER 3.05，AED 版 1.1B 为 3.18 — [搜索摘要 / arXiv 2501.14350 相关条目](https://t.me/s/LLM_learning?after=37)（二手来源，建议以论文为准）

**FunASR 系列（阿里通义，开源）**
- Paraformer：非自回归，在 6 万小时人工标注普通话上训练，主干上加了时间戳预测和热词定制 — [FunASR 论文 arXiv 2305.11013](https://arxiv.org/abs/2305.11013v1)
- FunASR 官方选型建议：快速多语种转写选 SenseVoice-Small（附带情绪和音频事件标签，CPU 可跑）；"纯普通话且需要字级时间戳或热词"选 Paraformer — [FunASR model_selection.md（镜像）](https://gh.mise.run.place/modelscope/FunASR/blob/main/docs/model_selection.md)（经搜索摘要获得，抓取时 503）
- SenseVoice 本身不给词/字级时间，做字幕必须再接强制对齐器（社区观点） — [Reddit 讨论快照](https://reddit.sentinel-team.org/posts/1w2hbjm/snapshots/2026-09-04T21%3A20%3A12.3645Z)
- Fun-ASR-Nano-2512（约 0.8B，2025-12，Apache-2.0）：支持中、英、日，覆盖 7 种方言和 26 种口音，**支持热词，但时间戳和说话人分离都还在 TODO**。WER 对比（Whisper-large-v3 / Nano / 闭源 Fun-ASR 7.7B）：AISHELL-1 4.72 / 1.80 / 1.22；WenetSpeech Meeting 18.39 / 6.60 / 6.17；WenetSpeech Net 11.89 / 6.01 / 5.46。工业测试集平均：Whisper 33.39、Paraformer v2 23.49、Nano 16.72、Fun-ASR 12.70 — [HF: Fun-ASR-Nano-2512 README_zh](https://huggingface.co/FunAudioLLM/Fun-ASR-Nano-2512/blob/main/README_zh.md)
- 第三方列表给出 SenseVoice-Small 中文 CER 7.81%、Whisper-large-v3 20.02%、Paraformer-Large 10.18%（未独立验证） — [FunASR MCP listing](https://glama.ai/mcp/servers/modelscope/FunASR)

**Whisper 系**
- faster-whisper（CTranslate2）基准，13 分钟音频、large-v2、RTX 3070 Ti：openai/whisper 2m23s；whisper.cpp 1m05s；faster-whisper fp16 1m03s，batch=8 时 17s，int8 batch=8 时 16s。支持 `word_timestamps=True`，内置 Silero VAD（`vad_filter=True`，默认只切掉超过 2 秒的静音）。README 没有 large-v3/turbo 的 GPU 基准 — [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)
- WhisperX 的词级时间来自 wav2vec2 CTC 音素模型的强制对齐。wav2vec2 对噪声不如 Whisper 鲁棒，转写不一致会进一步降低时间戳精度 — [arXiv 2408.16589](https://arxiv.org/html/2408.16589v1)；含非字母数字字符的词（如 "2014."、"£13.60"）可能拿不到时间戳 — [sourcepulse whisperX 摘要](https://www.sourcepulse.org/projects/1473319)
- 信号：VideoLingo（19k stars）已把默认 ASR 改为本地 Qwen3-ASR + Qwen3-ForcedAligner，WhisperX 改为需要手动安装的可选项 — [Huanshere/VideoLingo](https://github.com/Huanshere/VideoLingo)

**云 API**
- 阿里云百炼录音文件识别：paraformer-v2 单价 **0.00008 元/秒**（折合约 0.29 元/小时），每月免费 36,000 秒（10 小时） — [百炼录音文件识别文档（搜索摘要）](https://help.aliyun.com/zh/model-studio/recording-file-recognition)；qwen3-asr-flash 北京 **0.00022 元/秒**（折合约 0.79 元/小时），新加坡 0.00026；qwen3-asr-flash-realtime 北京 0.00033 元/秒；qwen3-asr-flash-filetrans 北京 0.00022 元/秒 — [qwen3-asr-flash 文档](https://help.aliyun.com/zh/model-studio/qwen3-asr-flash)、[qwen3-asr-flash-filetrans](https://help.aliyun.com/zh/model-studio/qwen3-asr-flash-filetrans)、[qwen3-asr-flash-realtime](https://help.aliyun.com/zh/model-studio/qwen3-asr-flash-realtime)；fun-asr-mtl 0.00022 元/秒 — [fun-asr-mtl](https://help.aliyun.com/zh/model-studio/fun-asr-mtl)
- 百炼模型能力：qwen3-asr-flash-filetrans（异步，2 GB / 12 h）开启 `enable_words=true` 返回词级时间戳（默认句级），支持中英日韩德法西意葡俄。同步版 qwen3-asr-flash（10 MB / 5 min）**不返回**词级时间戳。fun-asr、paraformer-v2（异步 12 h）时间戳常开并支持说话人分离。新出的 qwen-audio-3.1-asr-flash-filetrans 支持 `diarization_enabled`。说话人分离只支持单声道，建议 ≤2 小时 — [百炼录音文件识别](https://help.aliyun.com/zh/model-studio/recording-file-recognition)
- 阿里云智能语音交互（老产品线）：录音文件识别按量 2.50 元/小时，资源包最低 0.80 元/小时。极速版 20,000 小时包 26,000 元（折合 1.30 元/小时） — [阿里云 ISI 计费](https://help.aliyun.com/zh/isi/getting-started/billing-10)、[极速版文档](https://help.aliyun.com/zh/isi/developer-reference/recording-file-recognition-express-edition/)
- 火山引擎豆包"大模型录音文件极速版识别"：单次 HTTP 请求直接返回，音频 ≤2 h、≤100 MB，支持 WAV/MP3/OGG OPUS。结果中每条 utterance 带 `words` 数组，中文**逐字**给出 start_time、end_time、confidence。示例代码里有 `enable_punc`、`enable_itn`、`enable_ddc`（顺滑/去语气词）、`enable_speaker_info` 开关（注释状态，文档未详述）。超过 2 h 的音频用标准版 — [火山引擎文档 6561/1631584](https://docs.volcengine.com/docs/6561/1631584?lang=zh)
- 豆包 ASR 上下文/热词：context 最多约 800 token、20 轮；热词可在 context 中直传，最多 5000 个。该参数表没有明确标出适用于哪个接口版本 — [火山引擎文档 6492/2172368](https://www.volcengine.com/docs/6492/2172368)
- 某开源剪口播 skill 默认用火山"录音文件识别 2.0 / Seed ASR"（resource `volc.seedasr.auc`，submit/query 异步接口） — [aiskillstore/videocut](https://smithery.ai/skills/aiskillstore/videocut)
- 腾讯云（国际站，美元计价，2026-10-15 更新）：录音文件识别标准版 1.0 USD/小时（0–119,999 小时/月），量大降到 0.9；"大模型版"起步约 1.8 USD/小时，阶梯递减。实时识别标准版 1.4 USD/小时起，大模型版 2.0 起。注意抓取工具对大模型版阶梯的输出前后矛盾，需人工核对 — [腾讯云计费文档](https://www.tencentcloud.com/zh/document/product/1118/43352)

**说话人分离（Diarization）**
- pyannote speaker-diarization-community-1（相对 3.1，无 collar）：AISHELL-4 DER 12.2→11.7，AliMeeting(ch1) 24.5→20.3，RAMC 22.2→20.8。付费 Precision-2 分别为 11.4（AISHELL-4）和 10.5（RAMC）（厂商自报） — [HF: pyannote/speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1)
- 独立多语种（含普通话）评测：PyannoteAI 11.2% DER 最好，开源 DiariZen 13.3% — [Benchmarking Diarization Models, arXiv 2509.26177](https://arxiv.org/html/2509.26177v1)
- FunClip 用 CAM++（3D-Speaker）做说话人识别，可以按说话人剪辑 — [modelscope/FunClip](https://github.com/modelscope/FunClip)

### Inferences
- **推荐组合（中文口播剪辑）**：
  - 本地/私有化：VAD 分段 → Qwen3-ASR-1.7B（或 0.6B 求吞吐）→ Qwen3-ForcedAligner 出字级时间戳。中英混说时 aligner 同时支持中英，code-switch 误差约 34 ms。
  - 只要快和热词：FunASR Paraformer-large（SeACo 热词）+ fsmn-vad + ct-punc，一次调用就有字级时间戳。
  - 追求极限中文准确率：FireRedASR2，但只能处理 ≤40 s 的段，必须先 VAD 切段，且时间戳需另接对齐器。
- **云端首选**：百炼 qwen3-asr-flash-filetrans（`enable_words`，约 0.79 元/h）或 paraformer-v2（约 0.29 元/h，最便宜）；火山极速版（逐字 words + ddc 顺滑，单请求返回，便于交互式剪辑）。按 1 小时素材算，ASR 成本不到 1 元人民币，基本可以忽略，延迟和时间戳质量才是选型重点。
- 口播剪辑要的是精确的"字边界"，用来切口误和气口。40–100 ms 的对齐误差决定了切点会不会吃字。建议对切点再做 ±(30–80) ms 的能量/过零点微调（见 Q2）。
- 流式 Qwen3-ASR 不出时间戳，所以剪辑链路应走离线/文件转写模式。
- Whisper-large-v3 在中文工业集上的平均 WER（33.39）约为 Fun-ASR-Nano（16.72）的 2 倍，极端噪声下更差（63.17）。凡是以 Whisper/WhisperX 为核心的老教程（2023–2024），用于中文都应视为**过时**。

### Gaps
- 讯飞录音文件转写、火山豆包录音文件识别（标准版/极速版/2.0）的官方人民币单价没有查到（火山计费页只返回目录）。
- Dolphin（DataoceanAI）、Qwen-Audio 系列的中文 CER 与时间戳能力没有检索。
- 没有找到中英混说（code-switch）ASR 的公开横评，Qwen3 报告只给了对齐误差。
- 3D-Speaker/CAM++ 与 pyannote 在中文口播（单人为主）场景的对比数据缺失。
- SenseVoice 后续是否加了原生时间戳输出未确认。

## 2. 素材清理：去静音、去语气词、去重复/NG/口误、文本剪辑、避免跳切痕迹

### Takeaway
行业的通行做法是"ASR 字级时间戳 → 规则 + LLM 标注删除候选 → 人工/自动审核 → 按时间段物理切割 → 剪后重新转写生成字幕"。去重复/NG 普遍采用"删前保后"（保留最后一遍）。静音阈值常见 0.2–0.5 s，句间保留 0.2–0.5 s 气口。纯音量阈值工具（auto-editor）仍是静音粗剪的基线，但无法处理语义层面的重复。

### Cited Findings
- **auto-editor**（Nim 编写，Unlicense，5.6k stars）：默认按音量阈值剪辑（`audio:threshold=0.04`，也可写 dB），可选运动阈值 `motion:threshold=0.02`，可组合 `(or audio:0.03 motion:0.06)`。`--margin` 默认在保留段前后各加 0.2 s。可导出 Premiere、DaVinci Resolve、Final Cut Pro、Shotcut、Kdenlive 工程，或输出分段文件 — [WyattBlue/auto-editor](https://github.com/WyattBlue/auto-editor)
- **Silero VAD**：单 CPU 线程处理一个 30+ ms 音频块不到 1 ms；模型约 2 MB；训练语料覆盖 6000+ 种语言；支持 8/16 kHz；MIT — [snakers4/silero-vad](https://github.com/snakers4/silero-vad)
- **开源剪口播 skill（aiskillstore/videocut v3）**，规则最具体：
  - 用火山 Seed ASR 转写。口误分三类，各由一个 agent 检测：A 句间重复（相邻或隔一句、开头共享 ≥5 字，删前句）；B 句内重复（A+中间+A 模式，只删前面的片段）；C 残句（说到一半、停顿后重说，删整段残片）。
  - 原则是"**删前保后**"，保留后面更完整的版本。口吃类重复靠正则处理，"嗯/啊"标记出来交人工复核。
  - 静音 ≥0.2 s 自动勾选删除；≥0.5 s 在分析时视为断句；结尾超出最后一个字 0.3 s 以上的部分补删（ASR 只覆盖有声段，是盲区）。
  - 审核按风险分级：低风险直接删，整句删除和长重复交给"对抗式审核 agent"。
  - 切割用 ffmpeg `filter_complex` 帧精确 trim+concat，按源码率、`-profile:v high`、`yuv420p` 重编码，并强调参数匹配比 CRF 更重要。
  - 切完后对成片重新转写生成字幕，再由 LLM 对照文稿、术语校对。
  - 来源：[smithery: aiskillstore/videocut](https://smithery.ai/skills/aiskillstore/videocut)
- **chengfeng-videocut-skills**（3.1k stars，Apache-2.0）：面向中文口播原素材，逐词转录，识别口误与重复，生成删词候选，在 Studio 审核后执行物理剪切并重建字幕。以 Codex Plugin 形式提供剪口播/字幕/画面/导出等入口 — [GitHub 仓库](https://github.com/Agentchengfeng/chengfeng-videocut-skills)、[tessl 描述](https://tessl.io/registry/skills/github/Agentchengfeng/chengfeng-videocut-skills/chengfeng-cut-talking-head/review)
- **zrt-ai-lab videocut-clip-oral**：FunASR 每 30 秒分段转写，识别语气词（嗯/哎/诶）和 ≥1 s 静音，生成"审查稿"与删除任务 TodoList，等用户确认后由 videocut-clip 用 FFmpeg 执行，再重新转写 — [vibeindex](https://www.vibeindex.ai/skills/zrt-ai-lab/opencode-skills/videocut-clip-oral)
- **剪映"智能剪口播"**：自动识别无声停顿、语气词和重复句，在文本界面删字句，时间线音视频同步裁切 — [36氪 AI 测评 2026-09-07](https://eu.36kr.com/zh/p/3973186277011715)
- **度加剪辑（百度）**"快速剪辑"：识别无声、重复、语气片段，按文本直接剪辑并加字幕，一键"去气口"，支持敏感词批量搜索替换 — [App Store: 度加剪辑](https://apps.apple.com/app/id1552875358)
- **Descript**：Underlord 提供 Remove Retakes（"Have AI remove all of your repeated takes"）和经典的 Remove Filler Words — [Descript changelog Season 6](https://feedback.descript.com/changelog/descript-season-6-release-version-91)；Edit for Clarity 会去掉语气词、离题内容、重复句和开头重录（第三方评测） — [gotranscript 评测](https://gotranscript.com/public/exploring-descripts-new-ai-video-editing-features-a-comprehensive-review)；Underlord 消耗 AI credits — [Sonix 2026 评测](https://sonix.ai/resources/zh/?p=3512)
- 气口经验值（厂商营销内容，谨慎采信）：句间保留 0.3–0.5 s 微停顿可避免"机器人感"；另一篇称口播气口在 0.2–0.8 s 观感最自然 — [B站 鲸剪横评](https://www.bilibili.com/opus/1216171430704578561)
- 文本剪辑开源基线：AutoCut（mli）先用 Whisper/faster-whisper 转写，再让用户在 Markdown 中勾选句子，最后由 FFmpeg 切割拼接；有 daemon 模式监听目录 — [sourcepulse: autocut](https://www.sourcepulse.org/projects/1323362)
- 音频交叉淡化、侧链压缩、响度归一可用 FFmpeg 的 `acrossfade`、`afade`、`sidechaincompress`、`loudnorm` 滤镜实现 — [FFmpeg Filters 文档](https://ffmpeg.org/ffmpeg-filters.html)

### Inferences
- **建议的清理链路**：
  1. 字级 ASR。
  2. 规则层：静音 >阈值、语气词词表（嗯/啊/呃/那个/就是/然后）、正则口吃。
  3. LLM 层：把句子列表连同索引交给 LLM，只返回删除区间（index range），不让它改写文本。重复和残句按"删前保后"处理。
  4. 风险分级审核。
  5. 合并切点。
  6. 剪后重转写生成字幕。
  这与 videocut v3、剪映、Descript 的功能形态一致。
- "那个/就是"这类词有时是实义词，不能一刀切删掉，应由 LLM 结合上下文判断，或交人工确认（videocut 也把嗯/啊交给人工）。
- **避免跳切痕迹（工程推断）**：
  - 切点对齐到字边界后外扩 30–80 ms 的 padding（auto-editor 默认 200 ms，偏保守）。
  - 每个切点加 5–20 ms 音频交叉淡化，防止爆音。
  - 句间保留 0.2–0.4 s 气口，不要完全贴死。
  - 画面层面，同机位跳切可配合自动 punch-in（Q4）或 B-roll 遮挡（Q5）。
  - J/L cut（音频先入或后出）适合多机位/B-roll 场景。
- 要输出可在剪映/PR/达芬奇继续精修的工程，可参考 auto-editor 导出 FCPXML/Premiere XML 的做法，也可以生成剪映草稿（该路径未调研）。

### Gaps
- 剪映智能剪口播、Descript Remove Retakes 的内部算法没有公开资料，只能从功能形态推断。
- 没有找到"LLM 去重复"准确率/召回率的公开评测。
- 剪映官方帮助页没有抓取到（参数如保留停顿时长等未确认）。

## 3. 字幕：中文短视频断句、每行字数、关键词高亮/花字、emoji、逐字卡拉 OK、LLM 纠错、热词

### Takeaway
中文竖屏口播字幕的常见规范是一屏一行、每行约 12–16 字（上限 15–20）、句末不加标点、按语义加停顿断句。逐字动画依赖字级时间戳（Qwen3-ForcedAligner、火山逐字 words、Paraformer）。最有效的纠错方式是"用户文稿/术语表 + LLM 校对，但必须保留原时间轴、不增删实际发音内容"。关键词高亮和 emoji 多由 LLM 从转写稿中挑钩子句、金句、CTA。

### Cited Findings
- 行长规范：
  - Netflix 简体中文时间文本每行上限 16 字符 — [Netflix Partner Help](https://backlothelp.netflix.com/hc/en-us/articles/215274938-What-is-the-maximum-number-of-characters-per-line-allowed-in-Timed-Text-assets)
  - 某高校在线课程字幕规范：每屏一行、每行不超过 20 字 — [暨南大学字幕规范 PDF](https://netc.jnu.edu.cn/_upload/article/files/39/05/561ca6f741ceb84bd09a6c037147/7eb5b7ea-a442-484c-a5c2-44d948adfbcd.pdf)
  - 剪口播字幕 skill 规定竖屏 ≤15 字/行，超出必须拆分；句尾不加标点，句中保留逗号等 — [smithery: zrt-ai-lab/videocut-subtitle](https://smithery.ai/skills/zrt-ai-lab/videocut-subtitle)
  - 火山语音字幕接口中文推荐分句长度 15，默认一屏一行，单行上限默认 46 字 — [火山引擎文档 6561/80909](https://www.volcengine.com/docs/6561/80909)
- 常见坑：字幕工具常把一个汉字按 2 个英文字符宽度计算；用 LLM 重新断句后字幕被切得过碎 — [pyvideotrans 论坛 #4695](https://bbs.pyvideotrans.com/show/4695)、[#4410](https://bbs.pyvideotrans.com/show/4410)
- LLM 字幕校对：对剪后视频重新转写得到 raw.srt，LLM 对照用户文稿、术语和上下文修正，**必须保留原时间、修正术语与同音错字、不得添加未说出的内容** — [aiskillstore/videocut](https://smithery.ai/skills/aiskillstore/videocut)
- 剪映字幕识别时间位置较准，但文本常需人工修正重复字词、语气词和同音字/专有名词错误 — [B站教程 cv49867435](https://www.bilibili.com/read/cv49867435)
- VideoLingo：NLP + AI 断句，可配置长度上限；用自定义和 AI 生成的术语表保证翻译一致；字级对齐用 Qwen3-ForcedAligner — [VideoLingo](https://github.com/Huanshere/VideoLingo)
- 热词手段：
  - SeACo-Paraformer 热词（人名、实体） — [FunClip](https://github.com/modelscope/FunClip)
  - 百炼自定义热词 — [阿里云 custom hot words](https://help.aliyun.com/zh/model-studio/custom-hot-words/)
  - 豆包 context 直传热词，最多 5000 个 — [火山引擎文档](https://www.volcengine.com/docs/6492/2172368)
  - Qwen3-ASR 的 system prompt 上下文 — [arXiv 2601.21337](https://arxiv.org/html/2601.21337)
- 关键词高亮：第三方工具通过分析脚本，识别钩子句、金句和行动号召作为视觉强调对象 — [bytecap auto-highlight-keywords](https://www.bytecap.io/tools/auto-highlight-keywords)；Pictory 也有 Highlight Keywords 功能 — [Pictory docs](https://docs.pictory.ai/guides/branding-customization/highlight-keywords)
- Submagic 自动字幕带动画 emoji、颜色和 GIF — [toolsforhumans Submagic 评测](https://www.toolsforhumans.ai/ai-tools/submagic)
- FunClip v2.2.1 改用 Pillow 渲染内嵌字幕并保留所选颜色，ImageMagick 变为可选 — [FunClip](https://github.com/modelscope/FunClip)

### Inferences
- **断句算法建议**：
  1. 先按 ASR 标点和停顿（如 ≥300 ms）切成语义句。
  2. 超过 N 字（竖屏 12–15、横屏 18–20）时，在逗号、连词或字级时间间隙最大处拆分。
  3. 交给 LLM 只做"在哪里断"的标注，不改字。
  4. 每条字幕时长控制在约 0.8–5 s。
  阈值是工程推断，需要 A/B 测试。
- **卡拉 OK / 逐字动画**：直接用字级时间戳驱动（每字 start/end），英文按词。剪掉口误后时间轴偏移会累积，所以应基于剪后视频重新对齐（videocut 的"剪后重转写"），或在剪切映射表中重映射时间戳。
- **花字/关键词**：让 LLM 对每句输出 {keywords, emphasis_level, emoji?}，渲染层映射成颜色、放大或贴纸。同一信号还可以驱动 Q4 的 punch-in 和 Q6 的音效，一次调用多处复用。
- **纠错**：口播常有提词器文稿，把文稿和 ASR 结果做序列对齐（编辑距离/DTW），差异处交 LLM 判断，比纯 LLM 自由改写更安全。

### Gaps
- 抖音/视频号/小红书官方的字幕字数或安全区规范没有找到。
- 剪映"文稿匹配""关键词高亮"的官方说明没有找到。
- 没有中文 ASR 后 LLM 纠错的定量收益（CER 降幅）公开数据。

## 4. 画面增强：自动推拉/punch-in、人脸检测跟踪与 16:9→9:16 智能重构图、抠像换背景、眼神校正、美颜

### Takeaway
智能竖屏重构图的成熟开源做法是低帧率（约 5 fps）人脸/说话人检测（MediaPipe Face Mesh、OpenCV）→ 裁切窗口中心跟随 → 时序平滑。自动推拉在商业产品（Submagic Magic Zoom）中与语音和关键句同步。抠像方面，RVM 仍是"无需辅助输入、实时"的基线（GPL-3.0，2021 年后基本没更新）；质量最好的是 MatAnyone / MatAnyone 2（CVPR 2026），需要首帧 mask。眼神校正有 NVIDIA Maxine/Broadcast、Captions/Mirage、Sieve API 可用，开源方案不成熟。

### Cited Findings
- **重构图**：
  - wjs-reframing-video skill 用 MediaPipe Tasks 478 点人脸网格，通过 ffmpeg 以 5 fps 采样，跟踪正在说话的人，无人说话时回退到最大人脸，裁出 9:16 窄条 — [clawhub: wjs-reframing-video](https://clawhub.ai/jianshuo/skills/wjs-reframing-video)
  - Google AutoFlip 是基于 MediaPipe 的成熟开源智能重构图框架 — [MediaPipe docs 索引](https://docsearch.algolia.com/mcp/docs/repo/google-ai-edge/mediapipe)
  - DIY 方法：逐帧求人脸中心 → 放置 9:16 窗口 → 平滑防抖 — [Reddit 快照](https://reddit.sentinel-team.org/posts/1qa5ira/snapshots/2026-01-12T03%3A21%3A30.45965Z)
  - AI-Youtube-Shorts-Generator 本地模式用 OpenCV 人脸跟踪加运动平滑 — [GitHub](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator)
  - yt-short-clipper 提供 OpenCV（快）和 MediaPipe（准）两种跟踪模式，MIT — [sourcepulse](https://www.sourcepulse.org/projects/25218362)
  - OpusClip 提供 Auto Reframe API，支持 9:16、1:1、16:9 — [OpusClip blog](https://www.opus.pro/blog/auto-resize-video-api)
- **自动推拉**：Submagic Magic Zoom 有 6 种 zoom 风格（渐进/快速、推/拉），AI 根据转写稿匹配风格并与语音同步，突出"关键时刻"。"Magic B-rolls"按钮一键同时加 zoom、B-roll 和转场；auto-zoom 免费 — [Submagic auto-zooms](https://www.submagic.co/de/features/auto-zooms)
- **抠像**：
  - RVM：MobileNetV3/ResNet50 两个变体，无需 trimap 或背景图。RTX 3090 FP16 下 HD 172 fps、4K 154 fps；GTX 1080 Ti FP32 下 HD 104 fps（仅张量吞吐，完整转换脚本会慢得多）。GPL-3.0，最后的新闻条目是 2021-11 — [PeterL1n/RobustVideoMatting](https://github.com/PeterL1n/RobustVideoMatting)
  - MatAnyone（CVPR 2025）：基于记忆传播的目标指定抠像，需要首帧 mask，在复杂背景下优于 RVM — [CVPR 2025 论文页](https://openaccess.thecvf.com/content/CVPR2025/html/Yang_MatAnyone_Stable_Video_Matting_with_Consistent_Memory_Propagation_CVPR_2025_paper.html)
  - MatAnyone 2（CVPR 2026）：加入学习型质量评估器和 VMReal 数据集（28K 片段、2.4M 帧），自报全指标 SOTA — [CVPR 2026 论文页](https://openaccess.thecvf.com/content/CVPR2026/html/Yang_MatAnyone_2_Scaling_Video_Matting_via_a_Learned_Quality_Evaluator_CVPR_2026_paper.html)
- **眼神校正**：
  - Captions/Mirage 提供 Eye Contact 后期校正，把视线重定向到镜头 — [Captions help: eye contact](https://captions.ai/help/docs/visual/eye-contact)
  - NVIDIA Maxine Eye Contact 可实时处理，也可处理离线视频；集成在免费的 NVIDIA Broadcast 中（需 RTX 显卡，闭源）。开发者使用 Maxine 可能需要申请 — [NVIDIA 开发者博客](https://developer.nvidia.com/blog/improve-human-connection-in-video-conferences-with-nvidia-maxine-eye-contact)、[NVIDIA Broadcast 1.4](https://www.nvidia.com/en-us/geforce/news/jan-2023-nvidia-broadcast-update)
  - Sieve 提供托管 Eye Contact API，一次调用即可 — [Sieve blog](https://sievedata.com/blog/eye-contact-correction-gaze-correction-api)
  - 开源有 LiteGaze（UT Austin 毕设，可无 GPU 运行）和 gaze-correction-cam（BSD-3，实时摄像头），没有成熟的离线 CLI — [LiteGaze](https://ece.utexas.edu/capstone/2024-spring/litegaze-lightweight-gaze-correction-model-and-conferencing-application)、[gaze-correction-cam](https://oosmetrics.com/repo/WangWilly/gaze-correction-cam)

### Inferences
- **口播 punch-in 推荐实现**：
  - 按 Q3 的 LLM 强调标注，在强调句起点做 1.0→1.15–1.3 倍放大，用人脸框中心做缩放锚点。同机位跳切点交替使用 1.0/1.2 两个景别，可以把跳切"合理化"。
  - 人脸检测只需 3–5 fps 抽帧，再插值 + 平滑（EMA/卡尔曼）。中国口播多为单人正面，MediaPipe 足够；多人时需要结合 diarization 或口型（主动说话人检测）。
- **抠像选型**：实时/批量换背景用 RVM（注意 GPL-3.0 对商业闭源分发的约束）；追求发丝级质量用 MatAnyone 2，首帧 mask 可由 SAM 2 或人像分割自动生成（此组合是推断，未验证）。
- 美颜/磨皮在剪映、抖音内置，开源方案未调研。服务端可考虑 GPU 实时滤镜（推断）。

### Gaps
- BiRefNet、SAM 2 在视频抠像中的速度和质量数据没有检索到。
- 美颜滤镜的开源/商用 SDK（如字节特效 SDK、FaceUnity 等）没有调研。
- 剪映"智能运镜/自动推拉"的触发逻辑没有公开资料。
- InsightFace 在重构图中的应用没有检索到具体项目。

## 5. B-roll / 素材插入

### Takeaway
主流实现是"LLM 从转写稿中挑可视化的名词/场景并生成英文检索词 → 调 Pexels/Pixabay 等库存 API → 按字级时间戳插在对应句子上"（MoneyPrinterTurbo、Submagic 均如此）。质量瓶颈在检索词质量和库存覆盖。可用多语种 CLIP 类模型（如 jina-clip-v2，支持中文）对候选素材关键帧做语义重排。生成式 B-roll（文生视频/图）正在被产品集成（如 Vizard AI Studio）。

### Cited Findings
- MoneyPrinterTurbo：LLM 生成脚本和关键词 → 素材搜索（Pexels/Pixabay/Coverr）→ 下载 → 按脚本时间轴排列。匹配质量取决于 LLM 检索词和 Pexels 库存，有时切题，有时只是泛泛相关。免费素材许可需逐条核对 — [deepseek.csdn 流程解析](https://deepseek.csdn.net/6a87860510ee7a33f29d4d4e.html)、[verdent 指南](https://www.verdent.ai/guides/moneyprinterturbo-github)、[ai-bot.cn](https://ai-bot.cn/github-moneyprinterturbo-guide/)
- Pexels API：默认每小时 200 次、每月 20,000 次，符合条款可免费申请无限额度。规避限流会被封禁；每次最多返回 80 条 — [Pexels API 文档](https://www.pexels.com/api/documentation/?language=javascript)
- Submagic：根据上下文自动加 B-roll（第三方称基于转写关键词分析），提供免版税素材，也可导入自有素材 — [toolsforhumans](https://www.toolsforhumans.ai/ai-tools/submagic)、[Submagic auto-zooms 页](https://www.submagic.co/de/features/auto-zooms)
- jina-clip-v2：865M 参数（XLM-RoBERTa 文本塔 + EVA02-L14 视觉塔），训练语料含中文等 29 种非英语语言，Matryoshka 维度可截断 — [arXiv 2412.08802](https://arxiv.org/html/2412.08802v2)
- Vizard 2026 年初上线 AI Studio，可在平台内调用主流图像/视频生成模型，另有 AdMaker 生成 UGC 风格广告 — [creatify OpusClip 定价文（含 Vizard 信息）](https://creatify.ai/blog/opusclip-pricing-plans-and-what-you-ll-actually-pay-in-2026)
- FunClip 的 TwelveLabs Pegasus 路由能结合视频画面和音频推理，而不只依赖文本 — [FunClip](https://github.com/modelscope/FunClip)

### Inferences
- **推荐 B-roll 流程**：
  1. LLM 对每句判断"是否适合插 B-roll"，输出 {句子 index、中文概念、2–3 个英文检索词、时长、类型：实拍/图表/截图/生成}。
  2. 并发检索 Pexels/Pixabay，加上自有素材库（用向量库预先编码好）。
  3. 用 jina-clip-v2 或 Chinese-CLIP 计算句子文本和候选关键帧的相似度并重排。
  4. 放置规则：B-roll 落在句首后约 0.2–0.5 s，覆盖 1.5–4 s，口播音轨不断（L-cut），优先盖住跳切点。
  第 4 步的阈值是工程推断。
- 每条视频调用量大致是句子数 × 检索词数，200 次/小时的 Pexels 默认额度只够少量视频，量产需申请提额或做缓存。
- 中文语境的素材（中国街景、人物）在 Pexels 上覆盖较弱，需要国内素材库或 AIGC 补充（推断）。

### Gaps
- 国内素材库（如新片场、光厂、视觉中国、摄图网等）是否提供开放 API 及价格没有查到。
- Chinese-CLIP 的视频检索 benchmark 没有查到；jina-clip-v2 没有视频检索评测。
- 文生视频（可灵、Seedance、Wan 等）用于 B-roll 的单价没有调研（可能由其他研究员覆盖）。
- Pixabay API 的官方限流没有查到。

## 6. 音频：降噪、响度标准化、BGM 与自动闪避、音效

### Takeaway
降噪首选保守的掩码类模型 DeepFilterNet3（速度快、不幻听）。生成式增强（Resemble Enhance）主观音质高，但有"幻觉改字"的风险，口播慎用。响度方面，YouTube 约 -14 LUFS / -1 dBTP 有多方共识；B站实测约 -12 LUFS；抖音和视频号没有官方数据。BGM 自动闪避可以用 FFmpeg `sidechaincompress` 实现。

### Cited Findings
- DeepFilterNet3 在视频会议音频研究中综合表现优于 RNNoise（可懂度和音质），RNNoise 更快 — [Sinergi 期刊研究](https://publikasi.mercubuana.ac.id/index.php/sinergi/article/view/21917)；VoiceBank-DEMAND 20 条子集上官方 DF3 PESQ 3.029、STOI 0.962、SI-SDR 18.31 dB（样本小） — [soniqo DeepFilterNet3 指南](https://soniqo.audio/guides/denoise)
- Resemble Enhance（latent conditional flow matching）显著提升非侵入式音质指标，但侵入式指标和 CAcc 低，**有幻听/篡改内容倾向**，且只支持 44.1 kHz。ClearerVoice-Studio（MossFormer2，回归式）质量尚可，支持 16/48 kHz — [arXiv 2603.02641](https://arxiv.org/pdf/2603.02641)
- 响度：
  - YouTube 目标约 -14 LUFS 综合响度；工具站表格列为 -14 LUFS / -1 dBTP — [editingtools.io](https://editingtools.io/loudness/)、[filmandflow LUFS 指南](https://filmandflow.beehiiv.com/p/the-ultimate-lufs-guide-perfect-audio-for-social-media)
  - B站：2024-06 个人实测手机端音量均衡约 -12 LUFS，网页端"标准"约 -12、"高动态"约 -20（非官方，可能变化） — [B站专栏](https://www.bilibili.com/opus/942558919908130865)
  - TikTok/Reels 约 -13 LUFS（第三方经验值） — [OpusClip blog](https://opus.pro/blog/best-loudness-normalizers)
- 剪映内置人声分离、降噪（空调和环境噪声）、响度统一、人声增强 — [36氪 2026-09-07](https://eu.36kr.com/zh/p/3973186277011715)
- Submagic 提供音效、背景音乐、静音修剪 — [Submagic auto-zooms 页（相关功能列表）](https://www.submagic.co/de/features/auto-zooms)
- FFmpeg 提供 `loudnorm`（EBU R128 两遍法）、`sidechaincompress`（侧链闪避）、`acrossfade` 等滤镜 — [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html)

### Inferences
- **推荐音频链路**：人声轨 DeepFilterNet3（48 kHz）→ 高通/去齿音/压缩（可选）→ 剪辑拼接（含交叉淡化）→ BGM 轨用 sidechaincompress 以人声为侧链闪避 8–15 dB（数值为推断）→ 混音后 loudnorm 两遍法到 -14 LUFS、TP -1 dBTP。国内平台没有公开标准，统一按 -14 LUFS 出母版最稳妥；目标 B站时可考虑 -12 到 -13。
- **降噪要放在 ASR 之后还是之前**：ASR 应使用原始音频或轻度降噪音频（Qwen3-ASR 本身抗噪强），重度/生成式增强只用于成片音轨，避免影响识别和对齐（推断）。
- 音效（whoosh、pop、ding）可绑定 punch-in、B-roll 入场、关键词花字等事件，与 Q3/Q4 共用同一份 LLM 标注（推断）。
- BGM 选择：LLM 根据情绪/主题打标签，从自有曲库按标签和 BPM 检索；版权音乐是平台合规重点（推断，未调研曲库 API）。

### Gaps
- 抖音、视频号、小红书的官方响度目标没有找到。
- BGM 曲库 API（国内免版权音乐、抖音曲库）及自动选曲方法没有调研。
- DeepFilterNet3、Resemble Enhance、ClearerVoice 在中文口播上的同条件横评缺失。
- Adobe Podcast Enhance 类商用 API 的价格和效果没有调研。

## 7. 长视频切片（长转多条短视频）

### Takeaway
Opus Clip 类产品的核心是"转写 → LLM 按 hook/flow/value/trend 给候选片段打分 → 人脸跟踪重构图 → 加字幕"，按源视频分钟数计费（约 1 credit/分钟）。开源方面已有多套"Whisper + LLM 选段 + OpenCV/MediaPipe 竖屏裁切"项目，FunClip 也支持用 LLM 按语义选段。

### Cited Findings
- OpusClip Virality Score 范围 0–99（仅 Starter/Pro 可见），由 hook（开头抓人）、flow（逻辑连贯、结尾完整）、value（情感共鸣/价值）、trend（契合趋势）四项构成。使用 ClipAnything 时还会评估与用户 prompt 的相关性 — [OpusClip help: virality score](https://help.opus.pro/docs/article/virality-score)
- ClipAnything 分析视觉、音频和情绪线索来定位精彩片段 — [martech.zone](https://martech.zone/opusclip-ai-video-editor-convert-long-videos-to-video-clips/)
- OpusClip 定价（第三方于 2026-08-20 核实）：Free 60 credits/月，Starter $15/月 150 credits，Pro $29/月（年付 $174）300 credits，Business 定制。每处理 1 分钟源视频扣 1 credit，年付 Pro 折合约 $0.048/源分钟。API：Pro 为有限 API，Business 为完整 API — [Creatify](https://creatify.ai/blog/opusclip-pricing-plans-and-what-you-ll-actually-pay-in-2026)、[Castmagic](https://www.castmagic.io/blog/opus-clip-pricing)
- FunClip：把转写稿和 prompt 发给 LLM，LLM 返回片段供 "AI Clip" 按钮裁剪，支持多段剪辑和 SRT 输出 — [modelscope/FunClip](https://github.com/modelscope/FunClip)
- 开源长转短项目：
  - AI-Youtube-Shorts-Generator：LLM（默认 GPT-4o-mini）挑高光 + Whisper + OpenCV 人脸跟踪平滑竖屏裁切 — [GitHub](https://github.com/Anil-matcha/AI-Youtube-Shorts-Generator)、[mintlify 文档](https://www.mintlify.com/SamurAIGPT/AI-Youtube-Shorts-Generator)
  - short-video-generator-AI：faster-whisper 加 LLM "virality framework" — [sourcepulse](https://www.sourcepulse.org/projects/32873366)
  - skate：Ollama + Whisper + OpenCV 纯本地运行 — [ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Fr2hu1%2Fskate)
- 闪剪"直播快剪"：把直播切成高光片段并加字幕、花字和转场 — [App Store: 闪剪](https://apps.apple.com/hk/app/%E9%97%AA%E5%89%AA%E6%95%B0%E5%AD%97%E4%BA%BA-ai-%E6%95%B0%E5%AD%97%E4%BA%BA-%E7%9B%B4%E6%92%AD%E5%88%87%E7%89%87-%E4%B8%80%E9%94%AE%E5%89%AA%E8%BE%91/id1579618651)

### Inferences
- **推荐实现**：
  1. 先用 Q2 链路清理整段。
  2. 按话题切分（LLM 或嵌入相似度做 topic segmentation）。
  3. 生成 15–90 s 候选窗口，起止对齐句边界。
  4. LLM 按 rubric（hook 强度、信息完整度、情绪峰值、独立可理解性、与账号定位的相关度）打分并给标题和钩子文案。
  5. 去重、选 Top-K。
  6. 重构图、字幕、BGM。
- 中文平台的"黄金 3 秒"需要强钩子。可让 LLM 从片段内挑一句最强的话前置作为开头（剪映/Opus 类常见做法，推断），或生成钩子字幕标题。
- 用纯文本打分对口播已经足够；需要看画面（如演示、表情）时可用 TwelveLabs/Gemini 类多模态模型（FunClip 已接 Pegasus）。

### Gaps
- OpusClip 评分模型的具体权重和实现未公开。
- 没有找到"LLM 打分与实际播放量相关性"的公开研究。
- Vizard 的定价和切片算法细节没有查到。

## 8. 产品与开源项目对标

### Takeaway
商业产品已把"剪口播（去静音/语气词/重复）+ 文本剪辑 + 智能字幕/花字 + 自动推拉/B-roll + 降噪响度 + 长转短"做成标配。开源方面能拼出完整链路，但没有一体化成熟方案：FunClip（ASR + LLM 选段）、auto-editor（静音）、AutoCut（文本剪辑）、VideoLingo（字幕/对齐）、chengfeng/videocut 系列 agent skill（中文剪口播口误识别）。2026 年的明显趋势是"以 Agent/Skill 形式编排 ASR + LLM + FFmpeg"，加上 Qwen3-ASR/对齐器替代 Whisper。

### Cited Findings
**商业产品**
- **剪映/CapCut**：
  - 智能剪口播：识别停顿、语气词、重复句，在文本中删除即同步剪辑
  - 语音转字幕和智能解说粗剪
  - 人声分离、降噪、响度统一、人声增强
  - 支持移动端/平板/桌面，7 种语言
  - 来源：[36氪 2026-09-07](https://eu.36kr.com/zh/p/3973186277011715)
  - 字幕文本仍需人工纠错，桌面版只能逐条改字幕，有开发者用脚本导出、改完再导回 — [B站 cv49867435](https://www.bilibili.com/read/cv49867435)
- **Descript（Underlord）**：Remove Retakes、Remove Filler Words、Edit for Clarity，用自然语言指令完成清理、选片段和写 show notes，消耗 AI credits — [Descript Underlord primer](https://www.descript.com/blog/article/underlord-ai-video-editor-primer)、[Descript changelog](https://feedback.descript.com/changelog/descript-season-6-release-version-91)
- **Opus Clip**：长转短、Virality Score、ClipAnything、Auto Reframe（含 API），按源分钟计费 — 见 Q7 来源
- **Submagic**：
  - 动画字幕（emoji、颜色、GIF）
  - Magic Zoom、Magic B-roll、自动转场、静音修剪、音效、BGM、Magic Clips
  - $19/月起，免费 3 条/月；提供 API，价格未公开
  - 来源：[Submagic auto-zooms](https://www.submagic.co/de/features/auto-zooms)、[toolsforhumans](https://www.toolsforhumans.ai/ai-tools/submagic)、[Submagic integrations](https://www.submagic.co/integrations)
- **Captions → Mirage**：
  - 2026-03 母公司更名 Mirage，累计创作 2 亿条视频
  - Eye Contact、AI 动画字幕、去语气词、降噪、提词器、文本指令剪辑、自动多机位切换
  - Mirage Edit（2025-04）自动成片，Co-Editor（2025-08）
  - 来源：[eesel 2026 评测](https://www.eesel.ai/blog/captions-ai)、[Captions help](https://captions.ai/help/docs/visual/eye-contact)
- **Vizard**：长转短；2026 年初上线 AI Studio（接入生成模型）和 AdMaker — [Creatify](https://creatify.ai/blog/opusclip-pricing-plans-and-what-you-ll-actually-pay-in-2026)
- **度加剪辑（百度，原度咔）**：快速剪辑（去无声/重复/语气，按文本剪辑、加字幕、去气口）、AI 提词、一键包装、AI 写文案找素材一键文字成片、敏感词批量替换 — [App Store](https://apps.apple.com/app/id1552875358)
- **闪剪**：AI 数字人口播（上传约 30 秒视频即可复刻形象和声音，输入文字生成口播），直播快剪 — [App Store](https://apps.apple.com/hk/app/%E9%97%AA%E5%89%AA%E6%95%B0%E5%AD%97%E4%BA%BA-ai-%E6%95%B0%E5%AD%97%E4%BA%BA-%E7%9B%B4%E6%92%AD%E5%88%87%E7%89%87-%E4%B8%80%E9%94%AE%E5%89%AA%E8%BE%91/id1579618651)
- **鲸剪 WhaleClip**（鲸歌科技）：主打剪气口，有 B站系列横评（厂商营销内容） — [B站](https://www.bilibili.com/opus/1216171430704578561)

**开源项目**
- **FunClip**（modelscope，6.5k stars，MIT）：
  - ASR 默认 Paraformer-Large（一体化时间戳），SeACo 热词，CAM++ 说话人
  - 可选 Fun-ASR-Nano、SenseVoice、MOSS-Transcribe-Diarize（2026-08-30 v2.2.0 加入，长音频 + 匿名说话人，但不支持精确任意文本剪辑）
  - LLM 剪辑（OpenAI 兼容网关，或 TwelveLabs Pegasus 多模态）
  - Gradio UI/CLI；v2.2.1（2026-09-01）
  - 英文用 `-l en` Paraformer-en，Whisper 支持仍标注"coming soon"
  - 来源：[modelscope/FunClip](https://github.com/modelscope/FunClip)
- **auto-editor**（5.6k stars）：音量/运动阈值静音剪辑，导出到各 NLE — [GitHub](https://github.com/WyattBlue/auto-editor)
- **AutoCut（mli，约 7.4k stars，Apache-2.0）**：Whisper 转写 → Markdown 勾选 → FFmpeg 剪辑，有 daemon 模式 — [sourcepulse](https://www.sourcepulse.org/projects/1323362)、[SourceForge 镜像](https://sourceforge.net/mirror/autocut/)
- **VideoLingo（约 19k stars）**：Qwen3-ASR + ForcedAligner 默认，NLP + LLM 断句，术语表，翻译-反思-改写，多 TTS 配音 — [GitHub](https://github.com/Huanshere/VideoLingo)
- **chengfeng-videocut-skills（3.1k stars，Apache-2.0）**：中文剪口播 Codex 插件（剪口播/字幕/画面/导出/工作台） — [GitHub](https://github.com/Agentchengfeng/chengfeng-videocut-skills)
- **videocut 系列 skill**（aiskillstore/videocut v3、zrt-ai-lab/opencode-skills）：火山或 FunASR 转写 → 口误三分类 + 删前保后 → 网页审核 → FFmpeg 剪 → 剪后重转写 + AI 字幕校对 — [smithery](https://smithery.ai/skills/aiskillstore/videocut)、[vibeindex](https://www.vibeindex.ai/skills/zrt-ai-lab/opencode-skills/videocut-clip-oral)
- **MoneyPrinterTurbo**：主题 → LLM 文案/关键词 → Pexels 素材 → TTS → 字幕 → 合成（文案成片而非口播剪辑，但 B-roll 检索可借鉴） — [verdent 指南](https://www.verdent.ai/guides/moneyprinterturbo-github)
- **长转短**：AI-Youtube-Shorts-Generator、yt-short-clipper、skate — 见 Q7

### Inferences
- **商业产品的技术实现推断**：
  - 剪映的"智能剪口播"与度加的"快速剪辑"几乎一致，都是"字级 ASR 时间戳 + 静音/语气词规则 + 重复句检测（很可能是相似度或 LLM）+ 文本即时间线"。字节系可直接用豆包 ASR（火山极速版有逐字时间戳和 ddc 顺滑开关）。
  - Descript 的 Remove Retakes、Submagic 的 B-roll、Opus 的打分都是 LLM 在转写稿上做结构化标注，再由规则引擎落到时间线。
- **差异化机会（针对中文自动化系统）**：
  1. 中文字级时间戳 + 中英混说的高精度对齐（Qwen3-ForcedAligner）。
  2. 可解释、可审核的删除候选（风险分级）。
  3. 文稿对齐纠错 + 术语表。
  4. 一份 LLM 标注同时驱动花字、推拉、B-roll、音效。
  5. 一次清理输出多平台版本（9:16/16:9，不同时长和响度）。
- **开源可直接复用的组件**：
  - FunClip 的 Paraformer + SeACo + CAM++ 管线和 LLM 选段 prompt 结构
  - auto-editor 的 NLE 导出
  - VideoLingo 的断句和术语逻辑
  - videocut v3 的口误三分类规则和 FFmpeg 重编码参数实践
- **许可注意**：RVM 为 GPL-3.0；auto-editor 为 Unlicense；FunClip 代码 MIT，模型权重另有许可；Qwen3-ASR、FireRedASR2 为 Apache-2.0。

### Gaps
- 秒剪（腾讯系）和必剪（B站）的 AI 口播功能在本轮搜索中没有查到可靠描述。
- 剪映"文字成片"的实现细节和 CapCut 国际版的差异没有调研。
- 各商业产品的中文口播处理准确率没有第三方定量评测。
- Opus Clip、Submagic、Vizard 对中文口播的支持质量没有找到评测。
