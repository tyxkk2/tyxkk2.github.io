+++
date = '2026-04-22T16:20:54+08:00'
lastmod = '2026-09-03T18:00:00-05:00'
title = 'ReKV'
description = 'Streaming Video Question-Answering with In-context Video KV-Cache Retrieval.'
venue = 'ICLR 2025'
math = true
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "retrieval", "ReKV", "streaming-video-lmm"]
+++

> **Series guide.** This note audits one method in detail. Start with the
> [development-history hub]({{% relref path="/posts/StreamingVideoLMM-Development" %}})
> for the field-level map, or use the
> [pipeline survey]({{% relref path="/posts/StreamingVLM-Pipeline" %}}) to place
> ReKV's write, index, and read stages in a complete system.

Paper: [Streaming Video Question-Answering with In-context Video KV-Cache Retrieval](https://openreview.net/forum?id=8g9fs6mdEG)

Proceedings: [ICLR 2025](https://proceedings.iclr.cc/paper_files/paper/2025/hash/67a9b444cbcd647572c88194619f72d5-Abstract-Conference.html)

Preprint: [arXiv:2503.00540](https://arxiv.org/abs/2503.00540)

Code: [Becomebright/ReKV](https://github.com/Becomebright/ReKV)

ReKV was first public on arXiv on **2025-03-01** and was published at **ICLR
2025**. The paper, appendix, and official code were rechecked on **2026-09-03**.
Unless a sentence is explicitly marked as my interpretation, mechanism and
measurement claims below describe the authors' paper or released code.

## The Short Version

ReKV separates two jobs that a conventional Video-LLM repeats for every
question:

1. **Write once:** process each incoming frame causally and save its per-layer
   video KV cache.
2. **Read on demand:** after a question arrives, retrieve a small set of old KV
   blocks and use them directly as answer context.

This is a useful systems decomposition, but its memory contract is often
misread. ReKV bounds the **heavy active KV window** used while encoding and the
**query-time read set**. It preserves every historical video KV block in RAM or
on disk, so the exact archive and its retrieval index still grow with stream
duration. In the public internal-retrieval implementation, the representative-key
index itself remains on GPU and grows as well. Offloading changes the storage
tier of the full KV; it does not make total retained state—or even every part of
GPU state—length-independent.

## Setting Card

| Question | ReKV's actual setting |
| --- | --- |
| When is the question visible? | A question may arrive at any stream time. Earlier frames were already encoded without that future question, and frames after its timestamp are excluded. |
| What is written? | Exact per-layer video K/V tensors, plus either external frame embeddings or per-layer averaged keys used as retrieval representatives. |
| What remains active while writing? | Initial prompt state and a configured recent sliding window; older full video KV is moved out of the active attention path, while internal-retrieval representatives still accumulate on GPU in the public code. |
| What is read for one question? | A configured top-$r$ set of frames or blocks. Internal retrieval chooses that set separately at each layer; external retrieval shares supplied frame/block IDs across layers. In the main LLaVA-OneVision setup, $r=64$ and block size $b=1$. |
| What grows with time? | The exact historical KV archive and the query-facing representatives. Both add entries as more frames arrive. |
| What evidence is recoverable? | Stored model-specific KV for sampled frames, not the original pixels. Information omitted by frame sampling or altered by local-window encoding is not restored. |
| Is training required? | No additional training is required for the ReKV integration evaluated in the paper. |

This is the **unknown-future-query** regime for memory writing: the system
cannot use a later question to decide which old frame state to save. ReKV avoids
that decision by saving all of it and postponing selection until the question is
known.

## Write, Index, Read, and Answer

```text
incoming frame chunk
    -> causal Video-LLM prefill with a recent local window
    -> exact per-layer video KV
    -> recent KV stays active on GPU
    -> older KV moves to RAM or disk            [archive]
    -> one representative per frame/block       [index]

question at time t
    -> retrieve only from frames observed by t  [read]
    -> load selected KV onto the QA GPU
    -> reconstruct a compact consecutive cache
    -> answer without re-encoding the video
```

The four labels matter because each has a different budget. A small read does
not imply a small archive, and a bounded write-time attention window does not
imply bounded retained history.

### 1. Write: causal prefill with a sliding window

For a new chunk $\mathbf{X}$, ReKV lets the new queries attend to the latest
$l_L$ cached tokens $\mathbf{L}$ rather than the entire prefix:

$$
\mathbf{O}=\operatorname{Attn}\!\left(
\mathbf{W_Q}\mathbf{X},
[\mathbf{L}_k,\mathbf{W_K}\mathbf{X}],
[\mathbf{L}_v,\mathbf{W_V}\mathbf{X}]
\right).
$$

The important correction is that two costs behave differently:

- with a fixed local window, attention for each new chunk does not revisit the
  full historical prefix, avoiding full-prefix quadratic attention during
  streaming prefill;
- every produced video K/V block is nevertheless retained, so archive capacity
  grows linearly with the number of encoded frames.

Each stored block is therefore richer than an isolated visual embedding: it was
produced by the Video-LLM while attending to nearby prior context. It is not,
however, a lossless copy of the video. The paper's main experiments sample at
0.5 FPS, and the block only receives the configured local context.

### 2. Index: external or internal representatives

**External retrieval** uses a CLIP-like encoder—SigLIP-SO400M in the main
experiments—to map each frame and the question into one embedding space. Frames
can be grouped into fixed blocks by averaging their representations. The same
selected frame/block IDs then address the corresponding video KV.

**Internal retrieval** reuses the Video-LLM. At each transformer layer, it
averages a frame's key vectors, concatenates attention-head dimensions, and
compares that representative with the averaged question-query vector. The paper
defines cosine similarity, but the released internal-retrieval helper performs
an unnormalized query-key dot product; that is a paper/code discrepancy rather
than two interchangeable descriptions. Because ranking happens per layer,
different layers may select different blocks.

Neither index is constant-size. External retrieval accumulates frame/block
embeddings, while internal retrieval accumulates representative keys at every
layer. These are much smaller than full K/V tensors, but still $O(T)$ in the
number of indexed stream units. Internal retrieval also scans the historical
representatives at each layer for every question, so its ranking work grows with
the indexed history even when the loaded top-$r$ set stays fixed.

### 3. Read: a bounded query-conditioned working set

After the question arrives, ReKV ranks the eligible historical blocks and loads
only the top-$r$ cache entries onto the answer process's GPU. The released
**internal-retrieval** path sorts its selected block IDs before loading, so those
blocks keep chronological order even though the gaps between them disappear.
The external path accepts precomputed IDs and loads them in the supplied order;
it does not add the same sort itself.

This creates the method's central trade-off:

- increasing $r$ can recover more relevant evidence;
- it also increases transfer, attention, and answer latency;
- irrelevant retrieved blocks can compete with the useful current or distant
  evidence.

The paper's ablations report that accuracy generally improves as more frames
are retrieved, but can plateau when additional context introduces distraction.
Fixed-size temporal blocks can also split a coherent event or force unrelated
moments to be retrieved together.

### 4. Answer: reuse model state rather than pixels

The selected historical K/V tensors become the prefix for the question and
generated answer:

$$
\mathbf{O}=\operatorname{Attn}\!\left(
\mathbf{W_Q}\mathbf{X},
[\mathbf{R}_k,\mathbf{W_K}\mathbf{X}],
[\mathbf{R}_v,\mathbf{W_V}\mathbf{X}]
\right).
$$

The answer worker therefore avoids running the vision encoder and Video-LLM
prefill over the old frames again. The cache is model- and layer-specific,
though: it cannot be treated as a portable visual database independent of the
backbone that produced it.

## What ReKV Actually Bounds

Let $T$ be the number of encoded frames, $M$ the number of visual tokens per
frame, $L$ the number of transformer layers, and $d_{kv}$ the total stored KV
width per token. Ignoring fixed model weights, the exact archive is
$\Theta(TMLd_{kv})$.

| Resource | Main contents | Bound as the stream grows | Practical consequence |
| --- | --- | --- | --- |
| Active write state | Initial tokens and recent local K/V window | **Heavy-KV bound** for fixed window size | Streaming prefill avoids attending to the complete history; this row excludes the growing retrieval index |
| Active read state | Retrieved top-$r$ K/V, question, and generated tokens | **Configured video-read bound** for fixed $r$ | QA GPU use need not scale with all prior frames |
| Query-facing index | External embeddings or per-layer representative keys | **Grows with $T$** | Ranking searches an expanding address space; public internal retrieval keeps these keys on GPU |
| Exact CPU/disk archive | Full per-layer K/V for every encoded frame | **Grows with $T$** | The paper permits RAM or disk; released offload code implements host-memory tensors rather than a disk backend |
| QA worker models | One Video-LLM copy per answer process in the proposed serving design | **Fixed per worker, multiplied by pool size** | Higher question concurrency trades additional model memory for parallel answers |
| Raw frame archive | Original pixels or compressed video | **Not required or budgeted by the conceptual method** | The reference benchmark loader preloads sampled frames in host memory, so that evaluator is not evidence of bounded raw-input buffering |

For FP16, the paper gives the archive-size calculation as

$$
2\;[K,V]\times L\times T\times M\times H\times D\times 2\;\text{bytes}.
$$

With LLaVA-OneVision-7B, $L=28$, $M=196$, $H=4$, $D=128$, and 1,800 frames
from one hour at 0.5 FPS, this is **18.8 GB per hour**. That number is an
author-reported theoretical calculation matched by the paper's controlled
measurement. It is evidence of linear archive growth, not bounded total memory.

## Position Re-Indexing Is Not Reconstruction

ReKV's streaming encoder follows LM-Infinite-style position handling: RoPE is
used normally in the local window, with a distance ceiling for more distant
initial tokens. Question-time reconstruction makes a second, more consequential
choice.

The method does **not** preserve the original positions or elapsed gaps of
retrieved historical KV. It presents the selected blocks as ordinary consecutive
tokens and applies standard RoPE in that compact sequence. Internal retrieval
sorts its selected IDs chronologically first; external retrieval relies on its
caller-supplied order. The paper reports that consecutive standard RoPE worked
better than assigning every retrieved token the same static position.

When block order is chronological, this preserves that order but collapses
temporal distance. Two blocks that were seconds apart and two that were hours
apart can become adjacent in the answer cache. The result is a pragmatic
compatibility layer for the evaluated RoPE backbones, not a general solution for
every newer Video-LLM position scheme. Architectures that jointly encode spatial
grids, frame time, or multiple position axes need separate validation before the
same cache-splicing rule can be assumed safe.

## Evaluation Context

The main experiments integrate ReKV with **LLaVA-OneVision-0.5B and 7B**, use
FP16 on **NVIDIA A100 80 GB** GPUs, encode at **0.5 FPS**, keep a **15K-token
local window**, and default to **64 retrieved frames** for internal retrieval.
The paper covers MLVU-dev multiple choice, QAEgo4D-test multiple choice,
EgoSchema, ActivityNet-QA, RVS-Ego, RVS-Movie, and CGBench multiple choice. RVS
accuracy and score use a GPT-3.5-turbo-0613 judge, so those values are
judge-dependent.

The following reproduces the authors' internal-retrieval rows, not a cross-paper
leaderboard. The RVS-Ego and RVS-Movie answer metrics are full-benchmark results.
Only the four systems columns use the separate controlled efficiency setup: one
pre-extracted one-hour 1080p RVS-Ego video, 1,800 sampled frames, 100 scattered
questions padded to 64 tokens, and answers fixed to 128 tokens.

| ReKV configuration | RVS-Ego Acc. / Score | RVS-Movie Acc. / Score | Video encoding | Question-to-answer latency | Peak GPU | KV offload rate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| LLaVA-OV-7B, internal retrieval | 63.7 / 4.0 | 54.4 / 3.6 | 11 FPS | 3.3 s | 38 GB | 18.8 GB/h |
| LLaVA-OV-0.5B, internal retrieval | 54.7 / 3.9 | 44.6 / 3.4 | 17 FPS | 1.6 s | 19 GB | 4.0 GB/h |

The throughput column supports the narrower claim that sampled-frame encoding
can outrun the evaluated 0.5-FPS input. The paper's separate Figure 1 reports
stable latency and GPU memory as frames increase for LLaVA-OV-7B on an **H800
80 GB**, whereas the main experiments and table above use **A100 80 GB**. These
finite controlled measurements do not establish bounded lifetime storage, disk
behavior over indefinite streams, or tail latency under arbitrary concurrent
query load.

## Relation to Later Memory Policies

ReKV supplies a useful reference point because it postpones irreversible
selection:

- [InfiniPot-V]({{% relref path="/posts/InfiniPotV" %}}) and
  [StreamMem]({{% relref path="/posts/StreamMem" %}}) instead compress during
  writing under a fixed model-state budget, before the real future question is
  known.
- [LiveVLM]({{% relref path="/posts/LiveVLM" %}}) keeps exact recent KV but
  compresses older state; its official repository explicitly says the code is
  based on ReKV, supporting a direct code-reuse relation.
- [MuKV]({{% relref path="/posts/MuKV" %}}) expands query-time access with
  multiple KV granularities and hierarchical reranking, while its reported
  memory budget is not a lifetime cap on all stored history.
- [WeaveTime]({{% relref path="/posts/WeaveTime" %}}) retains a growing ReKV-style
  historical KV substrate and changes the read policy with temporal training,
  uncertainty gating, and coarse-to-fine retrieval.

The other broad branch—layer-wise caches, recurrent summaries, and fixed
prototypes—accepts that discarded detail cannot be recovered. Those methods
ask a harder write-time question: which representation should survive an
unknown future query?

## My Takeaways

ReKV's lasting contribution is less a particular cosine-similarity formula than
the clean separation of **causal video production** from **question-time
consumption**. It makes model state reusable across questions and exposes
retrieval recall as a measurable intermediate failure instead of repeatedly
sampling raw video.

Its systems contract is equally instructive. There are at least three different
objects to optimize:

1. the **write policy**, which determines what state enters memory;
2. the **read policy**, which chooses the small context used for one question;
3. the **archive policy**, which determines what remains recoverable over the
   lifetime of the stream.

ReKV bounds the first stage's active attention and the second stage's read set,
but chooses a loss-avoiding, growing policy for the third. Later fixed-state
methods change that third contract rather than simply making ReKV's archive
smaller for free.

## Limitations and Open Questions

- **Total historical state is unbounded.** Exact K/V and retrieval
  representatives grow with the number of encoded frames.
- **Offloading has a long-horizon systems cost.** RAM/disk capacity, search,
  transfer, process concurrency, and tail latency are not eliminated by stable
  GPU memory.
- **Retrieval uses fixed granularity and budget.** A constant block can cut
  events, and a constant $r$ cannot adapt to question difficulty or evidence
  span.
- **Position gaps are collapsed.** Chronological order survives, but original
  temporal distance does not.
- **Stored KV is not raw evidence.** Frame sampling, local-window
  contextualization, and model-specific projection have already transformed
  the source.
- **Current perception and distant recall can interfere.** Loading more old KV
  can improve recall while adding distractors and attention cost; a read policy
  should test evidence sufficiency, not only similarity.
- **The benchmark surface was still small.** The paper itself identifies the
  limited number and temporal precision of StreamingVQA benchmarks as an open
  problem.

The next research question is therefore not merely how to retain fewer tokens.
It is whether a bounded state can preserve the future query-to-evidence ranking
and recall behavior that ReKV's full historical index would have produced—and
whether it can do so under matched write, read, position, and systems budgets.
