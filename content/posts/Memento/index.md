+++
date = '2026-07-25T02:53:50+08:00'
title = 'Memento'
description = 'Similarity-gated visual memory and persistent-query retrieval for proactive ultra-long streaming video.'
venue = 'ICLR 2026'
math = true
categories = ["AI", "VLM", "paper"]
tags = ["Video-LLM", "streaming", "long video", "memory", "compression", "Memento"]
decor_image = "images/bg4.png"
+++

Paper: [OpenReview](https://openreview.net/forum?id=FtdbdoGbk3)

PDF: [Memento: Toward an All-Day Proactive Assistant for Ultra-Long Streaming Video](https://openreview.net/pdf?id=FtdbdoGbk3)

Supplement: [OpenReview Supplementary Material](https://openreview.net/attachment?id=FtdbdoGbk3&name=supplementary_material)

Base implementation: [showlab/videollm-online](https://github.com/showlab/videollm-online)

## Core Idea

Memento turns a streaming Video-LLM into a persistent visual monitor. A user registers a request such as *tell me every time I hold a phone*, and the model keeps observing the stream, updating its history, and deciding at every frame whether to remain silent or respond.

The method can be summarized as:

> fixed per-frame visual compression + similarity-gated dynamic memory + persistent-query memory selection + step-aligned streaming SFT.

Its components occupy different stages:

| Component | Decision |
|---|---|
| Frame representation | How much spatial information should one frame retain? |
| Dynamic Memory (DM) | Should the current frame update recent history, update older history, or create a new memory slot? |
| Query-related Memory Selection (QMS) | Which stored slots should the LLM read now? |
| Step-Aware Memory Attention (SAMA) | Which memory snapshot was legally visible at each training step? |
| Response policy | Should the model emit `[Txt]` or remain silent with `[EOS]`? |

This is not a KV-cache method. DM operates on visual encoder features before the MLP projector and before visual tokens become LLM KV states.

## The Task Is Persistent State Tracking

Although the paper presents Memento as an all-day proactive assistant, most of MementoBench can be understood as a set of long-running visual state machines:

| Task | State that must be maintained |
|---|---|
| Temporal Counting | Number of detected occurrences |
| Ordering | Current position in an event sequence |
| Duration | Start or last-occurrence time |
| Changing | Previous text or object state |
| Appear / Disappear | Presence flag and its transition |
| Spatial Counting / Abnormal | Current-frame count or state predicate |

The common loop is:

$$ z_t=\operatorname{Update}(z_{t-1},o_t;q),\qquad a_t=\operatorname{Trigger}(z_t;q), $$

where $q$ is a persistent user request, $o_t$ is the current observation, $z_t$ is the task state, and $a_t$ decides whether to respond.

Memento does not explicitly implement $z_t$ as a counter, timer, event list, or symbolic state machine. It expects the visual memory, dialogue history, and supervised model to realize this behavior implicitly.

## Pipeline

```text
Video stream at 2 FPS
        |
        v
SigLIP-ViT-L/384
        |
        v
1 global + 3x3 spatial tokens per frame
        |
        v
Dynamic Memory write gate
  - merge with the latest slot
  - soft-update historical slots
  - append a new slot
        |
        v
Query-related Memory Selection
  - score slots with persistent user queries
  - read the top 50%
        |
        v
MLP projector + LLM + dialogue history
        |
        v
[EOS] remain silent / [Txt] respond
```

## Method

### 1. Fixed Per-Frame Visual Compression

For frame $f_t$, the vision encoder produces:

$$ v_t\in\mathbb{R}^{P\times C},\qquad P=1+h_pw_p. $$

The default uses $h_p=w_p=3$, so every sampled frame contributes ten visual tokens.

The Memento paper specifies the output shape but does not restate how the spatial grid is formed. It says the implementation follows VideoLLM-online, whose public encoder performs the following operation:

```text
384x384 frame
    -> SigLIP patch-16 encoder
24x24 = 576 contextualized patch states
    -> adaptive average pooling to 3x3
9 spatial tokens
    + one learned global pooled token
    -> 10 tokens per frame
```

The exact inherited operation is available in the [VideoLLM-online vision encoder](https://github.com/showlab/videollm-online/blob/main/models/vision_live.py). Each spatial token averages an $8\times8$ block of final-layer patch states. This is a 64-fold reduction for the spatial grid, or approximately $576/10=57.6\times$ when the global token is included.

The token called `[CLS]` in the paper is more precisely SigLIP's `pooler_output`: a learned global attention-pooled summary, not a literal input class token.

This compression happens after the full vision transformer, so the pooled states are contextual semantic features rather than raw pixel averages. Nevertheless, it is an aggressive, fixed, and query-independent bottleneck. It can erase:

- small objects and fine text;
- multiple instances inside the same coarse cell;
- precise spatial relations;
- fine-grained hand actions and object identity.

The 2 FPS sampling adds a separate temporal bottleneck and can miss short events before memory processing even begins.

The frame-token ablation illustrates a trade-off rather than lossless compression:

| Frame tokens | TimeRecall | Score | Redundancy |
|---|---:|---:|---:|
| `1 + 2x2` | 40.4% | **4.39** | 56.2% |
| `1 + 3x3` | **68.9%** | 3.78 | 66.6% |
| `1 + 4x4` | 60.9% | 3.93 | 67.2% |

The large gain from $2\times2$ to $3\times3$ shows that spatial detail matters. The regression at $4\times4$ only makes $3\times3$ the best operating point under this training and response policy; the paper does not compare against the full $24\times24$ patch grid or show that ten tokens preserve fine-grained information.

### 2. Dynamic Memory: Similarity-Gated Writing

The historical memory is a sequence of frame-level slots:

$$ \mathcal M_{t-1}\in\mathbb{R}^{N_{t-1}\times P\times C}. $$

Memento does not maintain separate short-term and long-term banks. It uses one bank and computes two relevance signals to choose a write operation.

#### Recent similarity

The short-term score compares the incoming frame with the latest memory slot:

$$ \delta=\operatorname{CosSim}(v_t,m_{t-1}). $$

It detects adjacent frames with little change. The paper does not specify how the two $P\times C$ tensors are reduced into the scalar cosine score.

#### Historical similarity

For long-term recurrence, Memento flattens the historical tokens and lets the current frame attend to the full memory:

$$ \begin{aligned} A_t &= \operatorname{softmax}\!\left(\frac{(v_tW_q)(\bar{\mathcal M}_{t-1}W_k)^\top}{\sqrt d}\right), \\ \sigma &= \psi\!\left((A_t(\bar{\mathcal M}_{t-1}W_v))W_o\right). \end{aligned} $$

where $\psi$ sums the result and applies a sigmoid to produce a scalar score. Thus $\sigma$ is a learned cross-attention relevance signal, not the maximum cosine similarity with an old frame.

#### Remember-and-Forget gate

With the default threshold $\epsilon=0.7$, the gate chooses among three branches:

| Condition | Memory update | Interpretation |
|---|---|---|
| $\delta>\epsilon$ | Fuse $v_t$ into the latest slot | Adjacent-frame redundancy |
| $\delta\leq\epsilon$ and $\sigma>\epsilon$ | Soft-update historical slots using $v_t$ | A previous scene or action has recurred |
| $\delta\leq\epsilon$ and $\sigma\leq\epsilon$ | Append $v_t$ as a new slot | Novel content |

For local fusion, the paper uses attention weights and a fixed update ratio $u=0.2$:

$$ \begin{aligned} w &= u\cdot\operatorname{softmax}(\operatorname{Attn}(m_{t-1},v_t)), \\ \widetilde m_{t-1} &= m_{t-1}\left(1-\operatorname{sum}(w)\right)+w^\top v_t. \end{aligned} $$

The long-term branch reverses the attention direction: all historical slots act as queries, while the current frame supplies keys and values. It updates existing history instead of adding a second occurrence.

The best abstraction is therefore:

> Dynamic Memory is online prototype clustering and consolidation over frame features.

It merges a continuous event, refreshes a recurring prototype, and expands only for visually distinct content.

### 3. QMS: Persistent-Query Reading

Dynamic Memory decides what is written. **Query-related Memory Selection** decides what is exposed to the LLM.

QMS uses all registered user-query tokens to score the current memory slots through cross-attention. If the bank contains $N_t$ slots, it selects:

$$ \begin{aligned} k &= r_{\mathrm{qms}}N_t,\qquad r_{\mathrm{qms}}=50\%, \\ \mathcal M'_t &= \operatorname{TopK}(\mathcal M_t,R,k). \end{aligned} $$

Although the paper sometimes calls these selected items *tokens*, the score $R\in\mathbb{R}^{N_t}$ is frame-slot level; each selected slot still contains $P$ visual tokens.

QMS is a read policy, not a write or eviction policy:

- it does not modify the stored bank;
- it filters irrelevant visual history before generation;
- its selected context still grows linearly with $N_t$ because $k$ is a ratio rather than a fixed budget.

Selecting 50% achieves 56.1% average TimeRecall in the QMS ablation, compared with 40.4% when all memory is read. The benefit is not only lower cost: query-conditioned filtering also removes distracting history.

### 4. SAMA: Aligning Dynamic Memory with Training Steps

Dynamic Memory creates a training problem. A memory slot may be present at step $t$, fused or replaced later, and absent from the final bank. Packing all intermediate snapshots into one ordinary causal sequence would allow later responses to attend to expired visual memories.

**Step-Aware Memory Attention** builds a custom mask so that a token generated at step $s$ can attend to:

- the selected memory snapshot $\mathcal M'_s$ available at that step;
- causally previous user queries;
- causally previous `[Txt]` responses.

It cannot attend to:

- memory snapshots from another step;
- expired visual memory;
- previous silence `[EOS]` tokens.

SAMA is therefore a training--inference visibility alignment mechanism. It does not store or compress information by itself. An important side effect is that past assistant responses remain visible, which matters for the apparent counting behavior discussed below.

### 5. Proactive Response Trigger

At each streaming step, the model chooses between:

- `[EOS]`: nothing relevant happened, so remain silent;
- `[Txt]`: generate a proactive response.

Training combines ordinary language-model supervision with a streaming loss for this response decision.

Inference adds a hand-designed correction rule. The initial response threshold is $P([\mathrm{Txt}])>0.5$; after ten consecutive response frames it is increased by $0.1$, and after thirty no-response frames it is reset. Proactive timing is consequently produced by a learned response score plus heuristic calibration, not by Dynamic Memory alone.

## What Actually Performs the Counting?

Memento contains no explicit event boundary detector, occurrence ID, counter, or timestamp list. This creates a conflict between compression and counting:

```text
Same event across adjacent frames
    -> should be merged to avoid duplicate counting

Same action occurring again much later
    -> should remain a new occurrence for counting
```

The two cases can look semantically similar. The long-term branch may therefore soft-update the old prototype when the action recurs, erasing occurrence multiplicity instead of preserving it.

At the same time, SAMA retains previous assistant responses. If the model has already produced *this is the second time you held the phone*, the text history can act as an externalized counter and help it produce *third time* later.

The benchmark therefore demonstrates online event-triggered state tracking, but it does not isolate whether the occurrence count is stored in visual memory, reconstructed by the LLM, or copied forward through previous textual responses. A missed or redundant trigger can also shift all later ordinal answers.

## Evaluation: Recall, Quality, and False Triggers

For each ground-truth response $i$, let $W_i$ be its annotated five-second response window, and let $P$ be the set of model-generated response events.

**TimeRecall** counts a ground-truth event as detected if the model responds at least once in its window:

$$ \operatorname{TimeRecall}=\frac{1}{N}\sum_{i=1}^{N}\mathbf 1\!\left[\exists p\in P:p\in W_i\right]. $$

It measures when the model speaks, not whether the content is correct.

**Score** uses GPT-3.5-turbo-0125 to rate the responses inside each valid window from 1 to 10 and takes the maximum score when multiple responses occur.

**Redundancy** is the fraction of model responses outside every valid window:

$$ \operatorname{Redundancy}=\frac{|\{p\in P:p\notin\bigcup_iW_i\}|}{|P|}. $$

This is approximately a timestamp-level $1-\text{precision}$. It is unrelated to the visual redundancy used by Dynamic Memory. A wrong answer inside a valid window is not redundant, and repeated guesses inside the same window are not directly penalized.

The main comparison shows a strong recall--false-trigger trade-off:

| Method | TimeRecall | Score | Redundancy |
|---|---:|---:|---:|
| VideoLLM-online* | 8.9% | **5.32** | **21.3%** |
| Memento* | **47.5%** | 4.22 | 64.5% |

Memento responds to far more target events, including events beyond 25 minutes, but approximately two thirds of all its generated responses fall outside the annotated windows. The baseline's lower redundancy and higher conditional answer quality partly come from remaining silent much more often.

The runtime experiment shows the intended systems benefit: VideoLLM-online reaches 80.5 GB and runs out of memory after roughly 25 minutes, while Memento remains below 45.3 GB throughout the reported four-hour stream. This is an empirical operating range rather than a strict memory bound.

## Where Memento Sits in the Streaming Pipeline

| Method family | Stored or compressed representation |
|---|---|
| STC | ViT activations and pre-LLM visual tokens |
| **Memento** | Pre-projector visual feature slots |
| ReKV / WeaveTime | Historical LLM visual KV states |
| OASIS | External keyframes, event summaries, and QA records |

Memento is closest to a learned visual-feature memory placed between the vision encoder and the multimodal projector. It does not organize an existing KV cache and does not construct explicit textual events.

## My Takeaways

The paper's method-level contribution is cleanly divided into three parts:

1. **DM provides the write policy:** recent similarity, historical similarity, then merge/update/append.
2. **QMS provides the read policy:** retrieve the stored visual slots related to persistent user requests.
3. **SAMA makes the dynamic state trainable:** each response sees only the memory snapshot that existed at its streaming step.

The proactive benchmark and SFT data then teach the LLM how to turn these components into long-running monitoring behavior.

The main limitation is that similarity-based compression stores semantic prototypes, not event instances. This is a reasonable representation for detecting that an action or scene has returned, but it is poorly matched to exact counting, event chronology, and retrospective questions asking how many times something happened and when.

Additional limitations follow from the same design:

- **The visual bottleneck is severe.** Ten fixed tokens per frame can discard small or fine-grained evidence before memory sees it.
- **The bank is not theoretically bounded.** Every sufficiently novel frame is appended.
- **QMS has a proportional budget.** Reading the top 50% still grows with stream duration.
- **Dialogue history also grows.** The memory analysis does not eliminate the historical textual KV cache.
- **Recall is purchased with false triggers.** The reported 64.5% redundancy is too high for a reliable real-world reminder system.

The most direct research opportunity is to replace appearance-based prototype consolidation with event-aware memory. Such a system would separately represent an event prototype, its independent occurrences, and explicit state variables such as count and timestamps, while using query-aware high-resolution visual tokens when coarse $3\times3$ features are insufficient.
