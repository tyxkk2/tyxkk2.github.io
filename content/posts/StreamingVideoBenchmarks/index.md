+++
date = '2026-05-02T17:28:21+08:00'
title = 'Benchmarks for Streaming Video Understanding'
description = 'A short index of benchmarks used by recent streaming and long-video VLM papers.'
categories = ["AI", "VLM", "summary"]
tags = ["benchmark", "survey", "Video-LLM", "streaming", "long video", "StreamingBench", "MLVU", "Video-MME"]
math = false
decor_image = "images/bg2.png"
+++

This post is a small index for the benchmarks that appear repeatedly in recent streaming video / long-video VLM papers.

The main split is simple:
- **online streaming benchmarks** test whether the model can answer while the video is still coming in;
- **offline long-video benchmarks** test long-context video understanding, but usually assume the whole video is already available;
- **standard video QA benchmarks** are useful for comparability, but they are not the real target of streaming-memory papers.

## Online / Streaming Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **RVS-Ego** | Streaming QA on egocentric videos with timestamped questions. Good for testing whether old visual evidence remains accessible. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **rLiVS** |
| **RVS-Movie** | Streaming QA on movie-style videos. More narrative and event-heavy than RVS-Ego. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **rLiVS** |
| **StreamingBench** | Broader streaming benchmark with real-time visual understanding, omni-source understanding, and contextual understanding subtasks. | **StreamKV**, **LiveVLM**, **InfiniPot-V** |
| **StreamBench** | Online multi-turn video QA with memory-heavy question types such as object search, long-term memory search, short-term memory search, and conversational interaction. | **StreamChat**; baselines include **Video-online** and **Flash-VStream** |

## Offline Long-video Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **MLVU** | Long-video multiple-choice understanding. Often used as a compact proxy for long-context video reasoning. | **ReKV**, **StreamMem**, **LiveVLM**, **StreamingTOM**, **InfiniPot-V** |
| **VideoMME** | General long-video multimodal understanding. Papers often report the no-subtitle setting. | **StreamMem**, **LiveVLM**, **StreamingTOM**, **InfiniPot-V** |
| **EgoSchema** | Long-range egocentric video reasoning. Useful for memory and temporal reasoning evaluation. | **ReKV**, **StreamMem**, **StreamingTOM**, **InfiniPot-V** |
| **LongVideoBench** | Long-video QA with stronger pressure on long-context reasoning. | **LiveVLM**, **StreamingTOM**, **InfiniPot-V** |
| **ActivityNet-QA** | Open-ended video QA with longer activity videos. | **ReKV**, **StreamChat** |
| **QAEGO4D** | Egocentric long-video QA. | **ReKV** |
| **CG-Bench / CGBench** | Clue-grounded long-video QA, useful for retrieval-heavy methods. | **ReKV**, **rLiVS** |
| **MovieChat** | Long movie/video understanding. | **rLiVS** |
| **VS-Ego / VS-Movie** | Offline long-video evaluation around egocentric and movie scenarios. | **rLiVS** |

## Standard Video QA Benchmarks

| Benchmark | What It Mainly Tests | Papers Using It |
| --- | --- | --- |
| **NExT-QA / NextQA-valset** | Shorter video QA and temporal reasoning. Often useful for token-selection ablations. | **StreamChat**, **rLiVS** |
| **MSVD-QA** | Open-ended QA on short web videos. | **StreamChat** |
| **MSRVTT-QA** | Open-ended QA on short web videos, broader than MSVD. | **StreamChat** |
