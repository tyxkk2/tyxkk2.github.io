+++
date = '2026-07-24T00:32:09+08:00'
lastmod = '2026-09-03T19:28:00-05:00'
title = 'WeaveTime'
description = 'Temporal-order instruction tuning and uncertainty-gated historical KV retrieval for streaming Video-LLMs.'
venue = 'CVPR 2026'
math = true
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "retrieval", "KV cache", "WeaveTime", "streaming-video-lmm"]
decor_image = "images/bg4.png"
+++

Paper: [WeaveTime: Streaming from Earlier Frames into Emergent Memory in VideoLLMs](https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.html)

Preprint (earlier title: *Stream from Earlier Frames*): [arXiv:2602.22142](https://arxiv.org/abs/2602.22142)

PDF: [CVPR 2026 Open Access](https://openaccess.thecvf.com/content/CVPR2026/papers/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.pdf)

Supplement: [CVPR 2026 Supplementary Material](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Zhang_WeaveTime_Streaming_from_CVPR_2026_supplemental.pdf)

Project: [WeaveTime](https://zhangyl4.github.io/publications/weavetime/)

Code: [zhangyl4/weavetime](https://github.com/zhangyl4/weavetime)

> **Series guide.** PCDF bounds when and how much history is read, not how much
> ReKV-style history is stored. See the
> [bounded-memory survey]({{% relref path="/posts/StreamingMemory-Retention" %}})
> for the resource comparison and the
> [development-history hub]({{% relref path="/posts/StreamingVideoLMM-Development" %}})
> for the complete series.

## Core Idea

WeaveTime can be summarized as:

> ReKV-style historical visual KV memory + temporal-order SFT + uncertainty-gated coarse-to-fine retrieval.

It does not introduce a new compressed KV format or a bounded long-term memory. Instead, it improves two parts of a ReKV-style streaming system:

- **temporal interpretation**: teach the Video-LLM to distinguish event order rather than treat video as an unordered bag of visual evidence;
- **memory access**: answer from the current/recent context when possible and retrieve historical KV only when the model appears uncertain.

The individual ingredients are familiar. The paper's main contribution is their integration and evaluation under a causal streaming VideoQA protocol.

## Time-Agnosticism in Video-LLMs

The paper describes a common Video-LLM failure as **Time-Agnosticism**: the model recognizes useful objects and actions but does not reliably represent their chronological order.

The authors support this diagnosis with two controlled tests.

First, shuffling video frames causes surprisingly little degradation and sometimes even improves accuracy, including on several temporal tasks. Humans show a different pattern: temporal and action reasoning degrade when order is removed and recover when timestamps are available.

Second, moving a ground-truth answer window to different relative positions changes model accuracy systematically. Short videos show preferences for particular regions, while longer videos exhibit a strong early-context bias. This suggests that the model often relies on positional shortcuts instead of locating evidence from the question.

In streaming settings, the paper separates the consequence into two failures:

- **Temporal Order Ambiguity**: semantically similar historical segments are confused even when their event directions differ, such as entering versus leaving a room.
- **Past-Current Focus Blindness**: the model retrieves old evidence when the answer is visible now, or remains focused on the present when the question requires history.

WeaveTime assigns one component to each failure: SOPE teaches order, while PCDF-Cache controls access to the past.

## Pipeline

```text
Incoming frame or segment
        |
        v
Sliding-window Video-LLM encoding
        |
        +-- recent KV stays in the local window
        |
        +-- older visual KV enters a growing historical memory
        |
        v
Question arrives
        |
        v
First forward with current/recent context
        |
        v
Estimate predictive uncertainty
        |
        +-- low uncertainty  --> answer without long-term recall
        |
        +-- high uncertainty --> coarse historical search
                                  --> token-level reranking
                                  --> load selected KV
                                  --> answer with expanded context
```

## Method

### 1. ReKV-Style Historical KV Memory

The memory substrate is inherited from ReKV. Each incoming frame $f_t$ is encoded with only a local token window of length $C$:

$$ (K_t,V_t)=\operatorname{Encode}\!\left(\mathcal M_{t-1}[-C:],f_t\right). $$

The resulting KV is appended to the historical memory:

$$ \mathcal M_t=\operatorname{Append}\!\left(\mathcal M_{t-1},(K_t,V_t)\right). $$

These are in-context visual KV states produced by the LLM, not independent CLIP embeddings or captions. Because every frame is encoded with a recent sliding window, its KV may also contain information from nearby preceding frames.

Like ReKV, old KV blocks can be offloaded from GPU memory to RAM and loaded again after a question arrives. The active GPU context is bounded, but the total historical storage still grows with stream duration.

### 2. SOPE: Learning Temporal Order

**Streaming Order Perception Enhancement (SOPE)** is a training-time scheme built around a Temporal Reconstruction auxiliary task.

The input video is divided into timestamped segments. The visual segments are then shuffled while timestamp labels remain explicit. A simplified example is:

```text
t=0.3-1.2s  <visual content from 1.2-2.1s>
t=1.2-2.1s  <visual content from 2.1-3.0s>
t=2.1-3.0s  <visual content from 0.3-1.2s>
t=3.0-3.9s  <visual content from 3.0-3.9s>

These video segments are shuffled.
List each segment's true time range.
```

The model first generates the correct timestamp order and then answers the original video question in the same conversation. This remains ordinary autoregressive instruction tuning: there is no temporal prediction head or specialized loss.

The reported SOPE setup uses 30K sampled offline video-instruction examples, one epoch of training, a fully trainable connector, and LoRA on the LLM with rank 128 and scale 256. It does not require a stream-tailored instruction dataset.

SOPE should be interpreted as **behavioral temporal supervision**. It trains the model to use timestamps and event progression, but it does not redesign RoPE or guarantee that retrieved, non-contiguous KV blocks preserve their original temporal distances.

### 3. PCDF-Cache: Look Now, Recall if Needed

The **Past-Current Dynamic Focus Cache (PCDF-Cache)** first answers from the current/recent KV window:

$$ a_t^{(0)}=\operatorname{Answer}\!\left(\mathcal M_{t-1}[-C:],q\right). $$

It then compares predictive entropy $H_t$ with a threshold $\delta$:

$$ a_t=\begin{cases}a_t^{(0)},&H_t<\delta,\\ \operatorname{Answer}\!\left(\operatorname{Load}_{\mathrm{C2F}}(\mathcal M_t,q),q\right),&H_t\geq\delta.\end{cases} $$

The experiments use $\delta=0.6$.

The paper describes this as computing the uncertainty of the initial answer. The public implementation is more specific: it applies the LM head to the hidden state at the last query position, computes normalized entropy over the top-10 logits for each layer, and averages a configurable window of final-layer entropies. A low-entropy path reuses the first forward pass; a high-entropy path performs another forward with historical retrieval.

This is cheaper than fully generating an answer twice, but it is still a heuristic. Next-token uncertainty is not the same as estimating whether historical visual evidence is necessary.

### 4. Coarse-to-Fine KV Retrieval

If the uncertainty gate opens, WeaveTime uses two-stage retrieval.

The **coarse stage** averages the token keys of each historical frame or block and compares this representative vector with an averaged query key using cosine similarity. This cheaply removes most of the history.

The **fine stage** performs ColBERT-style late interaction over the remaining candidates. For frame $i$, the paper defines:

$$ \operatorname{maxSim}(i,q)=\sum_{j=1}^{N_q}\max_{1\leq k\leq N_i}\left\langle f_j^q,f_{i,k}^v\right\rangle. $$

Each query token can therefore match a different visual KV token instead of forcing the question into one average vector. The final top-$K$ historical blocks are loaded for answer generation, with the experiments limiting recall to 64 frames.

The public code prefilters roughly $3K$ candidates with average similarity before fine scoring. Some current code paths reduce the token-level MaxSim scores with a maximum or mean rather than the sum printed in the paper, so reproductions should verify which implementation path is active.

## Where the Components Come From

The method is easier to evaluate when its direct sources are separated from its streaming-specific integration.

### Explicitly Cited Sources

| WeaveTime component | Source | What is reused |
|---|---|---|
| Historical visual KV memory | [ReKV](https://arxiv.org/abs/2503.00540) | Sliding-window video encoding, historical KV offload, and query-conditioned KV reload |
| Uncertainty-triggered visual access | [MemVR / Look Twice Before You Answer](https://arxiv.org/abs/2410.03577) | Use layer-level predictive entropy to decide when additional visual evidence is needed |
| Fine-grained retrieval | [ColBERT](https://arxiv.org/abs/2004.12832) | Multi-vector late interaction and token-level MaxSim scoring |
| Multi-turn evaluation protocol | [StreamBridge](https://arxiv.org/abs/2505.05467) | Streaming-oriented multi-turn evaluation setup |

The connection to MemVR is especially direct. MemVR detects high uncertainty at intermediate layers and re-injects visual evidence to reduce hallucination. WeaveTime changes the retrieved evidence from current-image features to historical video KV:

```text
MemVR:     high entropy --> re-inject visual tokens
WeaveTime: high entropy --> retrieve historical visual KV
```

The control policy is therefore not new by itself; the change is where the extra visual evidence comes from and how it enters the model.

### Closely Related but Uncited Precedents

The following papers are not cited by WeaveTime, so they are conceptual precedents rather than evidence of direct influence.

**Shuffle and Learn** introduced temporal-order verification as a self-supervised video pretext task in 2016. It shuffles frames and trains a CNN to judge whether they are chronologically ordered. SOPE adapts the same underlying idea to a Video-LLM: shuffle larger segments, expose timestamps, and generate the recovered permutation as text before QA. The generative SFT formulation is different, but the temporal-learning principle is established.

Paper: [Shuffle and Learn: Unsupervised Learning using Temporal Order Verification](https://arxiv.org/abs/1603.08561)

**TimeChat** already combines timestamp-aware visual representations with temporal instruction tuning for long-video grounding and reasoning. SOPE adds corrupted ordering rather than simply binding content to correct timestamps, but explicit timestamp supervision for Video-LLMs predates WeaveTime.

Paper: [TimeChat: A Time-sensitive Multimodal Large Language Model for Long Video Understanding](https://arxiv.org/abs/2312.02051)

The PCDF control policy also resembles **adaptive RAG**. FLARE retrieves documents when upcoming text contains low-confidence tokens; Self-RAG learns reflection tokens that decide whether retrieval is necessary; Adaptive-RAG routes queries among no-retrieval, single-step, and multi-step strategies. WeaveTime uses a much simpler entropy threshold and retrieves historical visual KV instead of text documents.

Papers: [FLARE](https://arxiv.org/abs/2305.06983) / [Self-RAG](https://arxiv.org/abs/2310.11511) / [Adaptive-RAG](https://aclanthology.org/2024.naacl-long.389/)

From this perspective, WeaveTime's primitive-level novelty is limited. Its contribution is a specific composition:

```text
temporal-order pretext task
    + ReKV historical memory
    + uncertainty-based retrieval routing
    + two-stage dense retrieval
```

## Evaluation

### Main Results

On the real-time subsets, the reported average scores are:

| Backbone and method | OVO-Bench Real-Time | Streaming-Bench Real-Time |
|---|---:|---:|
| LLaVA-OV-7B + StreamBridge | 61.64 | 68.39 |
| LLaVA-OV-7B + ReKV | 61.72 | 66.15 |
| LLaVA-OV-7B + WeaveTime | **68.82** | **72.13** |
| Qwen2-VL-7B + StreamBridge | 63.35 | 72.01 |
| Qwen2-VL-7B + ReKV | 59.72 | 70.07 |
| Qwen2-VL-7B + WeaveTime | **66.28** | **75.39** |

The largest gains appear in temporally sensitive categories such as Action Recognition, Action Perception, and Event Understanding, which is consistent with the purpose of SOPE.

### What the Ablations Show

Starting from LLaVA-OV-7B + ReKV:

| Configuration | OVO-Bench | Streaming-Bench Real-Time |
|---|---:|---:|
| ReKV baseline | 53.56 | 66.15 |
| Timestamp-prompt finetuning only | 49.88 | 65.91 |
| + Temporal Reconstruction | 55.70 | 68.49 |
| + PCDF-Cache | **57.57** | **72.13** |

Timestamp supervision alone is not enough and can hurt because of the offline-to-streaming distribution mismatch. The temporal re-ordering objective is the part that makes the small SFT dataset useful.

Adding the whole PCDF-Cache produces another clear improvement. However, the ablation does not fully separate the entropy gate from coarse-to-fine reranking or compare against an always-retrieve C2F system, so the contribution of each PCDF subcomponent remains ambiguous.

The independent C2F gains over ReKV are relatively small:

| Method | QAEgo4D Recall | QAEgo4D Accuracy | MLVU | EventHALL |
|---|---:|---:|---:|---:|
| ReKV | 23.9 | 54.3 | 68.5 | 60.6 |
| C2F | **25.2** | **55.2** | **68.9** | **61.4** |

This suggests that the final improvement comes from the combination of temporal SFT, present-versus-history routing, and retrieval rather than from MaxSim alone.

## My Takeaways

WeaveTime is best understood as a **read-policy improvement over ReKV**, not a new way to store historical KV.

Its useful conceptual shift is to split historical memory access into two decisions:

1. Does this question require the past at all?
2. If it does, which historical KV blocks should be loaded?

ReKV mainly addresses the second question. WeaveTime adds a simple answer to the first one and trains the model to interpret the retrieved evidence in temporal order.

The most interesting open direction is therefore not another MaxSim variant. It is learning a better estimate of **historical evidence necessity**. A language-model entropy score may be high because a question is linguistically ambiguous and low even when the model is confidently missing old visual evidence. A stronger router should jointly model:

- the temporal dependency expressed by the question;
- the sufficiency of the current visual observation;
- the availability and expected value of historical evidence;
- the latency and memory cost of retrieval.

## Limitations / Open Questions

- **Historical storage remains unbounded.** PCDF bounds active retrieval, not the total CPU or disk KV memory accumulated over an infinite stream.
- **Entropy is not evidence sufficiency.** A model can be confidently wrong, and next-token uncertainty may not indicate whether history is needed.
- **The PCDF attribution is incomplete.** The paper does not cleanly isolate entropy gating from C2F scoring and retrieval frequency.
- **Position integrity is not solved.** SOPE teaches temporal behavior but does not preserve original distances among retrieved, non-contiguous KV blocks. This inherits the positional compromise of ReKV-style retrieval.
- **Fine retrieval still stores detailed keys.** Token-level reranking improves precision but increases CPU memory and transfer cost as history grows.
- **SOPE may exploit local action cues.** Reconstructing a short, coherent action sequence does not guarantee robust reasoning over sparse events separated by hours.
- **The main backbones are 7B models.** Transfer to newer VLMs with more complicated multimodal RoPE and tokenization remains unclear.
- **Paper and code details differ.** Entropy aggregation and MaxSim reduction are more specific in the public implementation than in the paper and are not identical across all code paths.

The paper is still valuable as a clean systems result: familiar components can become useful when the memory carrier, temporal supervision, and retrieval controller are aligned with the actual streaming protocol. But its contribution is primarily integration-level rather than a new memory or retrieval primitive.
