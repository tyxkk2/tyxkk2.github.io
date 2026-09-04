+++
date = '2026-09-03T17:30:00-05:00'
title = 'From ReKV to Retrieval-Behavior Preservation: What Should a Streaming VLM Remember?'
description = 'A resource-aware comparison of growing KV archives, bounded online state, and the evidence behavior that future-query memory should preserve.'
categories = ["AI", "VLM", "KV cache", "summary"]
tags = ["survey", "Video-LLM", "streaming", "memory", "retrieval", "KV cache", "streaming-video-lmm"]
math = true
+++

> **Series guide.** This article is the bounded-memory thematic survey. Start
> with the [development-history hub]({{% relref path="/posts/StreamingVideoLMM-Development" %}})
> for the six-path map, read the [ReKV note]({{% relref path="/posts/ReKV" %}})
> for the exact-archive baseline, and use the
> [pipeline survey]({{% relref path="/posts/StreamingVLM-Pipeline" %}}) for the
> stage-by-stage architecture.

A streaming Video-LMM has to make decisions before it knows which detail a
future user will care about. ReKV avoids write-time eviction or compression by
storing every generated visual KV block, then retrieves a small subset after the
question is known. This does not recover unsampled pixels or information absent
from those model states. Fixed-state methods make the opposite trade: they
evict, merge, or summarize history during the stream so that memory no longer
grows with video duration.

That sounds like one progression from large to small memory. It is actually a
change in the scientific contract. ReKV asks how to make a **small read over a
large recoverable exact-KV archive**. Bounded-state methods ask which evidence can be
discarded **before an unknown question exists**. Their success cannot be judged
by the same memory number, because write state, retrieval index, archive, and
answer-time context are different resources.

This article separates those resources, compares the retention priors used by
InfiniPot-V, StreamMem, LiveVLM v2, HERMES, and ProtoKV, and ends with a research
proposal: evaluate whether a bounded state preserves the *future
query-to-evidence behavior* of a full-history oracle.

Sources and publication status were checked against first-party records on
**2026-09-03**. [ReKV](https://proceedings.iclr.cc/paper_files/paper/2025/hash/67a9b444cbcd647572c88194619f72d5-Abstract-Conference.html),
[InfiniPot-V](https://proceedings.neurips.cc/paper_files/paper/2025/hash/caef5f5e658aa1f7565f063a2cd99726-Abstract-Conference.html),
and [HERMES](https://aclanthology.org/2026.acl-long.381/) have formal
proceedings records. [LiveVLM v2](https://arxiv.org/abs/2505.15269) is the
substantially revised [DAC 2026](https://63dac.conference-program.com/presentation/?id=RESEARCH670&sess=sess314)
version, not its 2025 v1 mechanism. [StreamMem](https://arxiv.org/abs/2508.15717)
is an arXiv paper whose [author page](https://zhanglizhu.github.io/) records CVPR
2026 VidLLMs workshop acceptance. [ProtoKV](https://arxiv.org/abs/2606.26762)
appears on the official [ICML 2026 accepted-paper list](https://icml.cc/Downloads/2026),
while its [public code repository](https://github.com/kaist-ina/ProtoKV) remains
a release-in-progress placeholder. Recent acceptance status and implementation
maturity are therefore not treated as equivalent to an established, reproduced
result.

| Method | First public | Version used here | Status at the cutoff |
| --- | --- | --- | --- |
| ReKV | 2025-03-01 | arXiv v1 / ICLR version | ICLR 2025, published |
| LiveVLM | 2025-05-21 | arXiv v2, 2026-04-23; materially different from v1 | DAC 2026, accepted |
| InfiniPot-V | 2025-06-18 | arXiv v2 / proceedings version, 2025-10-24 | NeurIPS 2025, published |
| StreamMem | 2025-08-21 | arXiv v1 | CVPR 2026 VidLLMs workshop, author-reported accepted |
| HERMES | 2026-01-21 | arXiv v4 / ACL version, 2026-05-07 | ACL 2026 Long, published |
| ProtoKV | 2026-06-25 | arXiv v1 | ICML 2026, accepted; code release incomplete |

## Begin with the Actual Query Contract

All six primary methods process earlier frames before the eventual question is
available. A question arriving at time $t$ may use the causal prefix
$V_{\leq t}$, but it cannot retroactively guide decisions already made at time
$t-d$.

This is stricter than either of the following:

- **offline query-aware compression**, where the whole video and question can be
  inspected together;
- **persistent-query monitoring**, where a registered request guides every
  future memory update.

The distinction matters because a query-aware top-$k$ selector can use the
actual question to estimate relevance, whereas an unknown-future-query memory
must commit to retention before that signal exists. It may use visual
redundancy, generic prompts, attention patterns, or learned structure, but not
the future question itself.

HERMES needs one extra qualification. Its fixed local/global guidance prompts
are pseudo-queries rather than the actual future question; in a multi-turn
stream, they may also include the previous conversation. The next unseen
question is still unavailable, but later retention can be conditioned on past
interaction.

## Write, Read, and Archive Are Three Policies

The word *memory* often hides three independent decisions:

1. **Write policy:** what representation is produced, retained, merged, or
   evicted as a new stream unit arrives?
2. **Read policy:** which part of retained state enters the context for one
   question?
3. **Archive policy:** what historical evidence remains recoverable after the
   active window moves on?

ReKV and fixed-state methods occupy different points because they answer the
third question differently:

```text
ReKV
  write: keep exact generated KV
  read:  retrieve a fixed top-r subset
  store: exact archive + index grow with time

bounded-state methods
  write: evict, merge, or summarize under a fixed model-state budget
  read:  use all or part of that fixed state
  store: no complete historical KV recovery path
```

Offloading, compression, and retrieval are not synonyms. Offloading moves state
between devices. Compression changes what state represents. Retrieval changes
which retained state a request activates.

## Resource Accounting

The table below charges each resource separately. *Model-state bounded* means
that persistent **video-derived model state** has a configured,
length-independent upper bound. It does not mean every intermediate tensor has
the same shape, nor does it automatically bound dialogue KV, raw video,
application logs, temporary compression tensors, or numerical counter width.

| Method | Active/persistent video model state | Query index | Historical model-state archive | Per-question video read | Honest contract |
| --- | --- | --- | --- | --- | --- |
| [ReKV]({{% relref path="/posts/ReKV" %}}) | Initial state, recent heavy KV, and the GPU LRU for full blocks have configured caps | One external vector or one per-layer representative per frame/block, $O(T)$; the public internal index grows on GPU | Exact per-layer historical KV, $O(T)$; paper allows disk, public code visibly implements host-memory offload | Fixed top-$r$ blocks; internal retrieval selects per layer | **Active-heavy-KV bounded / archive and index grow** |
| [InfiniPot-V]({{% relref path="/posts/InfiniPotV" %}}) | Cache grows from compressed target $\lvert C\rvert$ to threshold $\lvert M\rvert$, then is compressed again | None beyond retained cache | None described | Current retained cache | **Model-state bounded**, with temporary compression work |
| [StreamMem]({{% relref path="/posts/StreamMem" %}}) | Selected visual KV plus frame prototypes under a steady-state budget; an update can temporarily overshoot before compression | None beyond retained cache | None described | Current retained cache | **Model-state bounded** |
| [LiveVLM v2]({{% relref path="/posts/LiveVLM" %}}) | Exact recent KV plus VSB-compressed long-term KV under a fixed cache budget | No separate persistent index; bounded page means are computed from the fixed cache at read time | No complete old-KV archive in v2 | Query-selected pages plus exact recent KV | **Model-state bounded; read is a subset of fixed state** |
| [HERMES](https://aclanthology.org/2026.acl-long.381/) | Fixed per-layer token budgets plus constant summary overhead | None | None described | Directly uses retained layer-wise KV; no historical retrieval | **Model-state bounded** |
| [ProtoKV](https://arxiv.org/abs/2606.26762) | Fixed exact near ring plus fixed far prototype bank, histograms, and metadata | None separate from prototypes | No per-token far-history archive | Near KV plus $K_{\max}S$ synthesized pseudo-KV | **Model-state bounded summary state** |

Two subtleties follow from this accounting.

None of the fixed-state rows establishes a bound on raw-video retention,
application logs, or dialogue history; those stores are outside their reported
video-KV budgets. Conversely, ReKV's conceptual method does not require a raw
frame archive, although its released benchmark evaluator preloads sampled frames
into a host-side array. Implementation buffers and algorithmic archives must not
be silently treated as the same object.

First, a fixed answer context is not proof of fixed total storage. ReKV can load
64 frames for every question while its archive adds a new set of full per-layer
KV tensors for every sampled frame. In its LLaVA-OneVision-7B FP16 setup, the
authors calculate **18.8 GB of new KV per hour at 0.5 FPS**. That is a growth
rate, not a capacity limit; the complete protocol and hardware context are in
the [focused ReKV note]({{% relref path="/posts/ReKV" %}}).

Second, a fixed compressed state is not lossless. InfiniPot-V, StreamMem,
LiveVLM v2, HERMES, and ProtoKV have no complete old-KV archive from which a
discarded detail can be retrieved later. Their model-state contract is stronger,
but their evidence contract is irreversible.

### The active-bounded/archive-growing bridge

Several related systems compress or gate reads without crossing into fixed
lifetime state:

| Method | Query visibility | Active/read bound | Growing archive and index | Position caveat |
| --- | --- | --- | --- | --- |
| [StreamKV]({{% relref path="/posts/StreamKV" %}}) ([AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/37305)) | Real question unknown while writing; a fixed guidance prompt supplies only a generic prior | Local window and query-time top-$k$ load | Compressed frame KV, one permanent summary KV per segment, and representatives | Retrieved blocks are repacked at consecutive relative positions, retaining order but not original gaps |
| [MuKV]({{% relref path="/posts/MuKV" %}}) ([CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xiao_MuKV_Multi-Grained_KV_Cache_Compression_for_Long_Streaming_Video_Question-Answering_CVPR_2026_paper.html)) | Real question unknown during multi-granular writing; it first enters at retrieval | Fixed 64-block answer read in the reported default | Patch-, frame-, and segment-level KV, representatives, and time metadata accumulate with segments | Timestamps help retrieval, but the paper does not establish reconstruction of original RoPE distances across concatenated blocks |
| [WeaveTime]({{% relref path="/posts/WeaveTime" %}}) ([CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.html)) | Real question unknown during ReKV-style writing; it later controls the gate and retrieval | Recent first pass; entropy gates a capped historical recall | Exact historical KV, coarse representatives, and detailed retrieval keys | SOPE teaches temporal-order behavior but does not establish restoration of the retrieved blocks' original positional gaps |

MuKV's reported memory-token count is measured **per 300 frames**; its paper and
public implementation do not define a lifetime eviction rule over all segments.
WeaveTime's PCDF-Cache decides *whether and how much to read*, not *how much to
store*. StreamKV's compression ratio reduces the slope, but each new segment
still contributes retained state. All three are best described as
**active-bounded/archive-grows**.

## What Each Bounded Method Chooses to Preserve

A future query is unavailable, so every writer substitutes a proxy objective.
The methods differ less by whether they compress than by what they treat as a
reasonable forecast of future evidence utility. The final column below records
mechanism-level audit inferences unless a sentence explicitly attributes a
finding to the paper; it should not be read as a list of experimentally proven
failures.

| Method | Write-time retention prior | Read policy after the question arrives | Likely irreversible failure / audit inference |
| --- | --- | --- | --- |
| InfiniPot-V | Keep a full recent window; use key-space temporal redundancy (TaR) and value norm (VaN), with layer-adaptive pooling, when cache reaches a threshold | Answer directly from the compressed cache | Camera motion can defeat same-location redundancy; high value norm need not predict a rare future question |
| StreamMem | Filter similar input frames; use attention from chat-template tokens to select visual KV; add attention-weighted frame prototypes | Answer directly from the compact cache | A generic assistant-start proxy can miss query-specific multi-detail evidence; merges lose exact count and order |
| LiveVLM v2 | Protect exact recent KV; use vision-to-vision attention and position buckets in Vision Sink Bucketing (VSB) for old tokens | Position-agnostic KV Retrieval (PaR) scores pages inside the fixed cache and activates a subset | Deleted details are unrecoverable; a page mean can conceal one relevant token |
| HERMES | Shallow layers favor recency; middle layers mix recency and pseudo-query attention; deep layers use guidance-prompt attention, which the paper interprets as emphasizing frame-level anchors; scores are smoothed across layers and evicted state is summarized | No query-time historical retrieval; answer from retained per-layer state | The cognitive labels are an author interpretation; generic guidance, top-$k$, and summaries can erase rare evidence |
| ProtoKV | Keep an exact near ring; absorb evicted tokens into fixed prototypes using key similarity, spatial continuity, and recency; retain centers, mass, and residual histograms | Synthesize a fixed number of pseudo-KV per prototype, then attend jointly with exact near KV; no query-conditioned retrieval | Similar repeated episodes can merge, so mass is not an event counter and within-prototype order is lost |

These objectives are **conceptually adjacent**, not interchangeable estimates
of one ground-truth quantity. TaR asks whether a spatial patch repeats. VaN asks
whether a value vector is large. A chat template asks what generic content the
model attends to before an assistant response. VSB combines learned attention
with temporal coverage. HERMES assumes different layers benefit from different
retention biases. ProtoKV changes the representation from instances to running
summary statistics.

Among the five fixed-state methods above, the
[official LiveVLM repository](https://github.com/sjtu-zhao-lab/LiveVLM) gives
direct implementation-lineage evidence: it states that the code is based on
LLaVA-NeXT and ReKV. That supports **direct implementation reuse**, not a claim
that every LiveVLM idea or every other bounded method descends technically from
ReKV. Separately, in the archive-growing branch, the WeaveTime paper and
[repository](https://github.com/zhangyl4/weavetime) explicitly reuse the ReKV
codebase for historical KV memory. No equivalent direct-code claim is made here
for StreamKV or MuKV.

## Recent Perception and Distant Recall Compete

Why do almost all of these systems protect a recent window? Current perception
and distant recall impose different requirements.

Recent frames need high spatial detail, stable local motion, and low latency.
Distant history needs addressability and enough preserved evidence to answer a
question that did not yet exist. If both are placed in one undifferentiated
attention pool, three things happen:

1. old tokens increase prefill and attention cost;
2. numerous historical distractors compete with the current scene;
3. aggressive global compression can spend capacity on frequent old patterns
   while erasing a small but decisive recent object—or the reverse.

ReKV avoids write-time competition by storing history outside the active heavy
KV window, then creates read-time competition among retrieved blocks. Its own
ablation reports that increasing retrieved frames can help and then plateau as
irrelevant context accumulates. LiveVLM v2 narrows the read again inside fixed
state. WeaveTime first tries the present and opens historical retrieval only
when a language-model uncertainty heuristic fires. Fixed-state methods instead
reserve recent exact capacity and represent old history at lower bandwidth.

This suggests a two-channel design principle, not a theorem:

```text
high-fidelity recent channel
    +
lower-bandwidth addressable far channel
    +
an evidence-sufficiency decision about whether the far channel is needed
```

The difficult part is the third line. Predictive entropy can reflect linguistic
uncertainty rather than missing visual evidence, and a model can be confidently
wrong about an old event. Likewise, always injecting far summaries may be cheap
but can still interfere with current perception.

## Position Is Part of the Memory Contract

KV cannot be removed and concatenated as if positions would repair themselves.
Some implementations correct keys that already contain a rotary transform;
others, including ReKV, retain projected pre-RoPE keys and apply new compact
positions when reading. Either design needs an explicit policy for the indices,
gaps, and axes that survive.

| Method | Position policy | Information no longer represented exactly |
| --- | --- | --- |
| ReKV | Internal retrieval sorts selected IDs chronologically; external retrieval uses caller-supplied order. Both pack the supplied blocks consecutively and apply standard RoPE in the compact answer context | Original gaps and elapsed time between retrieved blocks; external order is not normalized by the cache manager |
| InfiniPot-V | Cache pre-positional state for streaming use and reassign positions within a finite range | Original temporal/spatial coordinates; the paper identifies richer 3D position preservation as open |
| StreamMem | Extend the usable range with backbone-specific YaRN scaling rather than repeatedly left-compacting all retained KV | Scaling is model-dependent; retained tokens are still a selected, lossy history |
| LiveVLM v2 | Decouple position from page-retrieval scoring, then restore positional encoding for inference | Page selection is position-agnostic, but full original temporal geometry is not thereby guaranteed |
| HERMES | Left-compact retained tokens with rotary correction; use lazy re-indexing online and eager re-indexing offline, including 1D and 3D variants | Original absolute indices after compaction |
| StreamKV | Repack retrieved blocks at consecutive relative positions | Selected order can remain, but original temporal gaps disappear |
| MuKV | Store timestamps as retrieval metadata; concatenate KV produced in separate multi-granular prefills | The paper does not establish reconstruction of original cross-block RoPE distances |
| WeaveTime | Use SOPE timestamp/order supervision before ReKV-style historical reads | Better temporal-order behavior does not establish restoration of original positional gaps; this is an audit conclusion, not an author-reported reconstruction result |
| ProtoKV | Preserve exact near positions; give all pseudo-tokens from one prototype the most recently absorbed source position $\tau_k$ | Times and order of the many older tokens merged inside that prototype |

The policies are meaningful engineering choices, but none makes compression
free. Preserving order, temporal distance, spatial coordinates, and standard
attention compatibility simultaneously remains difficult when old token
instances have been deleted.

## How the Evaluation Evidence Differs

I do not combine accuracy numbers from these papers. The backbones, sampling
rates, cache budgets, frame grouping, judge versions, question timing, and
comparison constraints differ. A valid comparison needs matched write and read
budgets as well as a matched model.

The evaluation evidence also answers different questions:

- **ReKV** evaluates relevant-frame recall on QAEgo4D as an intermediate signal
  and reports controlled RVS serving measurements. This makes retrieval failure
  more visible, but it does not test a fixed total state.
- **InfiniPot-V, StreamMem, and LiveVLM v2** test bounded caches on combinations
  of RVS, OVO-Bench, StreamingBench, and offline long-video benchmarks. Their
  results support the authors' configured-budget claims, but they do not provide
  a matched sweep over how long decisive evidence must survive after it leaves
  the recent window.
- **HERMES** evaluates direct answer-time cache reuse on StreamingBench real-time,
  OVO real-time/backward, RVS, and offline tasks across several backbones. It has
  no explicit delayed-query sweep, and its sensory/working/long-term layer names
  remain an interpretation of observed attention patterns.
- **ProtoKV** continues ingesting the stream after a dataset question's original
  timestamp $t_0$, then asks that question at $t_0+\Delta$ for delays up to 30
  minutes. It uses the intersection of examples valid at every delay: three
  retrospective RVS categories—whether-something-happened, order-judging, and
  what-event-order—and OVO-Bench backward-tracing. StreamingBench real-time is
  excluded because later video may change its answer. The authors interpret the
  extra post-query updates as a proxy for post-evidence update pressure, but the
  protocol does not know the last decisive-evidence timestamp. It is therefore a
  controlled query-delay intervention, not an exact evidence-age measurement.

ProtoKV's protocol is the closest in this group to asking whether fixed state
survives delayed queries, but it still measures answer behavior after lossy
summary updates. It does not compare the bounded state's evidence ranking with a
full-history index. That missing counterfactual motivates the next section.

## Open Hypothesis: Preserve Future Query-to-Evidence Behavior

The following is **my proposed evaluation target**, not an established field
consensus:

> Given one causal pass over a video, an unknown future query distribution, and
> a fixed online state budget, preserve as much as possible of the full-history
> oracle's future query-to-evidence behavior.

Let $I_T$ be an index over all legal evidence observed by time $T$, and let
$C_T$ be a bounded state produced from the same stream without seeing future
queries. For a held-out query $q$, compare the evidence behavior of
$R(q,I_T)$ and $R(q,C_T)$ before comparing final answers.

The target should include at least:

- top-$k$ evidence membership and Recall@$k$;
- ranking agreement or NDCG under matched candidates;
- temporal localization and event-boundary overlap;
- margin preservation near the retrieval cutoff;
- answer quality with retrieved evidence fixed, separating retrieval from
  generation;
- online update time, index memory, archive bytes, I/O, and tail query latency.

A useful experiment would hold constant the backbone, FPS, recent exact window,
question-arrival protocol, answer context length, and judge. It would then
compare:

1. a full-history exact-KV or evidence oracle;
2. recent-only state;
3. independent-score retention;
4. summary/prototype state;
5. the proposed bounded method.

The oracle is not a deployable target; it is a diagnostic reference. If a
method improves generic feature coverage but fails to preserve the oracle's
evidence ranking for unseen questions, then “coverage” has not established the
stronger claim. If retrieval behavior survives but updates or tail latency fall
behind a live producer, the streaming system claim still fails.

This formulation also prevents a bookkeeping shortcut. A bounded vector index
with pointers into an unbounded raw-video store is not bounded total storage.
The pointer bytes and the evidence bytes it addresses must be reported
separately.

## My Takeaways

1. **ReKV is the clean exact-archive baseline.** It bounds active heavy KV and
   per-question reads, not the full historical index or archive.
2. **Fixed state changes the failure mode.** InfiniPot-V, StreamMem, LiveVLM v2,
   HERMES, and ProtoKV stop lifetime KV growth by making irreversible write-time
   decisions.
3. **There is no neutral query-agnostic importance score.** Redundancy, value
   norm, generic-prompt attention, visual attention, layer depth, and prototype
   assignment preserve different kinds of evidence.
4. **Recent perception deserves protected capacity.** Far history should enter
   at lower bandwidth and only under an explicit evidence-sufficiency policy,
   but today's routers are still proxies.
5. **Position handling belongs in every method card.** Compact state can retain
   order while losing distance, or retain a recency anchor while losing episode
   structure.
6. **Answer accuracy is too late in the pipeline.** Evidence-level agreement
   with a full-history oracle would make retention failures more falsifiable.

## Limitations of This Review

- This is a source and implementation audit, not an independent reproduction.
  Reported experimental conclusions remain author-reported.
- The primary comparison is about video-derived KV state. Structured event
  memory, caption stores, raw-video RAG, and proactive scheduling have different
  carriers and are treated elsewhere in this series.
- Public repositories do not always implement every paper-level storage tier or
  expose a complete serving stack. Resource claims here use the narrower of the
  visible implementation and the documented design.
- ProtoKV is recent and its public code is not yet a complete reproduction path;
  its delayed-query findings should be treated as frontier evidence.
- Fixed-shape state can still have numerical or systems limits, including
  counters, temporary update buffers, dialogue state, and producer backlogs
  that the paper's main cache budget does not measure.

## Open Questions

- Which held-out future-query distribution is broad enough to test reusable
  memory without leaking evaluation questions into the retention policy?
- Can a bounded state preserve rare OCR, exact counts, failed actions, and
  repeated-event boundaries instead of only dominant semantics?
- How should evidence necessity be estimated when language-model confidence is
  poorly calibrated to missing visual history?
- Can position policies preserve temporal distance and multi-axis spatial
  structure without reintroducing a growing cache?
- What is the right hybrid between exact recent KV, compact far summaries, and
  sparse verifiable source backlinks—and how should every byte be charged?
- Can matched systems experiments separate memory architecture from streaming
  post-training, recent-window quality, and asynchronous runtime design?

The useful next step is not to declare one retention heuristic the winner. It is
to make the lost behavior observable: what the full history would have retrieved,
what the bounded state retrieves instead, which evidence disappeared during
writing, and whether the complete system still keeps pace with the stream.
