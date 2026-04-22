+++
date = '2026-04-22T16:20:54+08:00'
# draft = true
title = 'ReKV'
description = 'Streaming Video Question-Answering with In-context Video KV-Cache Retrieval", ICLR 2025.'
math = true
categories = ["AI", "VLM", "papers"]
tags = ["KV cache", "retrieval", "ReKV"]
+++

## Background
Consider the problem of **streaming video question-answering (StreamingVQA)**, it presents three challenges:
- **Efficient Video Encoding**: we need to  efficiently process incoming frames without access to future frames or frequent revisiting of distant past frames.
- **Video Context Preservation**: models must preserve relevant information from earlier frames.
- **Real-Time Response**: models must provide accurate answers with minimum delay.

## Core Idea
The attention calculation makes it possible to decouple video encoding from question answering. So we can pre-produce KV and reuse KV in QA.

## Method
### Video encoding via Sliding Window Attention
- Due to the increasing number of frames that may produce too many KV blocks( $O(n^2)$ ) using full attention, ReKV adopted a sliding window attention.
- So in this stage, the model uses sliding window attention to process the video chunk by chunk, getting the KV cache per layer.
- Out-of-window KV caches will be offloaded to RAM or disk.

### Retrieval
#### External Video KV-Cache Retrieval
- ReKV uses an external CLIP-like model to retrieve video KV cache.
- The model encodes the frames and the question to a same embedding place and calculate cosine similarity between them.
- The corresponding video KV Cache is subsequently loaded onto the GPU for question-answering.

#### Internal Video KV-Cache Retrieval
- Similar to external retrieval, internal retrieval is still performed at the level of video frames or blocks.
- Using the video QA model itself, in which the average of the key vectors of a frame is computed as its representative frame vector(ReKV doesn't differentiate between attention heads and instead concatenate them into a single vector). Similarly the question vector is computed as well.
- Same cosine similarity as External.
- Note: Internal Retrieval allows different layers to retrieve different video blocks.

### Question-Answering Using Retrieved KV
- Use the retrieved KV caches to generate answer.

### Position Encoding
**I think this is very IMPORTANT for other models**
- ReKV says the baseline of it employs **RoPE**.
- But for question answering, ReKV does not account for the original positions of the retrieved KV-Caches, as handling unseen distances among tokens presents significant challenges.
- Instead, they treat these re trieved tokens as regular consecutive tokens.

Remark: Posision Encoding is getting more and more complicated in later models (such as Qwen3-VL). I wonder **whether this still work on new models**.

## Experiments

### Benchmark and Metrics
- **$\text{MLVU}_{dev-mc}$**: multiple-choice subset of the MLVU-dev benchmark. The evaluation metric is Accuracy.
- **$\text{QAEGO4D}_{test\text{-}mc}$**: A multiple-choice benchmark for long egocentric video question answering. Evaluated by Accuracy.
- **EgoSchema**: A long-video multiple-choice benchmark that stresses long-range temporal understanding. Evaluated by Accuracy.
- **ActivityNet-QA**: An open-ended video question answering benchmark for long-term spatiotemporal reasoning. Evaluated by answer accuracy / score.
- **RVS-Ego** and **RVS-Movie**: Streaming VideoQA benchmarks with timestamped open-ended questions, used to evaluate performance in real-time video understanding.
- **CGBench$_{mc}$**: A multiple-choice benchmark for clue-grounded question answering in long videos, suitable for testing retrieval quality.

### Implemation Details
- LLAVA-OV-0.5B and LLAVA-OV-7B, NVIDIA A100 (80GB) GPU, FP16, 0.5FPS, local window=15K, external SigLIP-SO400M

### Others
- Encoding speeds are high, with LLaVA-OV-7B achieving 11 FPS
- Memory: 18.8GB/h with LLaVA-OV-7B

## Limitations
- High memory usage if the video is long($O(n)$)
- Fixed block size may break video continuity
- Fixed number of retrieved frames
- StreamVQA benchmarks are few
- Sliding window attention may affect the model's capacity