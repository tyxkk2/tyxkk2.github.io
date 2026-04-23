+++
date = '2026-04-23T00:30:00+08:00'
title = 'InfiniPot-V'
description = 'Memory-Constrained KV Cache Compression for Streaming Video Understanding.'
categories = ["AI", "VLM", "papers"]
tags = ["KV cache", "compression", "streaming", "InfiniPot-V"]
math = true
+++

## Background
**Streaming video understanding** is more constrained than offline long-video understanding.

In offline settings, the model can see the whole video first, maybe even the user query first, and then decide how to compress tokens or KV cache. But in streaming settings:
- frames arrive continuously;
- future queries are unknown;
- memory is fixed;
- KV cache still grows roughly linearly with time.

This is exactly the part that makes many existing KV compression methods awkward for real streaming scenarios.

The paper argues that prior methods usually fail in at least one of the following ways:
- they are **offline** and assume the full video is already available;
- they are **query-dependent**, so they cannot decide what to keep before the question appears;
- they still need to **materialize the full KV cache first**, so memory still grows with stream length;
- or they rely on **offloading**, which saves GPU memory but introduces transfer overhead.

So the target here is stricter than in ReKV / StreamKV style retrieval papers:
> enforce a **hard memory cap** during streaming video encoding itself, without depending on future queries.

## Core Idea
InfiniPot-V is basically a **continual KV cache compression** framework.

Instead of first building a very long cache and then deciding what to do with it, the method keeps monitoring memory during streaming inference:
- new frames keep producing KV cache entries;
- once the cache size reaches a preset memory threshold **|M|**,
- run a lightweight in-place compression pass;
- compress the cache down to a smaller target size **|C|**;
- continue streaming with the freed memory.

So the cache size is kept bounded over time.

The paper uses two query-agnostic criteria for deciding what to keep:
- **TaR (Temporal-axis Redundancy)**: remove temporally redundant tokens;
- **VaN (Value Norm)**: preserve semantically important tokens.

This is the whole point of the paper: not retrieval, but **online eviction / retention under a fixed memory budget**.

## Method

### 1. Continual KV Cache Compression (CKV)
This is the main algorithmic setting of the paper.

The model processes the video stream continuously. As frames arrive, their KV embeddings are appended into the current cache.

When the current cache length exceeds the memory budget **|M|**:
- take the current KV cache;
- run the compression procedure;
- reduce it to target size **|C|**, where \(|M| \gg |C|\);
- keep streaming.

So the memory pattern becomes:
- grow until threshold;
- compress;
- grow again;
- compress again.

This is why the method can keep memory roughly **length-independent** with respect to stream duration.

Compared with many offline KV compression papers, this is a much more realistic systems setup.

### 2. Temporal-axis Redundancy (TaR)
TaR is designed to remove **temporally redundant** visual tokens.

The intuition is simple:
- videos contain many static or slowly changing patches;
- if a patch in an older frame looks almost the same as corresponding patches in recent frames, it is probably redundant;
- we should preferentially evict those older static tokens.

The paper observes that **Key embeddings** are better than Value embeddings for measuring this kind of temporal redundancy. In Figure 2(b), static patches have much higher cosine similarity in Key space across adjacent frames. fileciteturn11file0

The implementation is patch-wise rather than frame-wise:
- reshape the Key cache into a 3D structure over **time × spatial patches × channels**;
- split frames into **recent frames** and **past frames**;
- always keep the recent frames intact;
- for past frames, compare each patch against corresponding patches in recent frames using cosine similarity;
- tokens with **lower redundancy / lower similarity to recent content** get higher priority to stay.

So TaR is not “keep recent frames only”. It is:
- keep recent frames fully;
- among older frames, preserve the parts that are still distinctive.

This is a pretty neat design, because it explicitly exploits the fact that video redundancy is mostly temporal.

### 3. Value Norm (VaN)
TaR only addresses temporal redundancy. It does not directly answer another question:
> which tokens are semantically important inside a frame?

For that, the paper uses **Value Norm (VaN)**.

The idea is very direct:
- compute the \(\ell_2\) norm of each Value vector;
- tokens with larger value norm are treated as more semantically important.

Why does this make sense?
The paper gives an empirical argument:
- project vision token representations into vocabulary space;
- compute entropy of the resulting word distribution;
- high-VaN tokens consistently show higher entropy and better downstream accuracy than low-VaN tokens.

Figure 3 shows exactly this trend: high-VaN tokens carry richer information, and keeping them gives much better VideoMME accuracy than reverse-VaN selection. fileciteturn11file0

So VaN is the **semantic importance** side of the method, complementary to TaR.

### 4. Layer-wise Adaptive Pooling for VaN
The paper does not stop at raw value norms.

It further observes that VaN maps have different spatial locality across layers:
- earlier / middle layers show stronger local clustering;
- deeper layers show weaker locality and need finer detail.

So InfiniPot-V applies **adaptive spatial pooling**:
- lower layers with stronger locality use larger pooling kernels;
- higher layers use smaller kernels or even no pooling.

This is a small but useful detail. It means the method is not treating all layers as spatially equivalent.

### 5. Combining TaR and VaN
The final token selection is two-stage.

The paper allocates the target cache budget **|C|** into two parts:
- first reserve **\(\alpha |C|\)** tokens for TaR;
- then use the remaining **\((1-\alpha)|C|\)** for VaN.

So in effect:
- TaR preserves temporally distinctive content;
- VaN preserves semantically salient content;
- recent frames are always retained.

This combination is what the paper calls a **spatio-temporal** compression strategy.

I think this is the key reason the method works better than just doing uniform keep/drop or only using one metric.

## Experiments

### Benchmarks
The paper evaluates on both **offline video understanding (OVU)** and **streaming video understanding (SVU)**.

Offline benchmarks:
- **VideoMME**
- **MLVU**
- **LongVideoBench**
- **EgoSchema**

Streaming benchmarks:
- **RVS-Ego / RVS-Movie**
- **OVO-Bench**
- **StreamingBench**

So this paper is broader than many streaming-only works. It tries to show that the same continual compression design also works on long offline video tasks.

### Models
The method is tested on several open-source MLLMs:
- **Qwen-2-VL**
- **Qwen-2.5-VL**
- **LLaVA-OV-7B**
- **LLaVA-Next-Video**

The paper emphasizes that InfiniPot-V is **training-free** and can be plugged into different models.

### Main Results
A few results are particularly important.

#### Offline long-video understanding
Under a fixed 6K memory budget, the method keeps accuracy surprisingly well.
For example, on page 7, Qwen-2-VL-7B + InfiniPot-V reduces the context budget from **50K to 6K** while staying close to the original full-cache results across EgoSchema, MLVU, VideoMME, and LongVideoBench. fileciteturn11file0

This is actually pretty strong, because 6K vs 50K is not a small reduction.

#### Comparison with IVC methods
In Table 2, under the same constrained memory setting, InfiniPot-V beats query-agnostic input-vision compression baselines such as TTC / STC on VideoMME and MLVU. The paper’s claim is basically:
- if you really care about memory-constrained streaming,
- compressing **KV cache continually** is better than only compressing vision tokens beforehand. fileciteturn11file0

#### Comparison with ReKV-style offloading
In Table 3, compared with ReKV on RVS-Ego / RVS-Movie:
- ReKV with CPU offloading gets better absolute scores,
- but it pays heavy CPU-memory and transfer cost;
- ReKV without offloading drops noticeably;
- InfiniPot-V stays fully on GPU and avoids that offloading burden.

More concretely, the paper reports:
- **ReKV**: 37.5 GB GPU + 18.8 GB/h CPU offload, 285.7 ms/frame
- **ReKV w/o offloading**: 27.2 GB GPU, 74.6 ms/frame
- **InfiniPot-V**: 27.8 GB GPU, 76.3 ms/frame

So InfiniPot-V is not “strictly better than full ReKV” on every QA metric. The real claim is more honest:
> under local-memory constraints, it is a more practical way to keep streaming inference alive without paying offloading cost. fileciteturn11file0

This distinction is important.

#### OVO-Bench / StreamingBench
On page 9, InfiniPot-V also improves over a uniform-selection baseline on OVO-Bench and StreamingBench under a 4K memory budget. For example, StreamingBench goes from **75.2 to 76.4** with Qwen-2.5-VL-7B. fileciteturn11file0

So even when the setup is very constrained, the method still gives a real improvement rather than only “not crashing”.

### Edge Device Deployment
This is one of the most interesting parts of the paper.

On **Jetson AGX Orin**, the paper reports that InfiniPot-V:
- keeps memory nearly constant around **9.2–10.7 GB**;
- while Full KV grows from **13.8 GB to 39.0 GB** and eventually OOMs;
- maintains around **6.3–6.4 FPS** prefill speed;
- improves generation throughput by up to **7.3×**;
- improves energy efficiency by about **2×**.

At 600-second streaming input, Full KV is OOM, while InfiniPot-V still runs. This is exactly the kind of result that makes the paper feel more systems-oriented and more realistic for on-device use. fileciteturn11file0

## Ablations
The ablations support the design pretty well.

### TaR vs reversed TaR
If you reverse TaR and intentionally discard the distinctive tokens instead of the redundant ones, performance drops a lot.
That is a basic but important sanity check.

### Patch-wise TaR vs frame-level TaR
Patch-wise temporal redundancy works better than frame-level similarity.
This makes sense: redundancy in videos is often local, not uniform across the entire frame.

### VaN vs reversed VaN
Keeping high-VaN tokens is much better than keeping low-VaN tokens. So the value norm is not just a random heuristic.

### VaN with pooling
Adaptive pooling further improves plain VaN, which supports the layer-wise locality observation.

### TaR + VaN
The combined version performs best, which matches the overall story of the paper:
- TaR handles temporal redundancy;
- VaN handles spatial semantic importance;
- using only one of them is not enough.

## My Takeaways
I think the biggest difference between this paper and ReKV / StreamKV is that **InfiniPot-V is not retrieval-first**.
It is really a **memory control** paper.

ReKV and StreamKV mainly ask:
- how should we retrieve relevant past information for QA?

InfiniPot-V asks a more systems question:
- under a strict memory budget, what should remain in the cache at all times?

That makes it feel closer to online cache eviction than to retrieval.

I also think the paper is refreshingly honest about the target scenario. It does not claim some magical long-context ability. It just says:
- memory is limited;
- future questions are unknown;
- so compression must be **query-agnostic** and **continual**.

The TaR + VaN decomposition is also very natural:
- one term for **temporal redundancy**;
- one term for **semantic importance**.

It is simple, but simple in a good way.

## Limitations / Open Questions
- The method is **query-agnostic**, which is exactly its strength, but it also means it may discard information that becomes important only for a later very specific question.
- Compared with ReKV + CPU offloading, InfiniPot-V is not always better in raw QA score; the main advantage is **practical bounded-memory execution**.
- The selection criteria are still heuristic. TaR and VaN are interpretable, but they are not guaranteed to be optimal.
- I am also not sure how this behaves on newer VLMs with more complicated visual token structures or different video tokenization schemes.

> Remark: This paper is closer to cache eviction / systems design than retrieval
> Remark: Very relevant if the true target is edge deployment rather than just benchmark accuracy
