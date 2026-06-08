+++
date = '2026-04-27T01:22:21+08:00'
lastmod = '2026-06-08T15:26:57+08:00'
title = 'StreamingTOM'
description = 'Streaming Token Compression for Efficient Video Understanding.'
venue = 'CVPR 2026'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "token compression", "quantization", "StreamingTOM"]
math = true
+++

Paper: [StreamingTOM: Streaming Token Compression for Efficient Video Understanding](https://arxiv.org/abs/2510.18269)

Code: [YIGE24/StreamingTOM](https://github.com/YIGE24/StreamingTOM)

## Background
**Streaming video understanding** has two constraints that offline video understanding does not really need to respect:
- **causality**: the model cannot use future frames to decide how to compress current frames;
- **accumulation**: tokens and KV cache keep growing as the video stream becomes longer.

Most recent training-free streaming methods mainly work on the **post-LLM KV cache**:
- **ReKV** stores historical KV blocks and retrieves relevant ones at question time;
- **StreamKV** improves the segmentation / compression / retrieval pipeline;
- **InfiniPot-V** and **StreamMem** keep a bounded KV memory with query-agnostic compression;
- **LiveVLM** combines query-agnostic KV compression with query-time retrieval.

These methods are useful, but they still have one important blind spot:
> the visual tokens have already gone through the LLM before the KV cache is compressed.

So even if post-LLM KV cache is compressed, the expensive **prefill** over all visual tokens has already happened.

StreamingTOM targets this missing part:
> If we want real streaming efficiency, token compression should happen before visual tokens enter the LLM.

In the paper's terminology:
- **pre-LLM** means after the vision encoder / projector but before the LLM transformer layers;
- **post-LLM** means after the LLM has already produced KV cache.

This distinction is very important.
Pre-LLM compression reduces computation and KV writes.
Post-LLM compression mainly reduces memory after the cost has already been paid.

## Core Idea
StreamingTOM is a **training-free, plug-and-play two-stage framework**.

The two stages are:
- **Causal Temporal Reduction (CTR)**: reduce each frame from **$N$** visual tokens to exactly **$G$** tokens before the LLM;
- **Online Quantized Memory (OQM)**: store the resulting KV groups in **4-bit** format, retrieve relevant groups when a question arrives, then dequantize only those groups.

The paper writes the system as:

$$
\operatorname{StreamingTOM}
= \mathrm{OQM}_{16\to4} \circ \mathrm{CTR}_{N\to G}.
$$

For LLaVA-OneVision, each frame has **196** visual tokens.
The default StreamingTOM setting keeps **50** tokens per frame and stores them in **4-bit** precision.

Let **$S_{\mathrm{full}}$** be the FP16 full-token storage and **$S_{\mathrm{TOM}}$** be the 4-bit retained-token storage.
The approximate storage compression ratio is:

$$
\begin{aligned}
\frac{S_{\mathrm{full}}}{S_{\mathrm{TOM}}}
&\approx \frac{N \cdot 16}{G \cdot 4} \\
&= \frac{4N}{G}.
\end{aligned}
$$

With **$N=196$** and **$G=50$**, this gives about:

$$
\frac{4 \times 196}{50} \approx 15.7\times.
$$

The key design is the **group abstraction**:
- CTR always outputs one fixed-size group of **$G$** tokens per frame;
- OQM stores and retrieves memory at the same group granularity;
- each retrieved group still corresponds to a real frame, so temporal order is not completely fragmented.

I think this group design is the cleanest part of the paper.
It connects pre-LLM token selection and post-LLM KV memory with the same unit.

## Method

### 1. Pipeline Overview
During video streaming:
- a new frame arrives;
- the vision encoder and projector produce visual tokens;
- **CTR** selects exactly **$G$** tokens from that frame;
- only these retained tokens enter the LLM;
- the LLM produces KV cache for the retained group;
- **OQM** quantizes and stores the group-aligned KV memory.

When a question arrives:
- the question is encoded once;
- OQM compares the question representation with stored group keys;
- at most **$k$** relevant groups are retrieved;
- only retrieved groups are dequantized back to full precision;
- the model answers using the reconstructed dynamic KV cache.

So StreamingTOM is not only a KV-cache compression paper.
It is really:
> pre-LLM visual token compression + post-LLM quantized KV retrieval.

### 2. Why Pre-LLM Compression Matters
Suppose a stream has **$T$** frames, each frame has **$N$** visual tokens, the LLM has **$L$** layers, and hidden dimension is **$d$**.

If all visual tokens enter the LLM, prefill cost scales roughly as:

$$
O(TNLd^2).
$$

CTR changes the token count per frame from **$N$** to **$G$**, so the prefill cost becomes:

$$
O(TGLd^2).
$$

This is different from ReKV / LiveVLM / StreamMem style methods.
Those methods can reduce memory after KV is created, but they do not remove the LLM work needed to create the full KV cache in the first place.

The paper emphasizes this as the main missing piece in prior training-free streaming methods:
> post-LLM compression cannot undo prefill computation.

### 3. Causal Temporal Reduction
CTR is the pre-LLM token selector.

Its goal is:
> select a fixed number of visual tokens from each frame, using only current and past information.

CTR uses a **two-frame causal window**:
- previous frame **$t-1$**;
- current frame **$t$**.

It does not look at future frames, so it satisfies streaming causality.

For every visual token / patch, CTR uses two signals:
- **adjacent-frame change**: whether this patch is static or dynamic compared with the previous frame;
- **token saliency**: how important this token looks according to the vision encoder's attention.

The adjacent-frame similarity is essentially a cosine similarity between aligned patches:

$$
s_i^t =
\cos\left(
\mathbf{x}_{i}^{t},
\mathbf{x}_{i}^{t-1}
\right).
$$

Then tokens are split into:
- **static tokens**: high similarity, likely redundant;
- **dynamic tokens**: lower similarity, likely changed or moving.

This is close in spirit to InfiniPot-V's temporal redundancy idea, but it happens before the LLM and under strict causality.

### 4. Saliency from Streaming Attention
CTR also needs an importance score for each visual token.

Instead of materializing a full attention map, the implementation modifies the final layer of the SigLIP vision encoder with a chunked streaming attention kernel.
This produces both:
- the normal attention output;
- an extra one-dimensional importance score over visual tokens.

Conceptually, the saliency score is an average of attention probabilities over heads and query positions:

$$
\operatorname{score}(i)
{}=
\frac{1}{H L_q}
\sum_{h=1}^{H}
\sum_{j=1}^{L_q}
P_{h,j,i}.
$$

This gives CTR a model-internal token saliency signal without adding a separate retriever or training a selector.

### 5. Static and Dynamic Token Processing
After static / dynamic classification, CTR allocates the fixed budget **$G$** between the two groups.

Dynamic tokens are selected mainly by saliency:
- if a patch changed a lot, it may contain motion or event information;
- keep the top-saliency dynamic tokens.

Static tokens are more redundant, so CTR compresses them with **DPC-style clustering**.
The idea is:
- nearby static tokens often represent similar background or repeated content;
- cluster them;
- keep compact representatives rather than many redundant patches.

The final output is always exactly **$G$** tokens per frame.

This fixed size is a systems choice, not just an algorithmic convenience.
It makes per-frame latency predictable:
- every frame writes the same amount of KV;
- every memory group has the same size;
- retrieval can be group-aligned.

### 6. Online Quantized Memory
CTR reduces prefill compute, but KV memory can still grow with stream length.
OQM handles this second bottleneck.

For each incoming group, OQM stores:
- the quantized 4-bit KV tensor;
- quantization scale / offset metadata;
- a compact representative key for retrieval.

System prompt tokens remain in FP16.
Visual groups are quantized incrementally as they arrive.
There is no need to revisit all old groups.

The quantized group can be written as:

$$
\mathcal{Q}_4(\mathbf{X}_t)
{}=
\left(
\operatorname{uint4}(\hat{\mathbf{X}}_t),
\mathbf{s}_t,
\mathbf{m}_t,
\bar{\mathbf{k}}_t
\right).
$$

Here:
- **$\operatorname{uint4}(\hat{\mathbf{X}}_t)$** is the packed 4-bit tensor;
- **$\mathbf{s}_t$** and **$\mathbf{m}_t$** are scale / offset terms;
- **$\bar{\mathbf{k}}_t$** is the representative retrieval key.

When a group is needed, OQM dequantizes it:

$$
\mathcal{Q}_4^{-1}(\hat{\mathbf{X}})
{}=
\operatorname{depack}(\hat{\mathbf{X}})\odot \mathbf{s}+\mathbf{m}.
$$

So the long-term memory can keep a much larger history in compressed form, while the active decoding cache stays bounded.

### 7. Retrieval and Question Answering
When a question arrives, OQM does not dequantize all historical groups.

It first retrieves using the compact group keys.
For each layer, the method:
- obtains a question embedding from the question tokens;
- computes cosine similarity with stored group representative keys;
- retrieves the top groups under a global token budget;
- keeps selected group indices sorted by time;
- reconstructs a `DynamicCache` from only the selected groups.

The active decoding memory is therefore:

$$
O(kGd),
$$

where **$k$** is the number of retrieved groups.

The full stored history is still available in compressed form:

$$
O(TGd) / 4.
$$

This is the practical trade-off:
- store a long history cheaply;
- retrieve only a bounded active subset;
- pay dequantization only for what the question needs.

> Remark: This is very similar in spirit to ReKV / LiveVLM retrieval, but the memory bank is much smaller because CTR already reduced each frame before the LLM.

## Experiments

### Benchmarks and Setup
The paper evaluates two settings.

Offline long-video benchmarks:
- **VideoMME** without subtitles;
- **MLVU** dev split;
- **EgoSchema** dev split.

Online streaming benchmarks:
- **RVS-Ego**
- **RVS-Movie**

Main setup:
- backbone: **LLaVA-OneVision-Qwen2-7B-OV**
- precision: **FP16**
- GPU: **NVIDIA A6000 48GB**
- sampling: **0.5 FPS** for videos under 30 minutes, **0.2 FPS** for longer videos
- CTR retained tokens: **$G=50$**
- CTR similarity threshold: **0.9**
- OQM quantization: **4-bit**
- OQM group size: **50**
- retrieval budget: around **12K** tokens

### Offline Long-video Results
StreamingTOM is the strongest training-free streaming method in the paper's offline benchmark table.

For **LLaVA-OneVision-7B**:
- base model: **58.4** on VideoMME, **64.7** on MLVU, **60.1** on EgoSchema, **61.0** average;
- LiveVLM: **57.3 / 66.3 / 59.0**, **60.9** average;
- StreamMem: **59.4 / 66.9 / 63.0**, **63.1** average;
- StreamingTOM: **59.9 / 67.9 / 63.7**, **63.8** average.

So the gain is not huge, but it is consistent.
The more important point is that this is achieved while reducing prefill and KV memory.

The supplementary result on **LongVideoBench** is also useful:
- LLaVA-OV-7B with 32 frames: **56.4**
- StreamingTOM at 0.5 FPS: **56.3**

So for that benchmark it basically retains the baseline accuracy while using much fewer active tokens.

### Online RVS Results
On RVS, the paper compares under a constrained-memory streaming setting.

Average results:
- ReKV with CPU offloading: **59.0 / 3.8**
- ReKV without offloading: **53.3 / 3.4**
- InfiniPot-V: **54.6 / 3.5**
- StreamMem: **55.2 / 3.6**
- LiveVLM: **55.6 / 3.8**
- StreamingTOM: **55.8 / 3.7**

The interpretation is similar to the other streaming papers:
- full ReKV with offloading can still be stronger in raw score;
- but it pays CPU / GPU transfer cost and keeps much more history;
- StreamingTOM is more practical when the goal is bounded GPU memory and predictable latency.

### Efficiency
This is the most important part of the paper.

StreamingTOM reports:
- **15.7x** KV-cache compression ratio;
- **1.2x** lower peak memory than LiveVLM at 256 frames;
- **2x** faster TTFT than LiveVLM at 256 frames;
- one-hour LLaVA-OV-7B stream KV reduced from **18.8 GB** to **1.2 GB**.

The timeline breakdown is also nice.
For a 64-frame stream with batch size 8 and 50 tokens per frame:
- CTR reduces prefill from **337.8 ms** to **92.8 ms**, about **3.6x** faster;
- OQM adds only **7.3 ms** for KV storage;
- retrieval costs **6.9 ms**;
- 4-bit reconstruction costs **28.7 ms**;
- query TTFT is around **0.20 s**.

This supports the paper's main claim:
> pre-LLM compression gives the major speedup, while OQM keeps memory bounded with modest overhead.

### Ablations
The main ablation studies token retention and quantization.

On VideoMME:
- **40 tokens + 4-bit**: **58.9** overall;
- **50 tokens + 4-bit**: **59.9** overall;
- **60 tokens + 4-bit**: **59.3** overall.

The default **50 tokens + 4-bit** is best.

The interesting explanation is:
- too few tokens lose per-frame details;
- too many tokens reduce temporal coverage under a fixed memory budget;
- 50 is a balance between frame detail and long-horizon coverage.

For quantization:
- 4-bit consistently beats 2-bit;
- 2-bit saves more memory but loses too much fidelity.

So the default design is not simply "compress as much as possible".
It is a practical middle point:
> 50 retained tokens per frame + 4-bit memory.

## My Takeaways
The biggest contribution is the **pre-LLM** angle.

ReKV, StreamKV, StreamMem, InfiniPot-V, and LiveVLM all care about streaming memory.
But StreamingTOM says:
> memory compression is not enough if every visual token still passes through the LLM.

That is a very clear systems point.

CTR is also interesting because it combines two kinds of signals:
- temporal change tells us what is redundant;
- attention saliency tells us what is important.

This is conceptually close to InfiniPot-V's TaR + VaN decomposition:
- one part handles temporal redundancy;
- one part handles semantic / model-internal importance.

But StreamingTOM moves the decision earlier in the pipeline.

OQM is less surprising, but very practical.
4-bit group storage + representative-key retrieval is a simple combination, and the group abstraction makes it much cleaner than arbitrary token-level retrieval.

I think the paper's real message is:
> streaming video efficiency needs compression before and after the LLM.

## Limitations / Open Questions
- CTR is still a hard token selection step. If it discards a fine-grained detail before the LLM, OQM cannot recover it later.
- The fixed **$G=50$** budget is predictable, but not content-adaptive. Some frames are easy and some frames are dense; a learned or dynamic budget may be better.
- CTR depends on aligned adjacent-frame comparison. Fast camera motion, scene cuts, or changing viewpoints may make simple patch-wise similarity less reliable.
- OQM retrieval uses group-level representative keys. This is efficient, but it may miss evidence that is hidden inside a low-scoring group.
- The vision encoder is still dense and remains a major latency source. The paper also lists this as a limitation.
- Newer VLMs with more complicated visual tokenization or 3D positional encoding may need extra engineering. The Qwen2.5-VL result is encouraging, but this part is probably still model-specific.

> Remark: StreamingTOM feels like the missing prefill-side counterpart to the KV-cache papers.

> Remark: The cleanest idea is not just CTR or OQM alone, but using the same frame-aligned group as the unit for both.
