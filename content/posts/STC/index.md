+++
date = '2026-07-24T01:25:49+08:00'
title = 'STC'
description = 'Causal ViT activation reuse and pre-LLM visual token pruning for faster streaming Video-LLMs.'
venue = 'CVPR 2026'
math = true
categories = ["AI", "VLM", "paper"]
tags = ["Video-LLM", "streaming", "compression", "video understanding", "STC"]
decor_image = "images/bg4.png"
+++

Paper: [Accelerating Streaming Video Large Language Models via Hierarchical Token Compression](https://arxiv.org/abs/2512.00891)

PDF: [CVPR 2026 Open Access](https://openaccess.thecvf.com/content/CVPR2026/papers/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.pdf)

Code: [lern-to-write/STC](https://github.com/lern-to-write/STC)

## Release History

STC first appeared as an arXiv preprint on November 30, 2025. The current arXiv version was uploaded on February 11, 2026, and the paper was subsequently accepted by CVPR 2026. It is therefore an older preprint that later received a 2026 conference label, rather than a method first released with the conference proceedings.

## Core Idea

**Streaming Token Compression (STC)** is a training-free, plug-and-play acceleration framework that compresses streaming visual computation at two points:

1. **STC-Cacher** operates inside the vision transformer. It reuses intermediate activations for spatial tokens that remain similar across adjacent frames and recomputes only the changing tokens.
2. **STC-Pruner** operates after visual encoding but before LLM prefilling. It retains tokens that are novel relative to both the current frame and recent history.

The most useful summary is:

> STC reduces what the vision encoder computes and what visual evidence is written into the LLM, but it does not decide how an already generated historical KV cache should be stored or retrieved.

This distinction places STC earlier in the streaming pipeline than ReKV, InfiniPot-V, or WeaveTime.

| Stage | Representative question | Example method |
|---|---|---|
| ViT computation | Which patches need to be recomputed for this frame? | STC-Cacher |
| Visual-token write policy | Which encoded patches should enter the LLM and become KV? | STC-Pruner |
| Historical KV maintenance | Which generated KV states should remain in memory? | InfiniPot-V |
| Historical KV retrieval | Which old KV blocks should be loaded for a question? | ReKV / WeaveTime |

## Why Streaming Changes the Compression Problem

In a normal offline video pipeline, the model may see the complete video and sometimes the user question before deciding what to compress. A streaming system has stricter constraints:

- future frames are unavailable;
- the future query is unknown;
- incoming frames must be processed with low latency;
- redundant computation accumulates before the LLM even starts decoding.

The paper identifies two separate bottlenecks.

First, densely sampled streaming frames are highly similar. With LLaVA-OneVision, the reported mean cosine similarity between adjacent-frame ViT features reaches approximately 0.85 at a deep layer under the streaming protocol, compared with approximately 0.60 for offline videos. Re-encoding every patch therefore repeats substantial work.

Second, a frame may produce 196 visual tokens. A 32-frame input then contributes 6,272 visual tokens before text tokens are counted. This increases LLM prefill cost and also causes more visual KV states to be generated.

Methods that only compress the final KV cache cannot recover the ViT and prefill computation already spent on these tokens. STC addresses both costs before historical KV management begins.

## Pipeline

```text
Incoming frame
      |
      v
STC-Cacher inside the ViT
  - fully encode periodic reference frames
  - reuse static-token activations
  - recompute dynamic tokens
      |
      v
Encoded visual tokens
      |
      v
STC-Pruner before LLM prefilling
  - compare each token with a spatial anchor
  - compare each token with a temporal anchor
  - keep high-novelty tokens
      |
      v
Shorter visual-token sequence
      |
      v
LLM prefilling and visual KV generation
      |
      v
ReKV, another memory system, or normal decoding
```

The word **hierarchical** refers to these two processing stages. STC does not construct a hierarchical event memory or a multi-resolution historical KV store.

## Method

### 1. STC-Cacher: Selective ViT Recomputation

STC-Cacher exploits the observation that most patches in adjacent streaming frames change slowly.

#### Reference frames

Every $N$ frames, STC performs a complete ViT forward pass. At each ViT layer $l$, it stores a reference state containing:

$$ C_{mathrm{ref}}^l=\{K_{mathrm{ref}}^l,V_{mathrm{ref}}^l,A_{mathrm{ref}}^l,M_{mathrm{ref}}^l\}. $$

Here, $K$ and $V$ are attention projections, $A$ is the attention output, and $M$ is the MLP output. These per-layer activations become reusable templates for the following non-reference frames.

#### Finding dynamic tokens

For a non-reference frame, STC computes the current Key projections and compares each patch with the reference patch at the same spatial index:

$$ s_i^l=\cos\!\left(K_{mathrm{curr},i}^l,K_{mathrm{ref},i}^l\right). $$

Tokens with the lowest similarity are treated as dynamic. If the update ratio is $r$, the selected index set is:

$$ I^l=\operatorname{BottomK}\!\left(\{s_i^l\},\lfloor rN_{\mathrm{tok}}\rfloor\right). $$

The experiments commonly recompute about 25% of the visual tokens and reuse the remaining 75%.

#### Selective attention and MLP updates

For the selected tokens, STC recomputes Query and Value projections, attention outputs, and MLP outputs. The outputs for unselected tokens are copied from the cached reference state. Gather and scatter operations restore the complete token layout after the selective computation.

This is more fine-grained than caching the final feature of a whole frame. It reuses intermediate activations within many ViT blocks while still allowing moving regions to propagate new information.

However, a 75% reuse ratio does not imply a 75% latency reduction. The implementation still computes current Keys for all tokens, runs similarity and top-$K$ selection, and lets the selected queries attend to a full Key/Value set. The reported ViT reduction of roughly 24%--35% is more representative of the actual saving.

#### Reference refresh

The cache is periodically refreshed with another full frame. This prevents errors from accumulating forever when the camera moves or the scene gradually changes.

The supplementary ablation confirms the trade-off: more frequent reference updates preserve accuracy, while using one static reference indefinitely produces a large degradation. More frequent refreshes also reduce the attainable speedup, so $N$ is a direct accuracy--latency control.

### 2. STC-Pruner: Dual-Anchor Visual Token Selection

After the ViT produces visual features, STC-Pruner reduces the sequence before it enters the LLM. The decision is causal and query-agnostic.

It constructs two anchors.

The **Spatial Context Anchor (SCA)** is the mean of all tokens in the current frame:

$$ a_{\mathrm{spatial}}=\frac{1}{N}\sum_{i=1}^{N}z_i. $$

It represents the frame's global appearance or background.

The **Temporal Context Anchor (TCA)** is the mean of historical frame or chunk summaries:

$$ a_{\mathrm{temporal}}=\frac{1}{|H|}\sum_{h\in H}h. $$

It represents what has already appeared in the recent stream.

Each visual token receives a novelty score based on its cosine distance from both anchors:

$$ S(z_i)=\alpha d_{\cos}(z_i,a_{\mathrm{temporal}})+(1-\alpha)d_{\cos}(z_i,a_{\mathrm{spatial}}). $$

A high score means that the token is unlike both the historical average and the current frame average. STC keeps the top-scoring tokens under a fixed per-frame budget.

The two distances have different roles:

- temporal distance favors new events and changing regions;
- spatial distance favors local objects that differ from the current background;
- their combination tries to avoid keeping either repeated history or uniform within-frame content.

The paper commonly prunes 70%--75% of the visual sequence, retaining only 25%--30% of the original tokens for LLM prefilling.

## Where STC Sits Relative to KV Compression

STC-Pruner indirectly reduces KV size because discarded visual tokens never enter the LLM and therefore never produce visual KV states. This is **pre-KV compression**, not compression of an existing cache.

That difference has several consequences:

- STC saves part of the prefill computation as well as downstream KV memory.
- It cannot recover a token after pruning because no corresponding LLM KV was ever generated.
- It does not provide query-time retrieval or reconstruct old details.
- A fixed number of retained tokens per frame still grows linearly with stream duration.

STC therefore lowers the slope of memory growth but does not bound total historical storage. When combined with ReKV, STC decides what enters the LLM, while ReKV decides how the resulting historical KV is offloaded and retrieved. When combined with InfiniPot-V, STC would act before KV generation and InfiniPot-V would continually compress the generated history.

## Relation to Previous Ideas

The paper compares primarily with three families of visual token compression:

- **ToMe** merges similar tokens inside ViT layers and can accelerate the vision encoder, but aggressively changing the token structure hurts streaming accuracy.
- **VisionZip** and **VidCom²** reduce visual tokens after encoding, which helps prefilling but does not avoid the original ViT computation.
- **DyCoke** and **TimeChat-Online** exploit temporal redundancy, but their token selection mechanisms are not the same two-stage ViT-reuse plus prefill-pruning design.

The most important conceptual predecessor is not discussed in the STC paper.

### Eventful Transformers

[Eventful Transformers](https://openaccess.thecvf.com/content/ICCV2023/html/Dutson_Eventful_Transformers_Leveraging_Temporal_Redundancy_in_Vision_Transformers_ICCV_2023_paper.html), published at ICCV 2023, already proposed:

- retaining reference tokens across adjacent video inputs;
- detecting tokens that changed substantially;
- recomputing only the selected tokens;
- using gather, scatter, and buffers to reconstruct full transformer activations.

This is very close to the primitive behind STC-Cacher. STC changes the selection signal to per-layer Key similarity, periodically refreshes a reference frame, adapts the mechanism to CLIP/SigLIP vision towers used by Video-LLMs, and pairs it with a causal pre-LLM pruner.

My interpretation is therefore that STC-Cacher is a streaming VideoLLM adaptation of an established selective-recomputation pattern. The stronger contribution is the systems integration: applying it under a future-query-unknown protocol and jointly optimizing both ViT encoding and LLM prefilling.

## Evaluation

The paper evaluates four streaming VideoLLM systems across OVO-Bench, StreamingBench, EgoSchema, MLVU-dev, and VideoMME. The streaming experiments use a 0.5 fps protocol.

### ReKV Results

The main ReKV results use LLaVA-OneVision-7B:

| Method | OVO Real-Time | OVO Backward | OVO Forward | StreamingBench | ViT latency | LLM prefill latency |
|---|---:|---:|---:|---:|---:|---:|
| ReKV | 64.4 | 64.6 | 52.6 | 69.1 | 103.7 | 482.4 |
| + STC-Pruner | 60.5 | 59.3 | 50.6 | 63.7 | 103.7 | 259.2 |
| + STC-Cacher and Pruner | 62.5 | 63.3 | 52.0 | 65.2 | 78.3 | 263.7 |

The complete STC configuration reduces the reported ViT encoding latency by **24.5%** and LLM prefill latency by **45.3%**.

The accuracy trade-off is small on some OVO-Bench categories but more visible on StreamingBench, where the score drops from 69.1 to 65.2. This retains approximately 94.4% of the baseline score, so the paper's phrase **up to 99% accuracy retained** should be read literally as a best-case figure rather than a universal retention rate.

The Pruner-only and combined rows also use different retention settings: the former retains 25% of the sequence, while the combined system retains 30%. Their accuracy difference cannot be attributed to STC-Cacher alone.

### Other Streaming Backbones

STC-Cacher is also attached to Dispider, LiveCC, and StreamForest:

| Backbone | OVO Real-Time | OVO Backward | OVO Forward | ViT latency reduction |
|---|---:|---:|---:|---:|
| Dispider | 51.0 $\rightarrow$ 49.1 | 40.1 $\rightarrow$ 36.6 | 40.4 $\rightarrow$ 39.2 | 28.4% |
| LiveCC | 57.0 $\rightarrow$ 53.8 | 56.4 $\rightarrow$ 54.2 | 59.7 $\rightarrow$ 57.3 | 30.0% |
| StreamForest | 61.6 $\rightarrow$ 59.1 | 70.8 $\rightarrow$ 68.2 | 54.3 $\rightarrow$ 52.3 | 34.7% |

These results support model compatibility, but they also show that STC is an accuracy--latency trade-off rather than lossless acceleration.

On the three offline long-video benchmarks, ReKV averages 61.3, while STC-Pruner averages 61.8. Removing redundant visual tokens can occasionally improve the result, but this small difference should not be interpreted as proof that compression systematically improves reasoning.

## Paper and Code Details

The public repository was substantially refactored in June 2026 and now includes standalone STC modules, CUDA-graph support, and additional integrations. The current code is useful, but it is not a literal implementation of every printed equation.

Two differences are particularly important.

First, the current [STC-Pruner implementation](https://github.com/lern-to-write/STC/blob/master/stc/pruner/pruner.py) describes its default `gaussian` strategy as preserving the originally released behavior, while a separate `dual_anchor` option follows the paper formulation more directly. Reproductions should record which scorer is active rather than assuming that every code path uses the printed SCA/TCA equation.

Second, the current [STC-Cacher implementation](https://github.com/lern-to-write/STC/blob/master/stc/cacher/reference_forward.py) can select dynamic token indices at one layer and share them across later layers to avoid repeated cosine similarity and top-$K$ operations. The paper description is closer to per-layer selection. This shared-selection path is a later engineering approximation with a different accuracy--speed profile.

There is also a smaller inconsistency inside the paper itself: the prose calls the dual-anchor score a product of two distances, while Equation 8 and the pseudocode use a weighted sum.

## Limitations

- **Novelty is not future relevance.** A static road sign or object may be crucial to a later question but look redundant when it is encoded. An irrelevant camera shake may be novel and therefore retained.
- **Spatial indices are assumed to remain aligned.** Camera motion, zoom, and scene cuts can make the same patch index correspond to different content. Periodic refresh limits the damage but does not solve geometric correspondence.
- **The temporal anchor collapses event structure.** A single historical mean cannot represent multiple distinct events, rare moments, or recurring actions.
- **The memory remains length-dependent.** Per-frame pruning reduces the number of generated KV states but does not impose a fixed long-term memory budget.
- **Reference caches consume memory.** STC-Cacher stores several intermediate tensors at every ViT layer. This state is bounded to the reference frame, but its memory cost is not analyzed in the same detail as latency.
- **Selective computation still has dense components.** Full-token Key projection, similarity scoring, and selected-query attention limit the achievable acceleration.
- **The reported latency is stage-specific.** The main tables isolate ViT encoding and LLM prefilling rather than reporting complete end-to-end response latency, including decoding, memory transfer, and retrieval.
- **Paper and implementation paths differ.** Scoring and cross-layer token selection must be fixed explicitly for a reproducible comparison.

## Takeaways

STC is best understood as a **compute-and-write policy before historical memory**, not as another KV retrieval method.

It exposes three separable decisions in a streaming VideoLLM:

1. **Compute:** which visual patches should be recomputed?
2. **Write:** which visual tokens should enter the LLM and generate KV?
3. **Read:** which historical KV should be loaded when a question arrives?

STC addresses the first two with temporal-change heuristics. ReKV and WeaveTime address the third through historical KV retrieval. InfiniPot-V instead imposes a bounded retention policy after KV generation.

This decomposition is more valuable than either STC scoring formula by itself. A complete streaming system could combine:

```text
change-aware ViT computation
    + future-value-aware memory writing
    + bounded KV maintenance
    + evidence-sufficiency-aware historical reading
```

The main weakness in STC is its approximation of future value by present novelty. The most promising extension is therefore not another fixed cosine score, but a learned write policy that estimates whether a visual token may support future questions while accounting for compute, storage, and retrieval cost.

STC remains a practical systems paper: its primitives are familiar, especially the selective recomputation behind STC-Cacher, but their integration targets a real bottleneck that KV-only streaming methods leave untouched.
