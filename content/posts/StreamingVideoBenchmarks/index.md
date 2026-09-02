+++
date = '2026-05-02T17:28:21+08:00'
lastmod = '2026-09-02T17:30:00-05:00'
title = 'Benchmarks for Streaming Video Understanding'
description = 'A short index of benchmarks used by recent streaming and long-video VLM papers.'
categories = ["AI", "VLM", "summary"]
tags = ["benchmark", "survey", "Video-LLM", "streaming", "long video", "StreamingBench", "OVO-Bench", "Inf-Streams-Eval", "MLVU", "Video-MME", "HiVU", "LongVideoBench", "HourVideo", "LongerVideos", "streaming-video-lmm"]
math = false
decor_image = "images/bg2.png"
+++

> **Series guide.** This article is the evaluation-protocol index. Start with
> the [development-history hub]({{% relref path="/posts/StreamingVideoLMM-Development" %}})
> for the six research paths, and use the
> [pipeline survey]({{% relref path="/posts/StreamingVLM-Pipeline" %}}) for the
> stage-by-stage architecture view.

This post is a small index for the benchmarks that appear repeatedly in recent streaming video / long-video VLM papers.

The main split is simple:
- **online streaming benchmarks** test whether the model can answer while the video is still coming in;
- **offline long-video benchmarks** test long-context video understanding, but usually assume the whole video is already available;
- **standard video QA benchmarks** are useful for comparability, but they are not the real target of streaming-memory papers.

The tables below are copied or compacted from the corresponding method papers.
They should not be read as one unified leaderboard:
backbones, frame rates, memory budgets, judge versions, subtitle settings, and dataset splits often differ.

## Online / Streaming Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **RVS-Ego** | Streaming QA on egocentric videos with timestamped questions. Good for testing whether old visual evidence remains accessible. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **rLiVS**, **MuKV** |
| **RVS-Movie** | Streaming QA on movie-style videos. More narrative and event-heavy than RVS-Ego. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **rLiVS**, **MuKV** |
| **StreamingBench** | Broader streaming benchmark. Recent papers often use the real-time visual understanding subset for causal evaluation, while the full benchmark also covers omni-source and contextual understanding. | **StreamKV**, **LiveVLM**, **InfiniPot-V**, **MuKV**, **SimpleStream**, **WeaveTime**, **STC**, **OASIS** |
| **OVO-Bench** | Timestamp-conditioned online evaluation with real-time perception, backward tracing, and forward active responding tracks. Useful for separating present grounding from historical recall and future-event waiting. | **SimpleStream**, **StreamingVLM**, **WeaveTime**, **STC**, **OASIS** |
| **Inf-Streams-Eval** | Dense, per-second commentary over complete sports broadcasts averaging more than two hours. It evaluates synchronized continuous generation rather than question answering. | **StreamingVLM** |
| **StreamBench** | Online multi-turn video QA with memory-heavy question types such as object search, long-term memory search, short-term memory search, conversational interaction, knowledge QA, and simple factual QA. | **StreamChat**; baselines include **Video-online** and **Flash-VStream** |

### RVS-Ego

Metric: open-ended streaming VideoQA, usually reported as LLM-judge `Acc.` and a 1-5 `Score` / `Sco.`.
Judge versions differ across papers, so rows are grouped by paper setting rather than normalized.

| Method / Paper | Backbone or Setting | Acc. | Score / Sco. | Source |
| --- | --- | ---: | ---: | --- |
| ReKV Internal Retrieval | LLaVA-OV-7B; 0.5 FPS; KV offload | 63.7 | 4.0 | [ReKV Table 5](https://arxiv.org/pdf/2503.00540) |
| StreamMem | LLaVA-OneVision-7B; GPU memory < 28 GB | 57.6 | 3.8 | [StreamMem Table 2](https://arxiv.org/pdf/2508.15717) |
| LiveVLM | LLaVA-OneVision-Qwen2-7B-OV; 24 GB; no CPU offload | 57.8 | 3.9 | [LiveVLM Table 3](https://arxiv.org/pdf/2505.15269) |
| StreamingTOM | LLaVA-OV-7B; GPT-3.5-turbo-0125; 28 GB | 58.3 | 3.9 | [StreamingTOM Table 2](https://arxiv.org/pdf/2510.18269) |
| rLiVS | LLaVA-OV-7B; 0.5 FPS; 10K context | 65.3 | 4.0 | [rLiVS Table 3](https://arxiv.org/pdf/2510.17364) |
| rLiVS | Qwen2.5-VL-7B; RVS streaming setting | 68.1 | 4.0 | [rLiVS Table 3](https://arxiv.org/pdf/2510.17364) |
| MuKV | LLaVA-OV-7B; 8.3K inference tokens; 59K memory tokens | 59.5 | - | [MuKV Table 1](https://arxiv.org/pdf/2605.22269) |

### RVS-Movie

Metric: open-ended streaming VideoQA, again reported with LLM-judge accuracy and sometimes a 1-5 score.
MuKV uses GPT-3.5-turbo after GPT-3.5-turbo-0613 was deprecated, so its accuracy is not directly comparable with older judge-version rows.

| Method / Paper | Backbone or Setting | Acc. | Score / Sco. | Source |
| --- | --- | ---: | ---: | --- |
| ReKV Internal Retrieval | LLaVA-OV-7B; 0.5 FPS; KV offload | 54.4 | 3.6 | [ReKV Table 5](https://arxiv.org/pdf/2503.00540) |
| StreamMem | LLaVA-OneVision-7B; GPT-3.5-turbo-0125; GPU memory < 28 GB | 52.7 | 3.4 | [StreamMem Table 2](https://arxiv.org/pdf/2508.15717) |
| LiveVLM | LLaVA-OneVision-Qwen2-7B-OV; 24 GB; no CPU offload | 53.4 | 3.6 | [LiveVLM Table 3](https://arxiv.org/pdf/2505.15269) |
| StreamingTOM | LLaVA-OV-7B; GPT-3.5-turbo-0125; 28 GB | 53.2 | 3.5 | [StreamingTOM Table 2](https://arxiv.org/pdf/2510.18269) |
| rLiVS | LLaVA-OV-7B; 0.5 FPS; 10K context | 57.7 | 3.6 | [rLiVS Table 3](https://arxiv.org/pdf/2510.17364) |
| rLiVS | Qwen2.5-VL-7B; 0.5 FPS; 10K context | 56.1 | 3.6 | [rLiVS Table 3](https://arxiv.org/pdf/2510.17364) |
| MuKV | LLaVA-OV-7B; GPT-3.5-turbo; 8.3K inference tokens; 59K memory tokens | 48.5 | - | [MuKV Table 1](https://arxiv.org/pdf/2605.22269) |

### StreamingBench

Metric scope varies by paper: some use the full benchmark, some use real-time visual understanding, and some aggregate real-time plus omni-source tasks.

| Method / Paper | Backbone or Setting | StreamingBench Scope | Main Metric | Score | Source |
| --- | --- | --- | --- | ---: | --- |
| StreamKV | LLaVA-OneVision-Qwen2-7B-OV; 0.5 FPS; 60% KV compression | Full: real-time, omni-source, contextual | Overall | 58.9 | [StreamKV Table 1](https://arxiv.org/pdf/2511.07278) |
| LiveVLM | LLaVA-OneVision-Qwen2-7B-OV; 12K cache; 40% retrieval | Real-time + omni-source | Overall | 63.10 | [LiveVLM Table 4](https://arxiv.org/pdf/2505.15269) |
| InfiniPot-V | Qwen-2.5-VL-7B; 4K memory budget | Real-time visual understanding | StreamingBench | 76.4 | [InfiniPot-V Table 4](https://arxiv.org/pdf/2506.15745) |
| MuKV | LLaVA-OV-7B; 0.5 FPS; 59K memory tokens per 300 frames | Real-time visual understanding | All | 64.4 | [MuKV Table 1](https://arxiv.org/pdf/2605.22269) |
| SimpleStream | Qwen3-VL-8B + 4 recent frames; 1 FPS causal prefix | RTVU accuracy | StreamingBench RTVU | 80.59 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |
| WeaveTime | LLaVA-OV-7B; 1 FPS; multi-turn evaluation | Real-time visual understanding | Real-Time AVG | 72.13 | [WeaveTime Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |
| WeaveTime | Qwen2-VL-7B; 1 FPS; multi-turn evaluation | Real-time visual understanding | Real-Time AVG | 75.39 | [WeaveTime Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |
| STC-Cacher & Pruner | LLaVA-OneVision-7B + ReKV; 0.5 FPS | Real-time visual understanding | AVG | 65.2 | [STC Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf) |
| OASIS | Qwen3-VL-8B; 0.5 FPS; official All Context setting | Real-time visual understanding | Real-Time All | 78.22 | [OASIS Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.pdf) |

### OVO-Bench

Metric handling varies by paper.
The first table keeps the observed-only aggregate used by SimpleStream, with `OVO RT Avg.`, `OVO Bwd Avg.`, and `OVO Avg.`.

| Method / Paper | Backbone or Setting | OVO RT Avg. | OVO Bwd Avg. | OVO Avg. | Source |
| --- | --- | ---: | ---: | ---: | --- |
| Qwen2.5-VL-7B | 1 FPS causal prefix | 59.9 | 44.7 | 52.28 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |
| StreamForest-7B | 1 FPS | 61.2 | 52.0 | 56.60 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |
| HERMES-7B | 1 FPS; Qwen2.5-VL-7B + HERMES 4K tokens | 69.0 | 49.4 | 59.20 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |
| SimpleStream | Qwen2.5-VL-7B + 4 recent frames | 78.4 | 51.9 | 65.13 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |
| SimpleStream | Qwen3-VL-8B + 4 recent frames | 81.4 | 54.0 | 67.70 | [SimpleStream Table 1](https://arxiv.org/pdf/2604.02317) |

Other recent papers report only selected OVO-Bench tracks or use a paper-specific causal protocol.
Their results are kept in a separate table rather than filling a synthetic overall average.

| Method / Paper | Backbone or Setting | Reported OVO-Bench Metrics | Source |
| --- | --- | --- | --- |
| StreamingVLM | Qwen2.5-VL-7B; streaming SFT; VQA evaluation | Realtime: 61.96 | [StreamingVLM Table 3](https://arxiv.org/pdf/2510.09608) |
| WeaveTime | LLaVA-OV-7B; 1 FPS; multi-turn evaluation | Real-Time AVG: 68.82 | [WeaveTime Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |
| WeaveTime | Qwen2-VL-7B; 1 FPS; multi-turn evaluation | Real-Time AVG: 66.28 | [WeaveTime Table 2](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |
| STC-Cacher & Pruner | LLaVA-OneVision-7B + ReKV; 0.5 FPS | Real-Time: 62.5; Backward: 63.3; Forward: 52.0 | [STC Table 1](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf) |
| OASIS | Qwen2.5-VL-7B; 0.5 FPS | Perception: 67.26; Backward: 52.61 | [OASIS Table 1](https://openaccess.thecvf.com/content/CVPR2026/papers/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.pdf) |
| OASIS | Qwen3-VL-8B; 0.5 FPS | Perception: 78.14; Backward: 57.21 | [OASIS Table 1](https://openaccess.thecvf.com/content/CVPR2026/papers/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.pdf) |

### Inf-Streams-Eval

Metric: GPT-5 pairwise preference against a named baseline, with access to reference commentary.
This is a dense continuous-commentary evaluation, not an accuracy score and not directly comparable with streaming VideoQA tables.

| Method / Paper | Setting | Comparison | Win Rate | Source |
| --- | --- | --- | ---: | --- |
| StreamingVLM | Infinite streaming mode; complete sports games average 2.12 hours | vs. GPT-4o mini in 100-second chunks | 66.18% | [StreamingVLM Table 1](https://arxiv.org/pdf/2510.09608) |

### StreamBench

Metrics: `Sco.`, `Acc.`, `Coh.`, and `RPD`; the full paper also reports six-task breakdowns for object search, long-term memory, short-term memory, conversational interaction, knowledge QA, and simple factual QA.

| Method / Paper | Setting | FPS | Sco. | Acc. | Coh. | RPD | Source |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Video-online | Streaming baseline | 5 | 3.11 | 56.4 | 1.94 | 1.07 | [StreamChat Table 4](https://arxiv.org/pdf/2501.13468) |
| Flash-VStream | Streaming baseline | 1 | 2.89 | 52.1 | 2.21 | 4.15 | [StreamChat Table 4](https://arxiv.org/pdf/2501.13468) |
| StreamChat Slow | LongVA + CLIP-L-P14 | 15 | 3.48 | 64.7 | 1.76 | 0.90 | [StreamChat Table 4](https://arxiv.org/pdf/2501.13468) |
| StreamChat Base | LongVA + CLIP-L-P14 | 20 | 3.42 | 63.8 | 1.79 | 0.89 | [StreamChat Table 4](https://arxiv.org/pdf/2501.13468) |
| StreamChat Fast | LongVA + CLIP-L-P14 | 32 | 3.28 | 61.7 | 1.81 | 0.85 | [StreamChat Table 4](https://arxiv.org/pdf/2501.13468) |

## Offline Long-video Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **MLVU** | Long-video multiple-choice understanding. Often used as a compact proxy for long-context video reasoning. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **InfiniPot-V**, **AdaVideoRAG**, **MuKV**, **WeaveTime**, **STC** |
| **Video-MME** | General long-video multimodal understanding across short, medium, and long videos. Papers often report the no-subtitle setting. | **StreamMem**, **LiveVLM**, **StreamingTOM**, **InfiniPot-V**, **AdaVideoRAG**, **ViG-RAG**, **MuKV**, **StreamingVLM**, **STC** |
| **EgoSchema** | Long-range egocentric video reasoning. Useful for memory and temporal reasoning evaluation. | **ReKV**, **StreamMem**, **StreamingTOM**, **InfiniPot-V**, **MuKV**, **STC** |
| **LongVideoBench** | Long-video QA with stronger pressure on long-context multimodal reasoning. | **LiveVLM**, **StreamingTOM**, **InfiniPot-V**, **ViG-RAG**, **StreamingVLM** |
| **HourVideo** | Hour-scale egocentric video QA over videos lasting 20–120 minutes. | **OASIS** |
| **HiVU** | Hierarchical long-video benchmark for knowledge-rich videos. It separates questions into different reasoning levels, making it useful for adaptive VideoRAG evaluation. | **AdaVideoRAG** |
| **LongerVideos** | Long-form and multi-video benchmark used to test retrieval and reasoning over extended videos, especially for graph-RAG style methods. | **ViG-RAG** |
| **ActivityNet-QA** | Open-ended video QA with longer activity videos. | **ReKV**, **StreamChat** |
| **QAEGO4D** | Egocentric long-video QA. | **ReKV**, **WeaveTime** |
| **CG-Bench / CGBench** | Clue-grounded long-video QA, useful for retrieval-heavy methods. | **ReKV**, **rLiVS** |
| **MovieChat** | Long movie/video understanding. | **rLiVS** |
| **VS-Ego / VS-Movie** | Offline long-video evaluation around egocentric and movie scenarios. | **rLiVS** |

### MLVU

Metric: accuracy. Most streaming-memory papers report a single MLVU score, while AdaVideoRAG reports MLVU_test category scores plus `AVG`.

| Method / Paper | Backbone or Setting | Split / Metric | Score | Source |
| --- | --- | --- | ---: | --- |
| ReKV | LLaVA-OV-7B; 0.5 FPS -> 64 frames | MLVU dev Acc. | 68.5 (+3.8) | [ReKV Table 6](https://arxiv.org/pdf/2503.00540) |
| StreamMem | LLaVA-OneVision-7B; 0.5/0.2 FPS; KV size 6K | MLVU | 66.9 | [StreamMem Table 1](https://arxiv.org/pdf/2508.15717) |
| LiveVLM | LLaVA-OneVision-7B; 0.5/0.2 FPS | MLVU | 68.1 | [LiveVLM Table 2](https://arxiv.org/pdf/2505.15269) |
| StreamingTOM | LLaVA-OV-7B; 0.5/0.2 FPS | MLVU | 67.9 | [StreamingTOM Table 1](https://arxiv.org/pdf/2510.18269) |
| InfiniPot-V | Qwen-2-VL-7B; 768 frames; 6K budget | MLVU | 65.8 | [InfiniPot-V Table 1](https://arxiv.org/pdf/2506.15745) |
| AdaVideoRAG | VideoLLaMA3-7B; 1 FPS; 180 frames | MLVU_test AVG | 53.2 | [AdaVideoRAG Table 1](https://arxiv.org/pdf/2506.13589) |
| MuKV | LLaVA-OV-7B; 0.5 FPS; 5.9K memory tokens | MLVU | 67.8 | [MuKV Table 9](https://arxiv.org/pdf/2605.22269) |
| MuKV | Qwen3-VL-4B; 0.5 FPS; 5.9K memory tokens | MLVU | 66.0 | [MuKV Table 9](https://arxiv.org/pdf/2605.22269) |
| WeaveTime C2F | LLaVA-OV-7B + ReKV; retrieval ablation | MLVU Acc. | 68.9 | [WeaveTime Table 4](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |
| STC-Cacher & Pruner | LLaVA-OneVision-7B + ReKV; offline evaluation | MLVU-dev | 67.0 | [STC Table 3](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf) |

### Video-MME

Metric: accuracy-style Video-MME scores. Subtitle settings and split labels differ; `All`, `Overall`, `Ovl.`, and `VideoMME` are kept close to the paper wording.

| Method / Paper | Backbone or Setting | Scope | Short | Medium | Long | Overall / All | Source |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- |
| StreamMem | LLaVA-OneVision-7B; 0.5/0.2 FPS; KV size 6K | w/o subtitles | - | 56.6 | 50.1 | 59.4 | [StreamMem Table 1](https://arxiv.org/pdf/2508.15717) |
| LiveVLM | LLaVA-OneVision-Qwen2-7B-OV; 12K cache | w/o subtitles | - | 57.0 | 51.3 | 59.6 | [LiveVLM Table 2](https://arxiv.org/pdf/2505.15269) |
| StreamingTOM | LLaVA-OV-7B; 0.5/0.2 FPS | w/o subtitles | 71.3 | 57.8 | 50.6 | 59.9 | [StreamingTOM Table 1](https://arxiv.org/pdf/2510.18269) |
| InfiniPot-V | Qwen-2-VL-7B; 768 frames; 6K budget | w/o subtitles | - | - | - | 62.8 | [InfiniPot-V Table 1](https://arxiv.org/pdf/2506.15745) |
| AdaVideoRAG | VideoLLaMA3-7B; 1 FPS; 180 frames | subtitle setting not stated | 80.3 | 65.4 | 59.8 | 68.5 | [AdaVideoRAG Table 2](https://arxiv.org/pdf/2506.13589) |
| ViG-RAG | LLaVA-Video-72B; 32 frames; text 2.1K | subtitle setting not stated | 79.3 | 71.1 | 72.8 | 74.4 | [ViG-RAG Table 2](https://ojs.aaai.org/index.php/AAAI/article/download/36963/40925) |
| MuKV | Qwen3-VL-4B; 0.5 FPS; 5.9K memory tokens | subtitle setting not restated | - | 61.8 | 51.0 | 63.6 | [MuKV Table 9](https://arxiv.org/pdf/2605.22269) |
| StreamingVLM | Qwen2.5-VL-7B; streaming SFT | w/o subtitles | - | - | - | 65.10 | [StreamingVLM Table 3](https://arxiv.org/pdf/2510.09608) |
| STC-Cacher & Pruner | LLaVA-OneVision-7B + ReKV; offline evaluation | subtitle setting not restated | 67.3 | 53.9 | 48.3 | 56.5 | [STC Table 3](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf) |

### EgoSchema

Metric: accuracy. StreamMem, StreamingTOM, and InfiniPot-V explicitly use the official dev/development split; MuKV treats the offline setting as asking at the video end.

| Method / Paper | Backbone or Setting | Acc. | Source |
| --- | --- | ---: | --- |
| ReKV | LLaVA-OV-7B; 0.5 FPS -> 64 frames | 60.7 (+0.9) | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| StreamMem | Qwen2-VL-7B; 4.0/0.5 FPS; KV size 6K | 67.2 | [StreamMem Table 1](https://arxiv.org/pdf/2508.15717) |
| StreamingTOM | LLaVA-OV-7B; 0.5/0.2 FPS | 63.7 | [StreamingTOM Table 1](https://arxiv.org/pdf/2510.18269) |
| InfiniPot-V | LLaVA-Next-7B; 128 frames; 6K budget | 65.8 | [InfiniPot-V Table 1](https://arxiv.org/pdf/2506.15745) |
| MuKV | Qwen3-VL-4B; 0.5 FPS; 5.9K memory tokens | 67.0 | [MuKV Table 9](https://arxiv.org/pdf/2605.22269) |
| STC-Cacher & Pruner | LLaVA-OneVision-7B + ReKV; offline evaluation | 59.0 | [STC Table 3](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf) |

### LongVideoBench

Metric: accuracy-style LongVideoBench / LVB score. ViG-RAG discusses LongVideoBench in the dataset section but does not report a standalone LongVideoBench result table.

| Method / Paper | Backbone or Setting | Split / Column | Score | Source |
| --- | --- | --- | ---: | --- |
| LiveVLM | LLaVA-OneVision-7B; 0.5/0.2 FPS | LVB | 56.1 | [LiveVLM Table 2](https://arxiv.org/pdf/2505.15269) |
| StreamingTOM | LLaVA-OV-7B; 0.5 FPS | Accuracy | 56.3 | [StreamingTOM Table 5](https://arxiv.org/pdf/2510.18269) |
| InfiniPot-V | Qwen-2-VL-7B; 768 frames; 6K budget | LVB | 58.4 | [InfiniPot-V Table 1](https://arxiv.org/pdf/2506.15745) |
| InfiniPot-V | LLaVA-Next-7B; 128 frames; 6K budget | LVB | 60.9 | [InfiniPot-V Table 1](https://arxiv.org/pdf/2506.15745) |
| StreamingVLM | Qwen2.5-VL-7B; streaming SFT | LongVideoBench | 59.00 | [StreamingVLM Table 3](https://arxiv.org/pdf/2510.09608) |

### HourVideo

Metric: overall accuracy on the hour-scale egocentric benchmark.
OASIS reports this result in its supplementary long-horizon evaluation rather than its main benchmark table.

| Method / Paper | Backbone or Setting | Accuracy | Source |
| --- | --- | ---: | --- |
| Qwen3-VL-8B | OASIS reproduction baseline | 35.11 | [OASIS Supplementary Table 7](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_supplemental.pdf) |
| OASIS | Qwen3-VL-8B + hierarchical event memory | 37.35 | [OASIS Supplementary Table 7](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_supplemental.pdf) |

### HiVU

Metric: LLM-judged pairwise win rate. AdaVideoRAG uses DeepSeek-32B as the arbiter in the HiVU evaluation.

| Comparison | Method | Split | Comprehensiveness | Empowerment | Trustworthiness | Depth | Density | Overall Winner | Source |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Base vs AdaVideoRAG | VideoLLaMA3 baseline | Overall | 35.98% | 30.88% | 30.58% | 26.23% | 31.03% | 30.58% | [AdaVideoRAG Table 4](https://arxiv.org/pdf/2506.13589) |
| Base vs AdaVideoRAG | AdaVideoRAG | Overall | 64.02% | 69.12% | 69.42% | 73.77% | 68.97% | 69.42% | [AdaVideoRAG Table 4](https://arxiv.org/pdf/2506.13589) |
| VideoRAG vs AdaVideoRAG | VideoRAG | Overall | 45.33% | 43.81% | 46.40% | 40.88% | 44.10% | 44.10% | [AdaVideoRAG Table 4](https://arxiv.org/pdf/2506.13589) |
| VideoRAG vs AdaVideoRAG | AdaVideoRAG | Overall | 54.67% | 56.19% | 53.60% | 59.12% | 55.90% | 55.90% | [AdaVideoRAG Table 4](https://arxiv.org/pdf/2506.13589) |

### LongerVideos

Metric: win-rate comparison over long-form videos. ViG-RAG repeats the comparison against several graph/text RAG baselines; this compact table shows the GraphRAG-l group.

| Method / Paper | Setting | Comprehensiveness | Clarity | Depth | Relevance | Practical Value | Overall | Source |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| GraphRAG-l | LongerVideos overall group | 22.59% | 23.33% | 21.99% | 22.96% | 21.24% | 22.42% | [ViG-RAG Table 1](https://ojs.aaai.org/index.php/AAAI/article/download/36963/40925) |
| VideoRAG | LongerVideos overall group | 33.41% | 34.43% | 35.31% | 35.62% | 36.26% | 35.81% | [ViG-RAG Table 1](https://ojs.aaai.org/index.php/AAAI/article/download/36963/40925) |
| ViG-RAG | LongerVideos overall group | 44.00% | 42.24% | 42.70% | 41.42% | 42.50% | 41.77% | [ViG-RAG Table 1](https://ojs.aaai.org/index.php/AAAI/article/download/36963/40925) |

### ActivityNet-QA

Metric: open-ended QA `Acc.` and 1-5 `Score` / `Sco.`.

| Method / Paper | Backbone or Setting | Acc. | Score / Sco. | Source |
| --- | --- | ---: | ---: | --- |
| ReKV | LLaVA-OV-0.5B + ReKV; 0.5 FPS -> 64 frames | 52.1 (+1.6) | 3.15 (+0.13) | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| ReKV | LLaVA-OV-7B + ReKV; 0.5 FPS -> 64 frames | 60.4 (+3.8) | 3.52 (+0.23) | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| StreamChat | STREAMCHAT; offline setting | 50.1 | 2.78 | [StreamChat Table 6](https://arxiv.org/pdf/2501.13468) |

### QAEGO4D

Metric: `QaEgo4D_test-mc` accuracy. ReKV also reports retrieval recall in a separate ablation table; this table keeps the offline benchmark comparison rows.

| Method / Paper | Backbone or Setting | test Acc. | Source |
| --- | --- | ---: | --- |
| Flash-VStream-7B | Offline VideoQA comparison | 38.2 | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| LLaVA-OV-0.5B | Base model; 64 frames | 42.6 | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| ReKV | LLaVA-OV-0.5B; 0.5 FPS -> 64 frames | 50.0 (+7.4) | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| LLaVA-OV-7B | Base model; 64 frames | 52.8 | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| ReKV | LLaVA-OV-7B; 0.5 FPS -> 64 frames | 56.0 (+3.2) | [ReKV Table 4](https://arxiv.org/pdf/2503.00540) |
| WeaveTime C2F | LLaVA-OV-7B + ReKV; retrieval ablation | 55.2 | [WeaveTime Table 4](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf) |

### CG-Bench / CGBench

Metric: clue-grounded benchmark accuracy. In rLiVS, the 0.5 FPS / 10K context setup is described in the experimental setup; Table 1 itself reports the final `rLiVS (Ours)` row.

| Method / Paper | Backbone or Setting | Acc. | Source |
| --- | --- | ---: | --- |
| Chat-UniVi | rLiVS comparison table baseline | 25.9 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |
| rLiVS | LLaVA-OV-7B; 0.5 FPS; 10K context | 33.1 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |
| ReKV | LLaVA-OV-7B; 0.5 FPS -> 64 frames | 33.9 (+2.8) | [ReKV Table 6](https://arxiv.org/pdf/2503.00540) |
| ReKV | LLaVA-OV-72B; 0.1 FPS -> 32 frames | 40.5 (+3.3) | [ReKV Table 6](https://arxiv.org/pdf/2503.00540) |

### MovieChat

Metric: long-video QA `Acc.` and 1-5 `Sco.`.

| Method / Paper | Backbone or Setting | Acc. | Sco. | Source |
| --- | --- | ---: | ---: | --- |
| Goldfish | rLiVS comparison table baseline | 67.6 | 4.2 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |
| rLiVS | LLaVA-OV-7B; 1 FPS; 10K context | 78.0 | 4.0 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |
| rLiVS w/o recurrency | Ablation | 74.1 | 3.9 | [rLiVS Table 4](https://arxiv.org/pdf/2510.17364) |

### VS-Ego / VS-Movie

Metric: offline VS-Stream accuracy and 1-5 score.

| Method / Paper | Backbone or Setting | VS-Ego Acc. | VS-Ego Sco. | VS-Movie Acc. | VS-Movie Sco. | Source |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Flash-VStream-7B | rLiVS comparison table baseline | 59.0 | 3.9 | 56.1 | 3.4 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |
| rLiVS | LLaVA-OV-7B; 0.5 FPS; 10K context | 61.0 | 3.9 | 59.3 | 3.6 | [rLiVS Table 1](https://arxiv.org/pdf/2510.17364) |

## Standard Video QA Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **NExT-QA / NextQA-valset** | Shorter video QA and temporal reasoning. Often useful for token-selection ablations. | **StreamChat**, **rLiVS** |
| **MSVD-QA** | Open-ended QA on short web videos. | **StreamChat** |
| **MSRVTT-QA** | Open-ended QA on short web videos, broader than MSVD. | **StreamChat** |

### NExT-QA / NextQA-valset

Metric: StreamChat reports open-ended `Sco.` and `Acc.` on NExT-QA; rLiVS reports NextQA-valset accuracy only in token-selection ablations.

| Method / Paper | Setting | Sco. | Acc. | NextQA-valset Acc. | Source |
| --- | --- | ---: | ---: | ---: | --- |
| STREAMCHAT | Offline benchmark setting | 2.84 | 50.5 | - | [StreamChat Table 6](https://arxiv.org/pdf/2501.13468) |
| rLiVS Full Model | LLaVA-OneVision-7B; token-selection ablation | - | - | 78.6 | [rLiVS Table 7](https://arxiv.org/pdf/2510.17364) |
| rLiVS Attention | 6% selected visual tokens | - | - | 77.0 | [rLiVS Table 7](https://arxiv.org/pdf/2510.17364) |
| rLiVS Attention | 12% selected visual tokens | - | - | 78.4 | [rLiVS Table 7](https://arxiv.org/pdf/2510.17364) |

### MSVD-QA

Metric: open-ended QA `Sco.` and `Acc.`.

| Method / Paper | Setting | Sco. | Acc. | Source |
| --- | --- | ---: | ---: | --- |
| STREAMCHAT | Offline benchmark setting | 3.08 | 58.7 | [StreamChat Table 6](https://arxiv.org/pdf/2501.13468) |

### MSRVTT-QA

Metric: open-ended QA `Sco.` and `Acc.`.

| Method / Paper | Setting | Sco. | Acc. | Source |
| --- | --- | ---: | ---: | --- |
| STREAMCHAT | Offline benchmark setting | 2.38 | 43.4 | [StreamChat Table 6](https://arxiv.org/pdf/2501.13468) |
