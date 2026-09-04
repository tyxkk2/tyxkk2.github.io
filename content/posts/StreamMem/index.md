+++
date = '2026-04-24T22:40:03+08:00'
lastmod = '2026-09-03T19:28:00-05:00'
title = 'StreamMem'
description = 'Query-Agnostic KV Cache Memory for Streaming Video Understanding.'
venue = 'CVPR 2026 VidLLMs Workshop'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "memory", "compression", "StreamMem", "streaming-video-lmm"]
# Set to true on posts that need LaTeX rendering.
math = true
+++

Paper: [StreamMem: Query-Agnostic KV Cache Memory for Streaming Video Understanding](https://arxiv.org/abs/2508.15717)

Project: [StreamMem](https://yangyanl.ai/streammem/)

> **Series guide.** For how proxy-guided retention fits between exact archives
> and summary-state memory, see the
> [bounded-memory survey]({{% relref path="/posts/StreamingMemory-Retention" %}}).
> The [development-history hub]({{% relref path="/posts/StreamingVideoLMM-Development" %}})
> places this method in the complete series.

## Background
**Streaming video understanding** is hard because the model has to process frames as they arrive, without knowing:
- how long the video will be;
- what future user questions will ask;
- which past details will become important later.

For long videos, the visual tokens and their **KV cache** keep growing over time. Even if a long-context MLLM can technically accept many tokens, storing and attending to all historical KV entries is still expensive.

This is the main weakness of ReKV-style systems:
- **ReKV** stores the KV cache for all seen frames and retrieves relevant KV blocks at question time;
- this is accurate, but the memory grows roughly linearly with video length;
- CPU / disk offloading can help, but query-time loading becomes expensive for very long streams.

Other compression methods often assume one of two things:
- the whole video is already available before compression;
- the user query is already known.

Both assumptions are awkward in real streaming and multi-turn settings.

So StreamMem asks a stricter question:
> Can we keep a **fixed-size KV memory** while processing a video stream, without knowing future questions?

> Remark: the method is like Infinipot-V, but StreamMem do compression for each incoming clip, Infinipot-V do compression when memory exceeds the limit.

## Core Idea
StreamMem is a **training-free, query-agnostic KV cache memory** method.

The key idea is:
- process incoming video clips online;
- reduce redundant frames before MLLM encoding;
- use the model's **chat template tokens** as a generic proxy query;
- score visual KV entries by how much these proxy tokens attend to them;
- keep the most salient KV entries under a fixed budget;
- also keep a compact frame-level prototype for each frame.

So unlike ReKV, StreamMem is not mainly a retrieval paper.
It is more like an online **bounded-memory cache compression** paper.

Compared with InfiniPot-V:
- InfiniPot-V uses hand-designed query-agnostic scores such as temporal redundancy and value norm;
- StreamMem uses the MLLM's own attention from proxy text tokens as the saliency signal.

The most interesting design choice is the proxy query:
StreamMem does not use the real question during streaming.
Instead, it appends chat-template tokens like:

```text
<|im_end|><|im_start|>assistant\n
```

The intuition is that, because many MLLMs are trained on image/video captioning or assistant-response data, these assistant-start tokens implicitly ask the model to describe the visual content. The attention from these tokens to visual tokens can therefore act like a **generic visual importance score**.

## Method

### 1. Fixed-size KV Cache Memory
At each streaming step **$t$**, the model receives a new video clip **$v_t$** and produces KV cache entries for each transformer layer:

$$
\{K_t^i, V_t^i\}_{i=1}^L.
$$

If we keep everything, memory grows forever.

StreamMem instead maintains compressed memory:

$$
\{K_t^{i\prime}, V_t^{i\prime}\}_{i=1}^L,
$$

under a total budget:

$$
\sum_{i=1}^{L} \|K_t^{i\prime}\|_0 \le M.
$$

Conceptually, each step does:

$$
K_t^{i\prime}, V_t^{i\prime}
= \text{Compress}(K_{t-1}^{i\prime}, K_t^i, V_{t-1}^{i\prime}, V_t^i).
$$

So old memory and new KV entries compete together for the same fixed budget.

This is the main difference from methods that simply keep a sliding window.
StreamMem can still preserve old but salient content instead of always evicting early frames.

### 2. Input Frame Filtering
Before sending a clip into the MLLM, StreamMem first removes obvious temporal redundancy.

For consecutive frames:
- compute visual embeddings;
- calculate cosine similarity;
- if similarity is above a threshold **$\delta$**, treat the frames as redundant;
- merge their representations by simple averaging.

This is a lightweight input-side compression step.
It avoids spending KV memory on many nearly identical frames, which is common in static scenes or high-FPS video.

In the paper's main setup, the best filtering threshold is around:

$$
\delta = 0.95.
$$

> Remark: It's a simple way.

### 3. Chat Template Tokens as Proxy Query
The central question is:
> Without knowing the user question, how do we know which visual tokens are important?

StreamMem's answer is to use **chat template tokens** as proxy query tokens.

Let:
- **$Q \in \mathbb{R}^{q \times d}$** be the query representation of the chat template tokens;
- **$K_t^i \in \mathbb{R}^{n \times d}$** be the key matrix for visual tokens in layer **$i$**;
- **$n$** be the number of visual tokens in the current clip.

Then StreamMem computes cross-attention from the proxy tokens to visual tokens:

$$
A_t^i =
\operatorname{Softmax}\left(
\frac{Q (K_t^i)^\top}{\sqrt{d}}
\right).
$$

The attention scores are aggregated over the proxy tokens to obtain one importance score per visual token.
Then StreamMem keeps the top-**$k$** visual KV entries in each layer.

The budget is distributed evenly across layers.

This is a very simple mechanism, but it is also the conceptual center of the paper:
- real query attention is strong but unavailable during streaming;
- random or FIFO retention is cheap but forgets useful old content;
- chat-template attention is query-agnostic but still model-informed.

### 4. Attention-based KV Pruning
After the proxy attention scores are computed, StreamMem prunes KV entries according to those scores.

The retained memory therefore contains visual tokens that the model itself considers useful for producing a generic assistant response.

This is different from StreamKV:
- StreamKV uses a guidance prompt for segment compression and the user question for later retrieval;
- StreamMem uses chat template tokens during streaming and does not need a retrieval step over a large KV bank.

It is also different from ReKV:
- ReKV keeps historical KV and retrieves at question time;
- StreamMem compresses continuously and tries to keep memory bounded at all times.

### 5. Frame-wise KV Merging
Pruning can keep fine-grained tokens, but it may lose global frame-level information.

So StreamMem adds a second memory component: **frame-wise KV prototypes**.

For each frame, it computes a weighted average of keys and values using the normalized attention scores:

$$
\bar{K}_t^i =
\sum_{j=1}^{n}
\alpha_j^i K_{t,j}^i,
\qquad
\bar{V}_t^i =
\sum_{j=1}^{n}
\alpha_j^i V_{t,j}^i.
$$

Here **$\alpha_j^i$** is the normalized importance score for visual token **$j$** in layer **$i$**.

The final memory is therefore a mixture of:
- selected salient visual KV entries;
- compact frame-level prototype KVs.

This is a good design trade-off:
- selected tokens preserve local details;
- prototypes preserve coarse frame-level temporal information.

> Remark: this is also a common approach that use an "average" "representitive" token

### 6. Positional Embedding with YaRN
Long video processing creates another issue: position IDs.

Many previous streaming KV methods reassign positions to the retained tokens after compression.
That is convenient, but it can discard the original spatial-temporal structure.

StreamMem instead uses **YaRN** context window extension to preserve more consistent positions across streaming segments.

The paper reports different YaRN scaling factors for different models:
- **LLaVA-OneVision**: $\lambda=8$
- **Qwen2-VL**: $\lambda=2$
- **Qwen2.5-VL**: $\lambda=1$, meaning no extra scaling

The ablation shows that YaRN matters a lot:
- no scaling: **61.5** on MLVU
- $\lambda=4$: **66.8**
- $\lambda=8$: **66.9**

So position handling is not a small implementation detail.
It can dominate the final performance.

### 7. Question Answering
When a question arrives, the model answers using the current compressed KV memory.

There is no need to retrieve from a huge historical KV bank, because the memory has already been compressed online.

This gives StreamMem a practical advantage:
- memory stays bounded during the stream;
- answering does not require loading old KV blocks from CPU or disk;
- the system can run under a fixed GPU memory budget.

The trade-off is also clear:
- if the compression step discarded a detail, question answering cannot recover it later;
- query-aware methods still have an advantage when the question is known early enough.

## Experiments

### Benchmarks
The paper evaluates StreamMem on three offline long-video benchmarks:
- **MLVU**
- **EgoSchema**
- **VideoMME**

and two streaming video QA benchmarks:
- **RVS-Ego**
- **RVS-Movie**

### Models and Setup
The method is tested on:
- **LLaVA-OneVision-7B**
- **Qwen2-VL-7B**
- **Qwen2.5-VL-3B**

Important implementation details:
- each incoming video chunk contains **8 frames**;
- default sampling is **0.5 FPS**, following ReKV;
- Qwen2-VL / Qwen2.5-VL use up to **130 visual tokens per frame**;
- LLaVA-OneVision uses **196 visual tokens per frame**;
- the input filtering threshold is **$\delta=0.95$**;
- experiments can run on one **A100** GPU;
- for constrained streaming evaluation, GPU memory is kept below **28 GB**.

### Offline Long-video Results
On offline long-video benchmarks, StreamMem is strongest as a compact KV-memory method.

For **LLaVA-OneVision-7B**:
- base model with 32 frames: **64.7** on MLVU, **60.1** on EgoSchema, **56.9** on VideoMME-All;
- LiveVLM: **66.3 / 63.0 / 57.3**;
- StreamMem: **66.9 / 63.0 / 59.4**.

For **Qwen2-VL-7B**:
- full / large KV baseline: **65.8** on MLVU, **65.2** on EgoSchema, **63.9** on VideoMME-All;
- InfiniPot-V with 6K KV: **65.8 / 65.6 / 62.8**;
- StreamMem with 6K KV: **65.9 / 67.2 / 62.1**.

The VideoMME-All result is slightly below InfiniPot-V here, but StreamMem is better on MLVU and EgoSchema.

The KV-budget experiment is also interesting.
With **Qwen2-VL-7B** on MLVU:
- Full KV with 50K: **65.9**
- StreamMem with 6K: **65.9**
- StreamMem with 12K: **66.0**
- StreamMem with 24K: **66.3**

So with less than half the full KV size, StreamMem can slightly exceed the full-KV setting on this benchmark.

### Streaming QA Results
On RVS-Ego and RVS-Movie, the picture is more nuanced.

With **LLaVA-OneVision-7B**:
- ReKV with offloading: **63.7 / 4.0** on RVS-Ego and **54.4 / 3.6** on RVS-Movie;
- ReKV without offloading: **55.8 / 3.3** and **50.8 / 3.4**;
- InfiniPot-V: **57.9 / 3.5** and **51.4 / 3.5**;
- StreamMem: **57.6 / 3.8** and **52.7 / 3.4**.

So StreamMem does not beat full ReKV with CPU offloading.
But that is expected: ReKV stores much more historical KV.

The fairer comparison is under constrained memory.
There StreamMem clearly improves over ReKV without offloading and is competitive with InfiniPot-V / Flash-VStream.

## Ablations

### Proxy Query Type
The paper compares three query choices for attention-based KV compression:
- true user query;
- generic text query: "What is happening in the video?";
- chat template query.

On MLVU:
- true query: **68.1**
- generic text query: **66.7**
- chat template query: **66.9**

This supports two points:
- chat template tokens really do behave like a generic visual query;
- query-aware compression is still stronger, especially for detail-heavy questions.

That second point is important.
Query-agnostic memory is practical, but it cannot magically know every future detail that might be queried.

### KV Merging Strategy
The frame-wise prototype also matters:
- no merging: **65.6**
- average merging: **66.3**
- weighted merging: **66.9**

So the best version uses attention-weighted merging, not plain averaging.

Interpretation:
- pruning keeps local high-saliency tokens;
- weighted merging keeps a compact global frame summary;
- combining both is better than either alone.

### Input Frame Filtering
Frame filtering improves performance:
- no filtering: **65.4**
- $\delta=0.90$: **66.1**
- $\delta=0.95$: **66.9**
- $\delta=0.97$: **66.6**

The best threshold is **0.95** in the paper's setup.

Too little filtering keeps redundant frames.
Too much filtering may merge frames that still contain useful motion or event changes.

### YaRN Scaling
YaRN scaling is one of the more important ablations:
- no scaling: **61.5**
- $\lambda=2$: **65.4**
- $\lambda=4$: **66.8**
- $\lambda=8$: **66.9**

This confirms that long-video KV memory is not only about what to keep.
It is also about how the retained tokens are positioned when the model attends to them.

## My Takeaways
The most interesting part of StreamMem is the **chat template proxy query**.

It is a clever compromise:
- no future question is needed;
- no external retriever is needed;
- no training is needed;
- the MLLM itself provides the saliency signal.

Compared with ReKV, StreamMem is much more practical under a strict memory budget.
It does not try to preserve everything and retrieve later.
It continuously decides what is worth keeping.

Compared with StreamKV, StreamMem feels less retrieval-centered.
StreamKV still has a KV Bank and query-time retrieval.
StreamMem instead tries to maintain a compact memory that is always ready for QA.

Compared with InfiniPot-V, StreamMem uses a more model-internal criterion.
InfiniPot-V asks whether tokens are temporally redundant or semantically important by heuristic scores.
StreamMem asks whether the model's own assistant-start tokens attend to them.

I think this is the main conceptual contribution:
> use the model's generic response behavior as a query-agnostic saliency estimator.

## Limitations / Open Questions
- StreamMem is still query-agnostic, so it may discard details that become important for a very specific later question.
> Remark: This should be a trade-off(query-agnostic vs. keep all the details)

- True-query compression performs better in the ablation, especially on multi-detail tasks, so there is still a gap between practical streaming and ideal query-aware selection.
- The method depends on the assumption that chat template attention highlights generally useful visual content. This may vary across MLLMs and chat templates.
- The memory budget is evenly distributed across layers; unlike StreamKV, it does not use layer-adaptive budget allocation.
- The streaming QA results are competitive under constrained memory, but ReKV with full offloading is still stronger in raw accuracy.
- Position handling is delicate. YaRN helps, but newer VLMs with more complicated positional or multimodal tokenization schemes may need different treatment.

> Remark: StreamMem is closer to online KV cache eviction than query-time retrieval.

> Remark: The proxy-query trick is simple, but surprisingly natural for chat-style MLLMs.
