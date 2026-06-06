+++
date = '2026-06-05T22:50:59+08:00'
title = 'MuKV'
description = 'Multi-grained KV-cache compression for long streaming VideoQA.'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "long video", "retrieval", "compression", "KV cache", "MuKV"]
decor_image = "images/bg2.png"
+++

Paper: [MuKV: Multi-Grained KV Cache Compression for Long Streaming Video Question-Answering](https://arxiv.org/abs/2605.22269)

Code: [IMBALDY/MuKV](https://github.com/IMBALDY/MuKV)

## Background
Long streaming VideoQA has a simple but painful constraint:
the video keeps arriving, while the future user questions are unknown.

KV-cache methods such as ReKV make this setting more practical.
Instead of recomputing historical video tokens when a question arrives, the model can prefill the video stream in advance, store the visual KV cache, retrieve the relevant cache blocks later, and answer with much lower online cost.

But storing one KV block per frame is still a rough representation:
- it keeps a lot of redundant visual tokens;
- it mostly treats every frame as the same kind of memory unit;
- it can miss region-level visual details inside a frame;
- it can miss segment-level temporal context across frames.

MuKV asks a direct question:
> If the video contains information at different scales, why should the KV memory only have one scale?

## Core Idea
MuKV stores historical video KV cache at **three granularities**:
- **segment-level KV** for event and narrative context;
- **frame-level KV** for the representative visual state;
- **patch-level KV** for local region details.

Then it controls memory growth with a **dual-signal KV-cache compression** module.
The compression score combines:
- self-attention importance, which is already available during LLM prefill;
- frequency-domain signal from key vectors, which helps identify visual variation and correct the positional bias of attention scores.

At question time, MuKV retrieves from all three granularities.
It first performs parallel retrieval with the question as query, then applies a segment-guided reranking step so lower-level frame and patch matches remain consistent with the broader segment context.

So the main contribution is not only "compress KV cache".
It is:
> represent the past video at multiple semantic scales, compress each scale, and retrieve with enough hierarchy to reduce noise without fully trusting a coarse top-level decision.

## Key Observations

### 1. Segment memory is surprisingly important
The ablation shows that segment-level KV alone is stronger than patch-only or frame-only memory on the paper's long streaming benchmarks.

This makes sense.
Many streaming questions are not just asking "what object is visible now?".
They ask about actions, causes, summaries, and what happened earlier.
Those signals are naturally segment-level.

But segment memory alone is not enough.
The best result comes from using all three granularities together:
segment for context, frame for visual state, and patch for local details.

### 2. Attention is useful, but biased
Self-attention is a convenient pruning signal because it comes almost for free from the prefill pass.
However, the paper observes that attention scores often favor earlier tokens and can be less sample-specific than desired.

MuKV adds a frequency signal from the key vectors.
The intuition is video-specific:
- static or redundant regions tend to have lower-frequency patterns;
- foreground details and rapid motion often create stronger high-frequency components.

In the ablation, keeping high-frequency tokens works better than keeping low-frequency tokens.
The useful part is not FFT itself, but the fact that it gives compression a task-agnostic visual-variation signal.

### 3. Pure parallel retrieval is noisy, pure hierarchy is brittle
Parallel retrieval across all granularities is flexible, but it may overreact to local visual matches.
A patch can be similar to the question while still belonging to an irrelevant moment.

Naive hierarchical retrieval has the opposite problem.
If the top segment retrieval is wrong, lower-level retrieval is trapped inside the wrong region of memory.

MuKV uses a middle path:
- retrieve candidates from patch, frame, and segment memory in parallel;
- use top segment candidates to build a global segment query;
- rerank frame and patch candidates by combining their original question score with segment-level consistency.

This is why the paper calls the retrieval **semi-hierarchical**.

## Method

### 1. Multi-grained KV cache construction
For each streaming segment, MuKV derives three views:
- the whole segment;
- the middle frame of the segment;
- super-patches from the middle frame.

With LLaVA-OneVision-style visual tokens, these views can be formed by grouping existing visual tokens at different scales.
The paper does not require multiple visual encoder passes for the three granularities.

Each granularity is prefetched by the LLM and stored as KV cache.
The three prefill passes are independent and can run in parallel in practice.

The result is a KV memory bank with three types of blocks:
- segment blocks;
- frame blocks;
- patch blocks.

### 2. Dual-signal compression
Multi-grained memory would be too expensive if every token were kept.
MuKV therefore compresses the KV cache independently at each granularity.

For every token, it computes:
- an attention score from the last LLM layer;
- a frequency score by applying FFT to key vectors and averaging frequency magnitudes.

The two scores are normalized and mixed with a granularity-specific weight.
Tokens are sorted by the fused score, and only the top tokens are retained according to each granularity's retention ratio.

The paper's default setting keeps much more segment-level memory than lower-level memory.
That design choice matches the ablation: segment-level context carries much of the long-video reasoning signal, while patch and frame tokens are useful but more redundant.

### 3. Semi-hierarchical retrieval
When a question arrives, MuKV retrieves only from KV blocks before the question timestamp.

The first stage is parallel retrieval:
- mean-pool the question query representation;
- mean-pool each candidate KV block's last-layer key representation;
- compute cosine similarity;
- retrieve candidates from patch, frame, and segment memory.

The second stage is reranking:
- average the top segment-level candidates into a global segment query;
- compute how consistent each lower-granularity candidate is with this global query;
- combine this consistency score with the original question similarity;
- keep the final top candidates for each granularity.

Finally, the retrieved KV cache is loaded into the LLM as context for answer generation.
The important efficiency point is that the model does not need to recompute historical visual KV online.

## Evaluation
The paper evaluates MuKV on RVS-Ego, RVS-Movie, and the real-time visual understanding subset of StreamingBench.
The main backbone is LLaVA-OneVision, with both 0.5B and 7B variants.

The most useful comparison is against ReKV, because both methods use video KV-cache retrieval.

For the 7B backbone at 0.5 FPS:
- ReKV uses 12.5K inference visual tokens and 59K memory tokens per 300 frames.
- MuKV uses 8.3K inference visual tokens and the same 59K memory tokens.
- On RVS-Ego, MuKV improves from 56.2 to 59.5.
- On RVS-Movie, it improves slightly from 48.2 to 48.5.
- On StreamingBench real-time understanding, it improves from 62.3 to 64.4 overall.

For the 0.5B backbone:
- RVS-Ego improves from 51.5 to 57.9;
- RVS-Movie improves from 42.3 to 45.2;
- StreamingBench overall improves from 52.7 to 56.8.

The compression ablation is also important.
With MuKV, applying DCP at the 67% drop ratio reduces memory from 177K to 59K tokens and improves accuracy compared with the uncompressed multi-grained version.
For ReKV, DCP at 50% drop ratio cuts memory from 59K to 29K tokens and improves RVS-Ego from 51.5 to 56.1.

So compression is not only saving memory.
In this setting, removing redundant KV tokens can also improve retrieval quality and answer accuracy.

One caveat: the gains are not uniform across all question types.
On StreamingBench, MuKV improves many reasoning and summarization categories, but underperforms ReKV on counting.
That is a useful warning: aggressive KV pruning can preserve event semantics while hurting fine-grained counting evidence.

## My Takeaways
MuKV is a clean continuation of the ReKV-style pipeline.
ReKV makes KV-cache retrieval practical for streaming VideoQA.
MuKV makes the memory itself more structured.

The most reusable idea is the separation between **memory granularity** and **retrieval granularity**.
The system stores multiple views of the same history, then lets the question decide which view matters.

The frequency signal is also interesting.
It is cheap, model-internal, and video-aware.
Compared with pairwise token similarity, it avoids extra heavy comparison while still giving the compressor a signal beyond raw attention.

I also like the semi-hierarchical retrieval design.
It keeps the recall advantage of parallel retrieval while using segment-level context to suppress noisy local matches.
This feels more robust than forcing the whole retrieval path through a single top-level segment decision.

## Limitations / Open Questions
- MuKV performs three LLM prefills per segment, one for each granularity. The paper says they can run in parallel, but real deployment still depends on batching, GPU memory, and serving constraints.
- Patch-level and frame-level views are based on the middle frame of each segment. This is efficient, but local details in non-middle frames may still be compressed into the segment-level representation.
- The retention ratios, reranking weights, retrieval budget, and sampling FPS are important hyperparameters. The default values may need retuning for different video domains or backbones.
- Counting remains a weak point in the reported StreamingBench results, suggesting that semantic compression and exact visual accounting are still in tension.
- Open-ended RVS evaluation uses an LLM judge. The paper notes that the original GPT-3.5-turbo-0613 judge was deprecated, so judge changes can affect exact numbers.
