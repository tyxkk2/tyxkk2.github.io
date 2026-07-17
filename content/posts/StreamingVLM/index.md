+++
date = '2026-07-17T18:21:39+08:00'
title = 'StreamingVLM'
description = 'Training-inference aligned real-time understanding for effectively infinite video streams.'
venue = 'ICLR 2026'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "long video", "KV cache", "caption", "StreamingVLM"]
+++

Paper: [StreamingVLM: Real-Time Understanding for Infinite Video Streams](https://arxiv.org/abs/2510.09608)

Project: [StreamingVLM](https://streamingvlm.hanlab.ai/)

Code: [mit-han-lab/streaming-vlm](https://github.com/mit-han-lab/streaming-vlm)

Datasets: [Inf-Stream-Train](https://huggingface.co/datasets/mit-han-lab/Inf-Stream-Train) / [Inf-Stream-Eval](https://huggingface.co/datasets/mit-han-lab/Inf-Stream-Eval)

## Core Idea

StreamingVLM is designed for a different target from most streaming VideoQA papers:
it keeps watching a video and producing synchronized commentary, instead of waiting for a future question and then retrieving historical evidence.

Its main idea is to align a simple streaming inference cache with the context pattern used during supervised fine-tuning.

At inference time, the model keeps only:

- early text tokens that act as attention sinks;
- a longer window of recent generated text;
- a short window of recent visual tokens.

At training time, it learns this recency-biased behavior from short overlapping chunks with interleaved vision and narration tokens.

So the paper is best understood as:

> streaming-aware SFT + asymmetric vision/text KV retention + contiguous positions

It is not a new VLM architecture, and it is not a long-term caption retrieval system.
The main contribution is the training-inference co-design that makes a standard VLM run continuously with bounded context and stable latency.

## Why Ordinary Streaming Baselines Fail

The paper starts from three common ways to process a long stream.

**Full attention** preserves all history, but KV memory grows with video length and total attention cost becomes prohibitive. Eventually, position indices also move beyond the range seen during training.

**Non-overlapping chunks** keep memory bounded, but each chunk partially resets the context. Short chunks lose continuity, while long chunks again become slow and exceed the training context.

**Overlapping sliding windows** preserve recent context, but overlapping video and text are repeatedly prefixed into the model. This recovers coherence at the cost of redundant computation.

StreamingVLM keeps the useful part of an overlapping window but reuses its KV states instead of recomputing them.

## Method

### 1. Streaming-aware KV Cache

The default inference cache has three parts:

```text
512 attention-sink text tokens
    + 512 recent text tokens
    + recent vision tokens covering 16 seconds
    + newly arrived video tokens
```

The sink contains early text context, including the system prompt and previous text. The recent-text window carries the latest generated commentary, while the vision window preserves fine-grained information about the action currently unfolding.

As the stream continues:

- new visual tokens enter the cache;
- the model generates the next commentary text;
- generated text becomes part of the following context;
- old visual tokens are evicted first;
- text outside the retained sink and recent window is also eventually lost.

This is an intentionally asymmetric policy.
Video is dense and temporally redundant, while narration is a compact semantic description of what the model has already observed.

The resulting loop is:

```text
recent vision + retained text
        -> generate current commentary
        -> append commentary to recent text
        -> evict old vision/text
        -> process the next second
```

The generated commentary therefore acts as a rolling textual state.
However, it should not be confused with a complete long-term memory: the model does not preserve all old captions, and it cannot retrieve an evicted frame later.

### 2. Contiguous 3D RoPE

A fixed-size KV cache alone does not make inference stable.
If native position IDs keep following wall-clock stream length, a two-hour video can still produce indices far beyond the positions seen during training.

StreamingVLM shifts the position indices after eviction so that retained and incoming tokens remain contiguous. Once the cache reaches its fixed capacity, the effective position range stops growing.

For Qwen2.5-VL, the paper extends this operation to the model's 3D visual RoPE:

- temporal position;
- spatial height position;
- spatial width position.

This is one of the most important implementation details. On Inf-Streams-Eval, native RoPE in infinite mode has a 25.09% win rate against the chunked GPT-4o mini baseline, while contiguous RoPE reaches 66.18%.

### 3. Overlapped-chunk Full-attention SFT

Training directly on hours of streaming video would be expensive and would still require reproducing a complicated cache-eviction schedule during backpropagation.

The paper instead splits each video into 24-second training chunks with 12-second overlap:

```text
sample 1: 00s ---------------- 24s
sample 2:          12s ---------------- 36s
sample 3:                    24s ---------------- 48s
```

Each chunk uses ordinary full attention. The overlap exposes the model to continued actions and repeated recent context across adjacent training samples, approximating the recency pattern used by the streaming KV cache.

Previous commentary is also cropped into an early part and a recent part, matching the attention-sink plus recent-text layout at inference.

This is only an approximation: training still uses full attention inside each short sample, while inference uses modality-specific windows and eviction. The important point is that it gives the model a much closer context distribution than conventional independent chunks.

### 4. Per-second Vision-Text Interleaving

Conventional Video-LLMs often place all visual tokens before the response text. That format does not match continuous commentary.

StreamingVLM interleaves vision and narration at one-second intervals. The loss is applied only to the aligned narration text. If a second contains no commentary, the target contains `...` as a placeholder.

This teaches two behaviors at the same time:

- what to say about the current visual event;
- when to remain silent rather than generating unnecessary text.

This synchronization objective is an important difference between real-time commentary and ordinary video captioning.

## Data Pipeline

The authors collect 2,449 English-language games from five sports: basketball, soccer, American football, ice hockey, and baseball.

The raw collection contains more than 6,000 hours. WhisperX produces timestamped commentary transcripts, and GPT-5 is used to keep, edit, or delete sentences. This removes advertisements and host monologues and corrects some ASR errors in player and team names.

Training has two stages:

1. **Streaming SFT** uses 525K Inf-Streams samples together with 526K Live-WhisperX samples to teach the interleaved streaming format.
2. **High-quality annealing** uses about 14K selected clips, each 16–64 seconds long, to focus the output more strongly on real-time on-field actions.

The reported total training cost is about 128 H100-days. This is worth keeping in mind: the inference policy is simple, but obtaining a model that reliably follows it is not training-free.

## Evaluation

### Inf-Streams-Eval

Inf-Streams-Eval contains 20 complete sports games with an average length of 2.12 hours. It evaluates dense, time-aligned commentary rather than a small number of questions over a long video.

The benchmark uses GPT-5 to compare two model outputs with access to reference commentary. StreamingVLM obtains a **66.18% pairwise win rate against GPT-4o mini**.

This number is not a 66.18% factual accuracy score. It means that GPT-5 prefers StreamingVLM's commentary in 66.18% of the pairwise comparisons. GPT-4o mini is also evaluated in 100-second chunk mode, while StreamingVLM runs continuously, so the result mainly supports the paper's commentary system rather than a general claim that the 7B model is stronger than GPT-4o mini at video understanding.

The paper reports stable latency at up to **8 FPS on one NVIDIA H100**. Full attention eventually runs out of memory, while overlapping-window inference remains slower because it repeatedly rebuilds shared context.

### General VQA

Without VQA-specific fine-tuning, StreamingVLM is compared with its Qwen2.5-VL-7B-Instruct base model:

| Benchmark | Qwen2.5-VL-7B | StreamingVLM | Change |
|---|---:|---:|---:|
| MVBench | 67.34 | 69.16 | +1.82 |
| Video-MME w/o subtitles | 65.10 | 65.10 | 0.00 |
| LongVideoBench | 54.70 | 59.00 | +4.30 |
| OVOBench Realtime | 56.00 | 61.96 | +5.96 |

The gains are concentrated on long-horizon and real-time tasks. Video-MME does not improve, so the result is better evidence for streaming-oriented transfer than for a uniform increase in general video ability.

### What the Ablations Show

The most useful ablations are:

- **Contiguous RoPE is necessary.** Native positions degrade sharply in infinite mode.
- **Recent vision still matters.** Removing the vision window reduces the win rate against GPT-4o mini from 66.18 to 52.90.
- **Overlapped training helps beyond the data itself.** The non-overlapping strategy gets 62.51 against GPT-4o mini, compared with 66.18 for the overlapped strategy.
- **Training-inference format matters.** Applying ReKV's eviction policy to the fine-tuned StreamingVLM disrupts the context layout and often causes no output.

The last point is probably the central empirical message of the paper: a streaming cache policy cannot always be added after training without changing model behavior.

## Relation to Other Streaming Methods

StreamingVLM occupies a simpler point in the streaming-memory design space.

**ReKV / StreamKV** retain historical visual KV and retrieve relevant blocks after a question arrives. StreamingVLM has no historical visual bank and no query-time retrieval. Old visual evidence is simply evicted.

**InfiniPot-V / StreamMem** maintain a bounded visual KV memory but try to preserve salient old visual tokens through query-agnostic compression. StreamingVLM instead uses a fixed recent visual window and relies more heavily on generated text for continuity.

**SimpleStream** also emphasizes recent frames, but it is a training-free query-time baseline. StreamingVLM adds reusable KV state, recent generated text, synchronized narration, and streaming-specific SFT.

**rLiVS** is the closest conceptual comparison because it also separates short-term visual memory from textual memory. The difference is important:

- rLiVS stores clip captions as a searchable long-term database and retrieves them for VideoQA;
- StreamingVLM only keeps bounded early/recent text in the active context and does not retrieve old captions.

So StreamingVLM is not caption RAG. It is closer to a recurrent commentator whose own recent output becomes part of its next hidden context.

## My Takeaways

The cleanest description of StreamingVLM is:

> bounded recent vision + rolling text state + training-inference alignment

Most individual inference ingredients are familiar: attention sinks, sliding windows, KV reuse, and bounded positions. The interesting part is showing that these ingredients work much better when the model is explicitly trained for the same interleaved and partially retained context structure.

The paper also changes the target compared with most streaming VideoQA work. Instead of asking how to preserve arbitrary historical evidence for a future question, it asks how to keep perceiving and speaking without interruption.

That makes the system practical for continuous commentary, but it also makes the word **infinite** easy to over-interpret:

> infinite means that runtime memory and per-step latency do not grow with total video length; it does not mean infinite recall of the video history.

## Limitations / Open Questions

- **Old visual evidence is unrecoverable.** Once a frame leaves the 16-second vision window, the model cannot inspect it again.
- **Text memory is also bounded.** The sink and recent-text windows do not form a complete caption archive.
- **Errors can become state.** An incorrect generated commentary may influence later narration because the model reuses its own output as context.
- **The domain is narrow.** The large-scale training data and the main infinite-stream evaluation are dominated by sports commentary.
- **The benchmark uses an LLM judge.** Pairwise commentary preference is useful but subjective and may reflect judge-specific style preferences.
- **The strongest baseline comparison uses different modes.** GPT-4o mini is evaluated in chunks, while StreamingVLM runs in infinite mode.
- **The maximum 8 FPS result is hardware-dependent.** It is reported on a single H100 and should not be treated as a general deployment speed.
- **Training and inference attention are only approximately aligned.** Short-chunk full attention does not exactly reproduce the asymmetric streaming cache.
- **This is not a solution to long-range visual QA.** A future system may still need caption retrieval or historical visual KV retrieval when old fine-grained evidence must remain accessible.
