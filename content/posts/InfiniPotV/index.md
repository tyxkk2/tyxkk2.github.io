+++
date = '2026-04-23T00:30:00+08:00'
title = 'InfiniPot-V'
description = 'Memory-Constrained KV Cache Compression for Streaming Video Understanding.(NeurIPS 2025)'
categories = ["AI", "VLM", "papers"]
tags = ["KV cache", "compression", "streaming", "InfiniPot-V", "ReKV"]
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
- reduce it to target size **|C|**, where $|M| \gg |C|$;
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
- if an old patch looks almost the same as the corresponding patch in recent frames, keeping both is wasteful;
- so old tokens that are highly similar to recent content should be evicted first.

The paper first makes an empirical observation: **Key embeddings** are better than **Value embeddings** for measuring temporal redundancy.
Figure 2(b) shows that for static patches, cosine similarity between adjacent-frame **Keys** is consistently higher than for **Values**, so redundancy is easier to detect in Key space.

#### Formalization
Suppose the cache has just reached the memory threshold **$|M|$**.
Within this chunk, the model has processed **$f$** consecutive frames, and each frame contains **$p$** vision tokens.
For one transformer layer, the Key cache is written as:

$$
K \in \mathbb{R}^{H \times (f p) \times D},
$$

where **$H$** is the number of attention heads and **$D$** is the per-head channel dimension.

TaR explicitly restores the temporal structure by reshaping the cache into:

$$
K \rightarrow \mathbb{R}^{H \times f \times p \times D}.
$$

If we index a patch by its spatial coordinate **$(i,j)$**, then **$K^{(t,i,j)}$** means:
- frame index **$t$**;
- patch location **$(i,j)$**;
- Key embedding of that patch.

Then the **$f$** frames are divided into two groups:
- **recent frames**: the latest **$r$** frames, always kept in full;
- **past frames**: the earlier **$f-r$** frames, which are candidates for compression.

Formally:

$$
K_{\text{recent}} \in \mathbb{R}^{H \times r \times p \times D}, \qquad
K_{\text{past}} \in \mathbb{R}^{H \times (f-r) \times p \times D}.
$$

#### Patch-wise redundancy score
For every patch in the past frames, TaR compares it with the **same spatial patch** in all recent frames.
The score in the paper is:

$$s_{\text{TaR}}(t,i,j)=
-\frac{1}{r}
\sum_{t'=1}^{r}
\cos \left(
K_{\text{past}}^{(t,i,j)},
K_{\text{recent}}^{(t',i,j)}
\right).$$

This formula is worth reading carefully:
- it is **patch-wise**, not frame-wise;
- it only compares the same spatial location across time;
- it averages similarity to the whole recent window of **$r$** frames;
- the minus sign is intentional.

Why the minus sign?
Because raw cosine similarity means:
- **higher similarity** $\Rightarrow$ more redundant;
- **lower similarity** $\Rightarrow$ more distinctive.

After multiplying by **$-1$**, a **larger** TaR score means **less temporal redundancy**.
That makes the later **Top-K** selection very convenient: just keep the patches with the highest scores.

#### Selection rule
In the standalone TaR formulation in the paper, all recent-frame tokens are retained first.
Let:

$$
|K_{\text{recent}}| = r p.
$$

Then TaR selects the remaining slots from past frames by:

$$
I_{\text{TaR}} = \operatorname{TopK}\!\left(s_{\text{TaR}}, |C| - |K_{\text{recent}}|\right),
$$

where **$|C|$** is the target compressed cache size.

The compressed cache is then formed as:

$$
\tilde{K}_{\text{TaR}} = \operatorname{Concat}\left(K[:, I_{\text{TaR}}, :], K_{\text{recent}}\right)
\\
\tilde{V}_{\text{TaR}} = \operatorname{Concat}\left(V[:, I_{\text{TaR}}, :], V_{\text{recent}}\right)
$$

So the actual eviction policy is:
- keep the latest **$r$** frames completely;
- among the older frames, keep only the patches that are **least similar to the recent window**.

This is why TaR is not just a recency heuristic.
It is really:
- **full retention of recent frames** for temporal continuity;
- **selective retention of distinctive old patches** for long-range memory.

This patch-wise design matters a lot.
If the method were frame-wise, a frame containing mostly static background but one moving object might be discarded as a whole.
With patch-wise TaR, the static background patches can be evicted while the moving or newly changed local regions are still preserved.

The paper’s ablation supports exactly this point: **patch-wise TaR** works better than **frame-level TaR**.

### 3. Value Norm (VaN)
TaR only addresses temporal redundancy. It does not directly answer another question:
> which tokens are semantically important inside a frame?

For that, the paper uses **Value Norm (VaN)**.

The intuition is again very direct:
- some tokens may not be temporally redundant, but still carry very little semantic content;
- we therefore need a query-agnostic score for how informative a token is by itself;
- the paper argues that **Value embeddings** are a natural place to measure this.

While TaR uses **Keys** to detect temporal repetition, VaN uses **Values** to score semantic importance.
The paper’s motivation is that the Value vector is more closely tied to the content that is actually passed forward through attention.

#### Formalization
For a token at frame **$t$** and spatial position **$(i,j)$**, let its Value embedding be **$V^{(t,i,j)}$**.
The Value-Norm score is defined as:

$$
s_{\text{VaN}}(t,i,j) = \left\| V^{(t,i,j)} \right\|_2
$$

So the scoring rule is:
- larger norm $\Rightarrow$ higher semantic importance;
- smaller norm $\Rightarrow$ lower priority to keep.

Unlike TaR, VaN is not comparing a token against other frames.
It is a **single-token salience score**: each token is judged by the magnitude of its own Value vector.

#### Why use the norm of Value?
The paper gives an empirical argument rather than only a heuristic intuition.
It projects vision token representations into vocabulary space and computes the entropy of the resulting word distribution.
The main finding is:
- tokens with higher VaN consistently have higher entropy;
- high-VaN tokens also give better downstream video-understanding accuracy when retained;
- if you reverse the criterion and deliberately keep low-VaN tokens, performance drops a lot.

So the paper’s interpretation is:
- high VaN tokens carry richer semantic information;
- therefore they should have higher retention priority under memory pressure.

So VaN is the **semantic importance** side of the method, complementary to TaR:
- TaR asks whether a token is redundant over time;
- VaN asks whether a token is semantically worth keeping at all.

### 4. Layer-wise Adaptive Pooling for VaN
The paper does not stop at raw value norms.

It further observes that VaN maps have different spatial locality across layers:
- earlier / middle layers show stronger local clustering;
- deeper layers show weaker locality and need finer detail.

So raw VaN scores are not treated identically across all layers.
Instead, the paper first analyzes locality and then chooses a pooling size adaptively for each layer.

#### Locality analysis
The paper uses two diagnostics to study how spatially clustered VaN scores are:
- **center distance** inside a local $3 \times 3$ neighborhood;
- **coefficient of variation (CV)** of the VaN distribution.

The qualitative conclusion is:
- low / middle layers have stronger spatial locality;
- high layers have weaker locality and more dispersed saliency patterns.

This matters because if strong VaN responses already form contiguous regions, a larger pooling window can summarize them without losing much information.
But if the saliency pattern is already sparse and fine-grained, aggressive pooling would blur away important details.

#### Implementation
For each layer **$l$**, the implementation computes the VaN map and then measures:

$$
\mu_l = \operatorname{mean}(\text{VaN}_l), \qquad
\sigma_l = \operatorname{std}(\text{VaN}_l), \qquad
CV_l = \frac{\sigma_l}{\mu_l}
$$

Then the pooling kernel size is chosen by a mapping function:

$$
\text{pool\_size}_l = g(CV_l)
$$

In the algorithm appendix, this mapping is implemented with thresholds $\tau_1, \tau_2, \tau_3$:

$$
g(CV)=
\begin{cases}
7, & CV < \tau_1 \\
5, & \tau_1 \le CV < \tau_2 \\
3, & \tau_2 \le CV < \tau_3 \\
1, & CV \ge \tau_3
\end{cases}
$$

So the policy is:
- **small CV** $\Rightarrow$ stronger locality $\Rightarrow$ larger pooling kernel;
- **large CV** $\Rightarrow$ weaker locality $\Rightarrow$ smaller kernel or no pooling.

After the kernel size is chosen, the pooled importance map is computed as:

$$
\text{VaN}_{\text{pool},l} = \operatorname{AveragePool2d}(\text{VaN}_l, \text{pool\_size}_l)
$$

This is a small but important systems detail.
It means InfiniPot-V does not assume that all layers should share the same spatial compression rule.
Instead, it adapts the spatial smoothing strength to the actual structure of each layer’s VaN map.

### 5. Combining TaR and VaN
The final token selection is two-stage.

The paper allocates the target cache budget **|C|** into two parts:
- first reserve **$\alpha |C|$** tokens for TaR;
- then use the remaining **$(1-\alpha)|C|$** for VaN.

So in effect:
- TaR preserves temporally distinctive content;
- VaN preserves semantically salient content;
- recent frames are always retained.

This combination is what the paper calls a **spatio-temporal** compression strategy.

I think this is the key reason the method works better than just doing uniform keep/drop or only using one metric.

## Experiments

The paper evaluates both **offline** and **streaming** video understanding across several open-source MLLMs, including **Qwen-2-VL**, **Qwen-2.5-VL**, **LLaVA-OV-7B**, and **LLaVA-Next-Video**. The important point is that InfiniPot-V is **training-free** and is tested under fixed memory budgets rather than in a relaxed offline setting.

The main empirical story is pretty simple:
- under a **6K** cache budget, it stays surprisingly close to full-cache performance on long offline benchmarks, even when the original context is much larger; the paper highlights a **50K to 6K** reduction on Qwen-2-VL-7B with relatively small loss across EgoSchema, MLVU, VideoMME, and LongVideoBench;
- under the same constrained budget, it beats query-agnostic input compression baselines such as **TTC / STC**, which supports the paper’s core claim that **continual KV compression** is better suited to streaming than only compressing vision tokens before decoding;
- on streaming benchmarks, it also improves over simple uniform selection, for example raising **StreamingBench** from **75.2 to 76.4** with Qwen-2.5-VL-7B under a **4K** budget.

Compared with **ReKV**, the trade-off is more about practicality than absolute score.
- ReKV with CPU offloading can achieve better QA performance;
- but it incurs substantial offload cost;
- InfiniPot-V stays on GPU and keeps runtime close to the no-offloading baseline.

The paper reports:
- **ReKV**: 37.5 GB GPU + 18.8 GB/h CPU offload, 285.7 ms/frame
- **ReKV w/o offloading**: 27.2 GB GPU, 74.6 ms/frame
- **InfiniPot-V**: 27.8 GB GPU, 76.3 ms/frame

The most convincing result is probably the edge-device deployment.
On **Jetson AGX Orin**, InfiniPot-V keeps memory roughly flat at **9.2–10.7 GB**, while Full KV grows from **13.8 GB** to **39.0 GB** and eventually OOMs. It also maintains around **6.3–6.4 FPS**, with up to **7.3×** better generation throughput and about **2×** better energy efficiency. For a systems-oriented paper, that is probably the strongest evidence.

## Ablations
The ablations mainly verify that the method works for the reasons the paper claims:
- reversing **TaR** or **VaN** hurts performance a lot, which is a good sanity check that the scores are not arbitrary;
- **patch-wise TaR** works better than frame-level TaR, supporting the idea that video redundancy is often local rather than uniform across a whole frame;
- **adaptive pooling** improves plain VaN, which is consistent with the observation that spatial locality differs by layer;
- the full **TaR + VaN** combination performs best, which is exactly the intended decomposition: TaR removes temporal redundancy, while VaN preserves semantically important content.

## My Takeaways
I think the biggest difference between this paper and ReKV / StreamKV is that **InfiniPot-V is not retrieval-first**.
It is really a **memory control** paper.

ReKV and StreamKV mainly ask:
- how should we retrieve relevant past information for QA?

InfiniPot-V asks a more systems question:
- under a strict memory budget, what should remain in the cache at all times?

That makes it feel closer to online cache eviction than to retrieval.

InfiniPot-V meets the constraint that the GPU/CPU memory is limited.

The TaR + VaN decomposition is also very interesting:
- one term for **temporal redundancy**;
- one term for **semantic importance**.

## Limitations / Open Questions
- The method is **query-agnostic**, which is exactly its strength, but it also means it may discard information that becomes important only for a later very specific question.
- Compared with ReKV + CPU offloading, InfiniPot-V is not always better in raw QA score; the main advantage is **practical bounded-memory execution**.
- The selection criteria are still heuristic. TaR and VaN are interpretable, but they are not guaranteed to be optimal.
- I am also not sure how this behaves on newer VLMs with more complicated visual token structures or different video tokenization schemes.

> Remark: This paper is closer to cache eviction / systems design than retrieval
> Remark: Very relevant if the true target is edge deployment rather than just benchmark accuracy
