+++
date = '2026-06-18T21:14:54+08:00'
lastmod = '2026-06-19T19:17:06+08:00'
title = 'SimpleStream'
description = 'A recent-frame baseline for streaming video understanding.'
categories = ["AI", "VLM", "paper"]
tags = ["Video-LLM", "streaming", "long video", "benchmark", "SimpleStream"]
+++

Paper: [A Simple Baseline for Streaming Video Understanding](https://arxiv.org/abs/2604.02317)

Project: [SimpleStream](https://simple-stream.github.io/)

Code: [EvolvingLMMs-Lab/SimpleStream](https://github.com/EvolvingLMMs-Lab/SimpleStream)

## Core Idea
SimpleStream is a deliberately simple streaming baseline:
when a question arrives, keep only the most recent **N** observed frames and feed them with the question to an off-the-shelf VLM.

It uses:
- 1 fps sampling under the observed-only streaming protocol;
- a short recent-frame window, usually 2 / 4 / 8 frames;
- Qwen2.5-VL-7B or Qwen3-VL-8B as the base VLM;
- no new memory bank;
- no retrieval module;
- no KV cache compression;
- no extra training.

So this is not a new architecture.
It is a strong recency baseline for asking whether complex streaming memory is actually helping.

## Benchmark
The paper evaluates on **OVO-Bench** and **StreamingBench** under a causal protocol: the model can only use frames observed before the query time.
Numbers below follow Table 1 in the arXiv version.

| Method | Frames | StreamingBench RTVU | OVO Real-Time | OVO Backward | OVO Avg. |
|---|---:|---:|---:|---:|---:|
| StreamForest-7B | 1 fps | 77.26 | 61.2 | 52.0 | 56.60 |
| HERMES-7B | 1 fps | 79.44 | 69.0 | 49.4 | 59.20 |
| Qwen2.5-VL-7B + SimpleStream | 4 | 78.47 | 78.4 | 51.9 | 65.13 |
| Qwen2.5-VL-7B + SimpleStream | 8 | 79.11 | 76.6 | 50.8 | 63.70 |
| Qwen3-VL-8B + SimpleStream | 2 | 78.31 | 79.3 | 53.5 | 66.38 |
| Qwen3-VL-8B + SimpleStream | 4 | **80.59** | **81.4** | 54.0 | **67.70** |
| Qwen3-VL-8B + SimpleStream | 8 | 78.83 | 79.9 | **54.9** | 67.37 |

The key result is simple:
**Qwen3-VL-8B + 4 recent frames** reaches **67.70 OVO Avg.** and **80.59 StreamingBench RTVU**, beating the compared streaming baselines in the paper.

## Takeaways
The main message is not that four frames solve long-video understanding.
It is that current streaming benchmarks can reward clean recent-scene perception very strongly.

Two observations matter:
- longer context is not monotonic: 8 frames is not always better than 4 frames;
- extra historical retrieval can improve some memory tracks, but it may hurt real-time perception.

So future streaming VLM papers should compare against a strong recent-window baseline under the same backbone and protocol.
Otherwise, it is hard to tell whether a memory module improves long-range reasoning or just loses less than a weak baseline.
