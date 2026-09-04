+++
date = '2026-09-02T17:11:52-05:00'
lastmod = '2026-09-03T19:28:00-05:00'
title = 'Streaming Video-LMM Is Not One SOTA Line: Six Development Paths from 2023 to 2026'
description = 'Six development paths from long-video compression to bounded memory, proactive interaction, and system-level streaming evaluation.'
categories = ["AI", "VLM", "summary"]
tags = ["survey", "Video-LLM", "streaming", "long video", "memory", "retrieval", "benchmark", "streaming-video-lmm"]
math = true
decor_image = "images/bg4.png"
+++

> **Series guide.** This is the development-history hub for my streaming
> Video-LMM notes. For a stage-by-stage systems view, see the
> [pipeline survey]({{% relref path="/posts/StreamingVLM-Pipeline" %}}). For dataset
> and protocol details, see the
> [benchmark index]({{% relref path="/posts/StreamingVideoBenchmarks" %}}). The
> complete reading map is [at the end of this article](#series-map).

Calling a model *streaming* no longer identifies one technical problem. One
paper may process a causal video prefix but retain every historical KV block.
Another may keep a fixed cache but permanently forget old evidence. A proactive
assistant may know the user's request before the stream begins, while a delayed
question-answering system must decide what to preserve before any question is
known. A benchmark may measure the age of remembered evidence without measuring
whether the implementation can keep up with a live camera.

This post therefore does not arrange papers as a single SOTA ladder. It follows
six intersecting development paths from 2023 to 2026 and asks how the *problem
definition* changed along each one. Before the timeline, four distinctions are
needed: when the query becomes visible, which clock a latency number belongs to,
which resource is actually bounded, and what form of evidence can still be
recovered after compression.

Sources, versions, and publication status in this overview were checked against
first-party records on **2026-09-02**. Formal proceedings are preferred when
available. At that cutoff, MovieChat+, Flash-VStream 2024, Dispider, SAVEMem,
CoRDS, NovaCov, CARVE/V-RAGBench, FOLIO, ObjectStream, ThinkStream, RIVER,
LyraV, SPOT-Bench, Streaming-Eval, SimpleStream, StreamArena, StreamOPD, and
StreamScout remained preprints. LiveVLM v2, StreamMem, VST, ProtoKV, and MERIT
had acceptance evidence recorded in the source ledger but not a final
proceedings page there. Recent work is used as frontier context rather than as
the sole basis for a stable conclusion.

This hub does not compare performance numbers across papers. A number is only
meaningful with its backbone and version, sampling rate, write/read budget,
hardware, query timing, judge, and exact evaluation protocol; those details
belong in the focused paper notes and benchmark index.

## First Fix the Setting

### Four query-visibility regimes

| Regime | When the query becomes visible | What the memory policy may use | What success would establish |
| --- | --- | --- | --- |
| **Offline whole-video** | After, or while, the complete video is available | The query and non-causal access to the source, including future frames | Long-video understanding or retrieval, not native causal streaming |
| **Persistent query** | Before the stream begins | The registered task during every write, update, and read | Task-conditioned monitoring over a long stream |
| **Query-known streaming** | The request arrives before its evidence is complete | Query-aware filtering and a readiness policy while later frames arrive | Whether the system can wait for and react to sufficient future evidence |
| **Unknown future query** | Only after earlier frames have already been encoded, compressed, or discarded | Query-agnostic priors, learned retention behavior, and the observed stream | Whether reusable history survives for questions that could not guide the write policy |

These regimes are not interchangeable controls. Query-known retention is a
useful oracle for an unknown-future-query system, but it does not show that a
query-agnostic policy preserved the same evidence. Likewise, persistent-query
assistants can build task-specific state from the first frame; that is a
different burden from maintaining a reusable index for arbitrary future
questions.

### Three clocks

Streaming papers often use *latency* for three different quantities:

| Clock | Definition | The claim it can support | The claim it cannot support alone |
| --- | --- | --- | --- |
| **Memory distance** $\Delta_{mem}$ | Query video timestamp minus evidence video timestamp | The system can recover evidence from a distant causal prefix | The implementation keeps up with the input rate |
| **Readiness delay** $\Delta_{ready}$ | First evidence-sufficient video timestamp minus request registration timestamp | The system answers near the point where the needed evidence becomes available | The answer was produced with low wall-clock delay |
| **System latency** $\Delta_{sys}$ | Output wall-clock time minus input or request arrival wall-clock time | The deployed producer-consumer path responds promptly | The answer used genuinely old evidence |

A method can do well on one clock and fail on another. For example, a benchmark
may pause playback at a question point, giving the model unlimited computation
while still calling the protocol streaming. Conversely, a low-latency recent
window can be an excellent live perception system while being unable to answer
questions about an event from an hour earlier.

### Four resource boundaries

The phrase *bounded memory* also needs an object. This series accounts for at
least four stores separately:

| Resource | Typical contents | Why it matters |
| --- | --- | --- |
| **Active model/GPU state** | Current visual tokens, LLM KV, recent exact window, retrieved read set | Determines attention cost, prefill/decode work, and OOM risk |
| **Online index** | Block keys, captions, summaries, graph nodes, prototypes, retrieval metadata | Determines whether a future query can still address old evidence |
| **CPU/disk archive** | Offloaded KV, snapshots, captions, keyframes, or compressed episode records | Can move the bottleneck out of GPU memory while continuing to grow with stream length |
| **Total retained information** | Every model state, index entry, raw frame, keyframe, log, and source backlink | Determines whether the complete service has length-independent storage and whether discarded detail can be recovered |

Thus, a capped prompt, fixed GPU cache, or bounded query-time top-$k$ does not by
itself prove $O(1)$ total storage. Throughout this overview, *model-state
bounded*, *active-bounded/archive-grows*, *request-bounded/store-grows*, and
*recent-only bounded* describe different system contracts.

Here, *model-state bounded* means only that retained **video-derived** model
state has a configured length-independent cap. It does not imply that text or
dialogue KV, the raw input stream, application logs, or external evidence stores
are also bounded.

### Memory carriers determine what can be recovered

| Memory carrier | Main advantage | Typical irreversible loss |
| --- | --- | --- |
| Raw frames or clips | Highest-fidelity evidence and direct verification | Storage, I/O, and repeated visual encoding become expensive |
| Visual tokens | Preserve more spatial detail and can enter a VLM directly | Token count grows; merged or dropped patches cannot be reconstructed |
| LLM KV | Reuses model-specific prefill computation | State is layer/model bound; retrieval needs position and cache reconstruction |
| Captions or summaries | Cheap, searchable, and composable | OCR, small objects, exact counts, and visual relations may never be written |
| Event/entity/object records | Explicit addresses for identity, change, and temporal structure | Writer, boundary, merge, and entity-linking errors accumulate |
| Prototypes or fast state | Fixed-capacity history outside a long attention sequence | Episodes, order, and source-level evidence become hard to recover |

The carrier is therefore part of the scientific claim. A memory method should
be evaluated on the facts its representation can still express, not only on the
number of tokens passed to the final language model.

## The Six Development Paths

1. **A. Long video to native streaming** — *Interface:* causal encoding and
   scheduling. The path starts with too many frame tokens for a complete video
   and turns toward causal, incremental encoding interleaved with dialogue. It
   leaves open whether finite-clip training remains stable during indefinite,
   concurrent ingestion and generation.
2. **B. Growing archives to bounded online state** — *Interface:* memory write
   and retention. Exact historical KV is reusable but grows linearly, so the
   write policy must merge, evict, summarize, or maintain fixed-capacity state
   before a future query exists. The unresolved question is which future
   retrieval behavior each irreversible decision destroys.
3. **C. Flat tokens to structured state** — *Interface:* memory carrier, write,
   and index. Event hierarchies, entity records, object slots, graphs, and
   prototypes give history an address structure. The risk moves to identity
   drift, boundary and merge errors, OCR, and rare events.
4. **D. Single-key to verifiable multi-key RAG** — *Interface:* index, read, and
   rehydration. Multiple semantic and temporal access paths plus source
   backlinks make retrieval more testable. The open cost is how much growing
   index and source storage independently verifiable recall requires.
5. **E. Passive QA to proactive interaction** — *Interface:* trigger, answer,
   and scheduler. A system must learn when to stay silent, when evidence is
   ready, and how to watch, think, and speak concurrently. Architecture,
   streaming post-training, and strong recent perception remain confounded.
6. **F. Accuracy points to streaming systems** — *Interface:* evaluation
   harness. Continuous outputs, readiness, asynchronous producers/consumers,
   and hour-scale interaction expose timing and recent-frame shortcuts. No one
   score yet captures memory, timeliness, throughput, and evidence failure.

The paths intersect, but they should not be collapsed. A structured memory may
still have a growing external store. A proactive system may use only recent
frames. A fast compressor may reduce visual prefill without bounding the
downstream cache. The rest of the article follows these interfaces rather than
the labels chosen by individual papers.

The arrows in these path names describe a change in the **problem being asked**,
not an assumed citation or implementation lineage. I use *direct code reuse*
only when an official source establishes it, as the LiveVLM repository does for
ReKV. Elsewhere, chronological neighbors are described as problem inheritance
or conceptual adjacency unless the papers provide stronger evidence.

## A Compact Timeline of Problem Changes

The dates below are first-public dates, not venue years or dates of later
revisions. Chronology establishes when a problem became visible; it does not by
itself establish direct technical lineage.

| First public | Turning point | What changed in the question |
| --- | --- | --- |
| 2023-07 | [MovieChat](https://openaccess.thecvf.com/content/CVPR2024/html/Song_MovieChat_From_Dense_Token_to_Sparse_Memory_for_Long_Video_CVPR_2024_paper.html) | Can dense frame tokens be consolidated into short- and long-term visual memory? |
| 2024-04 | [MA-LMM](https://openaccess.thecvf.com/content/CVPR2024/papers/He_MA-LMM_Memory-Augmented_Large_Multimodal_Model_for_Long-Term_Video_Understanding_CVPR_2024_paper.pdf) | Can a fixed latent memory be updated frame by frame before a final question? |
| 2024-05 | [Streaming Long Video Understanding](https://proceedings.neurips.cc/paper_files/paper/2024/hash/d7ce06e9293c3d8e6cb3f80b4157f875-Abstract-Conference.html) | Can one query-agnostic pass create reusable historical states for later questions? |
| 2024-06 | [VideoLLM-online](https://openaccess.thecvf.com/content/CVPR2024/html/Chen_VideoLLM-online_Online_Video_Large_Language_Model_for_Streaming_Video_CVPR_2024_paper.html) | Can causal frames, dialogue, silence, and generation be trained as one temporal stream? |
| 2024-11 | [StreamingBench](https://arxiv.org/abs/2411.03628) | What changes when questions are attached to moments inside an unfinished video? |
| 2025-01 | [OVO-Bench](https://openaccess.thecvf.com/content/CVPR2025/html/Niu_OVO-Bench_How_Far_is_Your_Video-LLMs_from_Real-World_Online_Video_CVPR_2025_paper.html) and [StreamChat](https://openreview.net/forum?id=JbPb6RieNC) | Can evaluation and memory separate present perception, backward recall, forward response, and multi-round interaction? |
| 2025-03 | [ReKV](https://openreview.net/forum?id=8g9fs6mdEG) | Can exact historical model state be produced online, offloaded, and retrieved only after a question arrives? |
| 2025-05 | [StreamBridge](https://proceedings.neurips.cc/paper_files/paper/2025/hash/bf6939f9058a391c47014731b2486e2a-Abstract-Conference.html) and [LiveVLM](https://arxiv.org/abs/2505.15269) | Can offline models gain proactive triggers, and can recent and long-term KV follow different policies? |
| 2025-06 to 08 | [InfiniPot-V](https://proceedings.neurips.cc/paper_files/paper/2025/hash/caef5f5e658aa1f7565f063a2cd99726-Abstract-Conference.html) and [StreamMem](https://arxiv.org/abs/2508.15717) | What should be irreversibly retained when the future query is unknown and model state has a fixed budget? |
| 2025-09 to 10 | [StreamForest](https://proceedings.neurips.cc/paper_files/paper/2025/hash/6dd91fec726dbed8915a1fbadd91d1d2-Abstract-Conference.html), [StreamingVLM](https://openreview.net/forum?id=gVbPWbA97s), and [rLiVS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/d4857f724cc1af4c8f1e18032426aa2e-Abstract-Conference.html) | Should long-term history be an event hierarchy, a bounded recent cache, or a searchable caption record? |
| 2026-01 to 03 | [HERMES](https://aclanthology.org/2026.acl-long.381/), [StreamReady](https://openaccess.thecvf.com/content/CVPR2026/papers/Azad_StreamReady_Learning_What_to_Answer_and_When_in_Long_Streaming_CVPR_2026_paper.pdf), and [VST](https://arxiv.org/abs/2603.12262) | Should layers, answer readiness, and reasoning time become explicit parts of streaming memory and interaction? |
| 2026-04 | [OASIS](https://openaccess.thecvf.com/content/CVPR2026/html/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.html), [VSAS-Bench](https://openaccess.thecvf.com/content/CVPR2026F/html/Vasu_VSAS-Bench_Real-Time_Evaluation_of_Visual_Streaming_Assistant_Models_CVPRF_2026_paper.html), and [SimpleStream](https://arxiv.org/abs/2604.02317) | Can on-demand event retrieval, asynchronous evaluation, and a strong recent-only control expose different weaknesses? |
| 2026-05 to 06 | [SAVEMem](https://arxiv.org/abs/2605.07897), [CoRDS](https://arxiv.org/abs/2605.14310), [ProtoKV](https://arxiv.org/abs/2606.26762), and [CARVE](https://arxiv.org/abs/2606.13141) | Should selection optimize semantic priors, set coverage, summary state, or independently testable evidence retrieval? |
| 2026-07 to 08 | [FOLIO](https://arxiv.org/abs/2607.13298), [MERIT](https://arxiv.org/abs/2608.07663), [StreamArena](https://arxiv.org/abs/2608.05703), and [StreamOPD](https://arxiv.org/abs/2608.16320) | Can entity state, multiple retrieval keys, hour-scale interaction, and matched post-training controls make memory claims falsifiable? |

In this curated reading set, the timeline is easier to read as three eras. The
selected 2023–2024 papers primarily make long video processable and then causal.
The 2025 and early-2026 papers increasingly study reusable KV, fixed active
budgets, and specialized write/read policies. By mid-2026, more of the selected
work treats structured state, evidence retrieval, response timing, and system
counterfactuals as explicit evaluation objects.

## Path A: From Long-Video Compression to Native Streaming

The first path changed the input/output contract. Early long-video systems
usually assumed that a finite video already existed. Their main problem was
representational: too many frames created too many visual tokens. MovieChat
introduced dense short-term and sparse long-term visual memory, while MA-LMM
made a fixed latent bank update recurrently. These are important precursors, but
their sequential processing should not be confused with a live service. The
actual user question does not guide their memory write, and merged evidence has
no recovery path.

Three adjacent 2023–2024 branches sharpen that boundary. [LLaMA-VID](https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/6290_ECCV_2024_paper.php)
compresses each frame to a user-input-conditioned context token and a content
token, drastically reducing per-frame input while leaving total tokens
proportional to video length. It is therefore not an unknown-future-query
retention result. [Streaming Dense Video Captioning](https://openaccess.thecvf.com/content/CVPR2024/html/Zhou_Streaming_Dense_Video_Captioning_CVPR_2024_paper.html)
uses a fixed clustering memory for causal dense captions, an important
task-level streaming precursor rather than a general delayed-query dialogue
system. The [MovieChat+](https://arxiv.org/abs/2404.17176) preprint makes
consolidation question-aware, demonstrating
the value of a known query but placing it in a less restrictive regime than
unknown-future-query retention.

[Streaming Long Video Understanding with Large Language Models](https://proceedings.neurips.cc/paper_files/paper/2024/hash/d7ce06e9293c3d8e6cb3f80b4157f875-Abstract-Conference.html)
made the write/read separation clearer. It propagates a state from clip to clip,
saves historical snapshots, and selects a bounded subset after a question
arrives. That enables reuse across questions, but only the active answer input
is bounded: the snapshot archive and its indicators still grow with time.

[VideoLLM-online](https://openaccess.thecvf.com/content/CVPR2024/html/Chen_VideoLLM-online_Online_Video_Large_Language_Model_for_Streaming_Video_CVPR_2024_paper.html)
changed the contract more deeply. Frames and language events are interleaved on
a causal timeline; the model learns both when to produce language and when to
remain silent. Streaming therefore becomes a training and scheduling problem,
not merely a wrapper around an offline encoder. Later papers in this reading set
explored
multi-round memory, proactive triggers, full-frame-rate perception, and
offline-to-online adaptation.

One naming collision matters here. [*StreamChat: Chatting with Streaming
Video*](https://arxiv.org/abs/2412.08646) is the 2024 Liu et al. preprint, built
around trained cross-attention and refreshed visual context during decoding.
The existing [StreamChat note]({{% relref path="/posts/StreamChat" %}}) covers
the distinct Xiong et al. ICLR 2025 paper, formally titled
[*Streaming Video Understanding and Multi-round Interaction with
Memory-enhanced Knowledge*](https://openreview.net/forum?id=JbPb6RieNC), which
uses a hierarchical memory system and introduces StreamBench. Their shared
short name is not evidence of one paper replacing the other.

[StreamingVLM](https://openreview.net/forum?id=gVbPWbA97s) later aligned
short-window streaming training with inference and kept attention sinks plus
recent visual/text KV for stable continual decoding. This is a meaningful
answer to long-running model state, but its contract is *recent-only bounded*:
evicted visual evidence cannot be recalled. Infinite runtime is therefore not
infinite recall.

Several bridge nodes complete this path without requiring a separate digest for
each paper:

| First public | Node | Role in the development map | Boundary to retain |
| --- | --- | --- | --- |
| 2024-06 | [Flash-VStream 2024](https://arxiv.org/abs/2406.08085) | Combines STAR multi-scale visual memory with separate frame and question handlers | It is an arXiv-only system with a finite detail buffer; response latency does not prove the frame handler never accumulates backlog |
| 2024-08 | [VideoLLM-MoD](https://proceedings.neurips.cc/paper_files/paper/2024/hash/c6a79e139ec4f371701ea8cc9e06018e-Abstract-Conference.html) | Lets many visual tokens skip computation in selected transformer layers | This is primarily a compute branch, not a bounded-history policy |
| 2024-09 | [VideoLLaMB](https://openaccess.thecvf.com/content/ICCV2025/html/Wang_VideoLLaMB_Long_Streaming_Video_Understanding_with_Recurrent_Memory_Bridges_ICCV_2025_paper.html) | Uses SceneTiling, recurrent memory bridges, and temporal memory tokens to carry semantics across video units | Its reported GPU memory scales with video length, so it is not a fixed-total-state claim |
| 2025-04 | [TimeChat-Online](https://arxiv.org/abs/2504.17343) | Uses temporal differences to reduce visual tokens before the LLM and scene change to inform active response | It links causal compression and triggering but does not preserve arbitrary long-term evidence for unknown questions |
| 2025-04 | [ProVideLLM](https://openaccess.thecvf.com/content/ICCV2025/html/Chatterjee_Streaming_VideoLLMs_for_Real-Time_Procedural_Video_Understanding_ICCV_2025_paper.html) | Interleaves verbalized long-term observations with fine-grained recent visual tokens for procedural tasks | Long-term text remains a lossy representation and is not hard-capped in the audited setting |
| 2025-06 | [Flash-VStream 2025](https://openaccess.thecvf.com/content/ICCV2025/html/Zhang_Flash-VStream_Efficient_Real-Time_Understanding_for_Long_Video_Streams_ICCV_2025_paper.html) | Uses Context Synopsis Memory and Detail Augmentation Memory | It is a distinct ICCV 2025 paper, not a revision of Flash-VStream 2024; retained high-resolution history may still grow on disk |
| 2025-12 | [Streamo](https://openaccess.thecvf.com/content/CVPR2026/html/Xia_Streaming_Video_Instruction_Tuning_CVPR_2026_paper.html) | Makes multi-task streaming instruction tuning a first-class intervention across narration, grounding, and time-sensitive QA | Training breadth is not itself a long-term memory mechanism |
| 2026-03 | [FluxMem](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_FluxMem_Adaptive_Hierarchical_Memory_for_Streaming_Video_Understanding_CVPR_2026_paper.html) | Adaptively removes temporal and spatial visual redundancy before the LLM | Feature coverage and reduced visual input do not guarantee future-query evidence preservation |

The two Flash-VStream entries must remain separate: the 2024 preprint uses STAR
memory and VStream-QA, whereas the ICCV 2025 paper introduces a different
Context Synopsis/Detail Augmentation architecture. They share a project lineage
and short name, not one arXiv version history.

**What remains.** Native causal ingestion, sensible silence, and stable
generation explain how an assistant can remain online. They do not guarantee
that an unknown future question can recover old evidence, nor that decoding
will never block ingestion under a sustained producer rate.

## Path B: From Growing KV Archives to Bounded Online State

Once a Video-LMM produces KV causally, a tempting solution is to preserve all of
it. [ReKV](https://openreview.net/forum?id=8g9fs6mdEG) makes this design explicit:
write exact per-layer video KV blocks with a sliding causal window, offload them,
then retrieve and reload relevant blocks after the question arrives. The model
does not have to re-encode the video for every question, and the GPU read set can
be controlled. The cost is a linearly growing RAM/disk archive and index, plus
position reconstruction and I/O concerns. The expanded
[ReKV note]({{% relref path="/posts/ReKV" %}}) audits that storage contract in
detail; the [bounded-memory survey]({{% relref
path="/posts/StreamingMemory-Retention" %}}) compares it with fixed-state
successors.

The next turn moved irreversible selection into the streaming write path:

| Method | What is retained | Resource contract | Main caveat |
| --- | --- | --- | --- |
| [InfiniPot-V](https://proceedings.neurips.cc/paper_files/paper/2025/hash/caef5f5e658aa1f7565f063a2cd99726-Abstract-Conference.html) | Recent exact and redundancy/value-proxy-selected visual KV | Model-state bounded | Irreversible proxy selection can discard rare evidence; position rearrangement can distort temporal relations |
| [StreamMem](https://arxiv.org/abs/2508.15717) | Visual KV and per-frame prototypes selected with generic chat-template guidance | Model-state bounded | A generic proxy query cannot guarantee coverage for a specific future question |
| [LiveVLM v2](https://arxiv.org/abs/2505.15269) | Recent exact KV plus compressed long-term KV pages and position-agnostic retrieval | Model-state bounded | Deleted detail has no recovery path; a page mean can hide a locally important token |
| [HERMES](https://aclanthology.org/2026.acl-long.381/) | Layer-specific sensory, working, and long-term KV plus summaries | Model-state bounded | Generic guidance and aggregation may erase rare evidence even without query-time retrieval |
| [ProtoKV](https://arxiv.org/abs/2606.26762) | Exact near-window KV plus fixed semantic-spatial prototypes for far history | Model-state bounded | Repeated episodes can merge, damaging counts, boundaries, and order |

The current LiveVLM mechanism is its substantially revised v2/DAC 2026 form;
metrics or descriptions from the earlier v1 should not be silently mixed with
Vision Sink Bucketing and Position-agnostic KV Retrieval. Its official code
states that it is based on ReKV, which supports a direct
implementation/code-reuse relation. For most other rows, the safer description
is problem inheritance or conceptual adjacency rather than a claimed
implementation lineage.

A parallel 2026 preprint branch changes the selection objective. [SAVEMem](https://arxiv.org/abs/2605.07897)
uses fixed pseudo-questions as a semantic retention prior;
[CoRDS](https://arxiv.org/abs/2605.14310) treats retained K/V as a representative
and diverse coreset; [NovaCov](https://arxiv.org/abs/2608.01169) scores marginal
set coverage against a bounded historical reference bank. These are distinct
objectives. In particular, NovaCov bounds its reference bank, not the total
downstream history created by selecting tokens for every frame.

**What remains.** Temporal redundancy, value norm, generic prompts, attention,
geometric coverage, and prototypes are all proxies for unknown future utility.
None alone proves that a fixed state preserves the evidence ranking or recall
that a future query would obtain from the full historical index.

## Path C: From Flat Tokens to Structured Long-Term State

A flat token or KV pool can be compact without being addressable. It does not
naturally say which event occurred, which person or object changed state, or
whether two similar observations were separate episodes. Structured-memory
work changes the unit of history, but also moves failure into segmentation,
linking, consolidation, and routing.

[StreamForest](https://proceedings.neurips.cc/paper_files/paper/2025/hash/6dd91fec726dbed8915a1fbadd91d1d2-Abstract-Conference.html)
organizes history as persistent event-level trees while retaining a
fine-grained recent window. The turning point is not simply better compression:
event boundaries become part of the memory address. If boundaries or merges are
wrong, however, a rare detail can be buried inside the wrong branch.

[OASIS](https://openaccess.thecvf.com/content/CVPR2026/html/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.html)
turns an event hierarchy into an on-demand read policy. It stores summaries,
embeddings, keyframes, and recent context; a query begins with a small context
and can descend through the hierarchy when more evidence is needed. This bounds
the work of one request, not the lifetime event tree or evidence store. A wrong
high-level summary can also hide an otherwise correct lower branch. The detailed
[OASIS note]({{% relref path="/posts/OASIS" %}}) covers that read path.

Two 2026 preprints expose a useful design split. [FOLIO](https://arxiv.org/abs/2607.13298)
writes readable entity/action/state records and keeps visual-evidence backlinks,
making state chains more inspectable but allowing the record and evidence stores
to grow. [ObjectStream](https://arxiv.org/abs/2607.28312) instead maintains fixed
latent object, change, and recent-state slots. The latter is easier to cap at the
model-state level, but identity drift and slot merging can erase small objects,
OCR, exact order, or repeated occurrences. ProtoKV supplies a third point in the
space: fixed statistical prototypes rather than a readable event or entity
store.

**What remains.** Semantic external memory is easier to inspect and can preserve
source backlinks, yet it usually grows and depends on a reliable writer and
router. Fixed latent state is easier to budget, yet is less reversible. Structure
changes where errors happen; it does not remove information loss.

## Path D: From One Retrieval Key to Verifiable Multi-Key Video RAG

Caption retrieval is an attractive long-term baseline because text is cheap to
store and compare with a language query. [rLiVS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/d4857f724cc1af4c8f1e18032426aa2e-Abstract-Conference.html)
combines a bounded recurrent visual state with a searchable caption history.
That separation is useful, but any fact omitted by the caption writer—small
text, an exact count, a background object, a failed action, or precise event
order—cannot be recovered from the text index alone. The visual state may be
bounded while the caption store grows.

Several systems widen the address space in different ways:

- [AdaVideoRAG](https://proceedings.neurips.cc/paper_files/paper/2025/hash/092359ce5cf60a80e882378944bf1be4-Abstract-Conference.html)
  routes a query among text, visual, and graph databases according to the
  estimated problem type. It is an offline long-video RAG reference, not a
  native causal-streaming result, and all three databases grow with the source.
- [ViG-RAG](https://ojs.aaai.org/index.php/AAAI/article/view/36963) adds temporal
  and semantic graph relations, making time and confidence part of retrieval.
  Its whole-video graph and indexes precede the query, so it is also an offline
  long-video reference. Graph construction, retrieval, source selection, and
  answer generation remain separate possible failure points.
- [OASIS](https://openaccess.thecvf.com/content/CVPR2026/html/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.html)
  and [StreamRAG](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_StreamRAG_Enhancing_Real-Time_Video_Understanding_with_Retrieval_Augmentation_CVPR_2026_paper.html)
  bring event construction and routed reads into an online write process. A
  bounded read still sits over a growing event, caption, or evidence store.
- [MERIT](https://arxiv.org/abs/2608.07663) gives one episode multiple semantic
  keys and expands temporal neighbors only around hits. Its episodic memory is
  built query-agnostically before an unknown query, not demonstrated here as a
  native online-write pipeline. Multiple keys improve addressability without
  making the episode store fixed or guaranteeing that generation used the
  retrieved source faithfully.

The long-video preprint [V-RAGBench and CARVE](https://arxiv.org/abs/2606.13141)
uses query–evidence–answer structure to separate what should be retrieved from
how retrieved context is used. It is evidence for independently testing RAG,
not for native streaming ingestion. That separation is more diagnostic than
answer accuracy alone: a model can guess the answer from language priors after
retrieving the wrong clip, or retrieve the right clip and fail during
generation. The very recent [StreamScout](https://arxiv.org/abs/2609.00291)
preprint extends the open
question from *what to read* to *how deeply to read*, escalating from a recent
glance to broader historical search. Its maturity makes it a frontier direction,
not yet a stable conclusion.

**What remains.** Multi-key and adaptive retrieval increasingly bound evidence
read per request, not total retained information. A convincing system needs
source backlinks, evidence-level recall/ranking metrics, an explicit read budget,
and separate accounting for its index and raw evidence store.

## Path E: From Passive QA to Readiness, Thinking, and Near-Full-Duplex Interaction

Reactive streaming QA assumes that a question arrives at a predefined point and
the model answers immediately. Interactive assistants need more states: remain
silent, trigger a response, wait for future evidence, update reasoning while
watching, or continue ingesting frames while language is generated.

VideoLLM-online provides one causal-interleaving formulation. Later papers in
this reading set explore other interfaces: the
[Dispider](https://arxiv.org/abs/2501.03218) preprint separates perception,
decision, and reaction, allowing a lightweight component to monitor the stream
while a larger module responds.
[StreamBridge](https://proceedings.neurips.cc/paper_files/paper/2025/hash/bf6939f9058a391c47014731b2486e2a-Abstract-Conference.html)
made the activation model explicit while adapting an offline Video-LMM to
proactive, multi-round use. These systems introduce a new failure axis: a trigger
can be wrong even when the eventual answer would be correct.

The ICCV 2025 [StreamMind](https://openaccess.thecvf.com/content/ICCV2025/html/Ding_StreamMind_Unlocking_Full_Frame_Rate_Streaming_Video_Dialogue_through_Event-Gated_ICCV_2025_paper.html)
paper explores a neighboring event-gated, full-frame-rate dialogue branch. It
should not be confused with the different two-tier StreamMind system later
reported inside StreamArena.

[Memento](https://proceedings.iclr.cc/paper_files/paper/2026/hash/3b5f4587a0bdb81ecc6ce9d82320a5c2-Abstract-Conference.html)
studies an all-day proactive assistant with a request registered before the
stream and uses that request to shape dynamic memory. This is a strong
persistent-query result, not an equivalent test of unknown-future-query
retention. The [Memento note]({{% relref path="/posts/Memento" %}}) discusses
that distinction in more detail.

[StreamReady](https://openaccess.thecvf.com/content/CVPR2026/papers/Azad_StreamReady_Learning_What_to_Answer_and_When_in_Long_Streaming_CVPR_2026_paper.pdf)
then makes evidence sufficiency measurable. A registered request waits for later
evidence, and Answer Readiness Score penalizes responses that are too early or
too late. This targets $\Delta_{ready}$ in video time. It does not show that a
service has low $\Delta_{sys}$, and its query-known filtering is an oracle
relative to query-agnostic retention.

Streaming reasoning forms another branch. [VST](https://arxiv.org/abs/2603.12262)
updates reasoning while the video plays, while the parallel
[ThinkStream](https://arxiv.org/abs/2603.12938) preprint follows a
Watch–Think–Speak loop with an evolving reasoning state. Both can move work out
of the final response burst; neither automatically supplies a verifiable visual
evidence chain. Reasoning-compressed history can preserve an early
misinterpretation just as a visual compressor can preserve the wrong token.

[LyraV](https://arxiv.org/abs/2606.06991), a preprint at the cutoff, moves
scheduling toward frame-token
synchrony, controlling whether to continue an answer, begin another, or remain
silent while pacing generation across incoming frames. *Near-full-duplex* is the
conservative description: a general, backlog-free full-duplex service still
requires matched producer-consumer measurements.

**What remains.** “Proactive,” “ready,” “thinking,” and “full-duplex” name
different abilities. They need separate trigger, evidence, reasoning-fidelity,
queueing, and latency tests rather than one interaction score.

## Path F: From Query-Point Accuracy to Streaming-System Evaluation

[StreamingBench](https://arxiv.org/abs/2411.03628) evaluates timestamped
questions on causal video prefixes. [OVBench](https://openaccess.thecvf.com/content/CVPR2025/html/Huang_Online_Video_Understanding_OVBench_and_VideoChat-Online_CVPR_2025_paper.html)
separated past, current, and future understanding, while the independent
[OVO-Bench](https://openaccess.thecvf.com/content/CVPR2025/html/Niu_OVO-Bench_How_Far_is_Your_Video-LLMs_from_Real-World_Online_Video_CVPR_2025_paper.html)
organized backward tracing, real-time understanding, and forward active
responding. These are important causal evaluations, but an aggregate can still
be dominated by recent perception and usually does not reveal wall-clock
backlog.

The next wave decomposes the measurement:

| Evaluation direction | Representative artifact | What it makes visible | What it still does not prove |
| --- | --- | --- | --- |
| Memory distance | [RIVER](https://arxiv.org/abs/2603.03985), preprint | Accuracy as retrospective evidence becomes older | Real-time throughput or bounded total storage |
| Answer readiness | [StreamReady](https://openaccess.thecvf.com/content/CVPR2026/papers/Azad_StreamReady_Learning_What_to_Answer_and_When_in_Long_Streaming_CVPR_2026_paper.pdf) | Early and late responses relative to an evidence window | Unknown-future-query retention or low wall-clock latency |
| Component deployability | [StreamingEval](https://aclanthology.org/2026.findings-acl.295/) | Fixed-capacity memory, encoding, decoding, storage, and task quality | A complete camera producer/consumer backlog test |
| Synchronous versus asynchronous input | [VSAS-Bench](https://openaccess.thecvf.com/content/CVPR2026F/html/Vasu_VSAS-Bench_Real-Time_Evaluation_of_Visual_Streaming_Assistant_Models_CVPRF_2026_paper.html) | Model-dependent frame age and accuracy/latency trade-offs | Hour-scale historical evidence preservation |
| Continuous prediction | [SPOT-Bench](https://arxiv.org/abs/2604.24317), preprint | Silence, missed responses, extra responses, and video-time timeliness | Wall-clock tail latency by default |
| Hour-scale open interaction | [StreamArena](https://arxiv.org/abs/2608.05703), frontier preprint | Perception, historical recall, proactive interaction, tools, and recent/text-only/compressed controls | A standardized real-time producer-consumer guarantee |

Several further collisions should remain explicit. The standalone
[StreamingBench](https://arxiv.org/abs/2411.03628), StreamBench inside the Xiong
et al. StreamChat paper, and the 2026 StreamArena preprint are three different
objects; StreamBench has no independent paper identifier. ACL 2026
[*StreamingEval: A Unified Evaluation Framework towards Realistic Streaming
Video Understanding*](https://aclanthology.org/2026.findings-acl.295/) is not the
hyphenated Streaming-Eval component in the preprint
[*Harnessing Streaming Video in the Wild*](https://arxiv.org/abs/2606.08615).
Likewise, the StreamMind system reported with StreamArena in 2026 is not the
ICCV 2025 paper [*StreamMind: Unlocking Full Frame Rate Streaming Video Dialogue
through Event-Gated Cognition*](https://openaccess.thecvf.com/content/ICCV2025/html/Ding_StreamMind_Unlocking_Full_Frame_Rate_Streaming_Video_Dialogue_through_Event-Gated_ICCV_2025_paper.html).
Finally, SPOT-Bench belongs to [*Don't Pause! Every prediction matters in a
streaming video*](https://arxiv.org/abs/2604.24317), while LyraV belongs to the
separate [*Don't Pause: Streaming Video-Language Synchrony for Online Video
Understanding*](https://arxiv.org/abs/2606.06991); the similar titles do not
establish a shared method lineage.

The strongest evaluation is therefore a suite, not a synthetic leaderboard. It
should pair a memory-science protocol stratified by $\Delta_{mem}$ with a
producer-consumer harness reporting input rate, sustainable processing rate,
queue depth, frame age, dropped frames, and p50/p95/p99 latency. Storage must be
reported for active GPU state, the searchable index, archives, and retained raw
evidence. Differences in backbone, sampling rate, budget, hardware, query timing,
and judge version prevent most cross-paper numbers from being strict rankings;
the [benchmark index]({{% relref path="/posts/StreamingVideoBenchmarks" %}})
keeps those protocol details separate.

**What remains.** No single benchmark in this reading set simultaneously tests
strict arrival-time causality, hour-scale multi-evidence recall, grounded
retrieval, full-duplex ingestion and answering, fixed end-to-end storage,
backpressure, and tail latency. Claims should name the subset actually tested.

## A Cross-Cutting Counterfactual: Architecture or Training?

Complex memory should not be credited for gains that a stronger current-frame
model or streaming-specific post-training can produce. The
[SimpleStream](https://arxiv.org/abs/2604.02317) preprint deliberately provides
a recent-only control with a small frame window. The later
[StreamOPD](https://arxiv.org/abs/2608.16320) preprint keeps that recent-only
inference path unchanged and changes the post-training recipe; its optional
ST-CueGate uses teacher-only spatio-temporal cues to reweight training, not to
add a deployment-time memory module.

Together they motivate a matched $2\times2$ control rather than the conclusion
that long-term memory is unnecessary:

| | No matched streaming post-training | Matched streaming post-training |
| --- | --- | --- |
| **Recent-only / no long-term memory** | Training-free recent-window control | Post-trained recent-window control |
| **Long-term memory architecture** | Architecture without the training intervention | Required fair comparison: the same intervention plus long-term memory |

The backbone, frame policy, recent exact window, question timing, and evaluation
protocol must be held constant. Only then can an experiment distinguish memory
architecture from training and recent-perception quality. My current
[SimpleStream note]({{% relref path="/posts/SimpleStream" %}}) is intentionally a
short control summary; F7 will expand both sides of this comparison.

## My Takeaways

### 1. Streaming is a contract, not an adjective

A useful method card begins with query visibility and arrival-time causality,
not with the word *streaming* in the title. Persistent-query monitoring,
query-known readiness, unknown-future-query recall, and offline long-video RAG
answer different scientific questions.

### 2. Write, read, and archive policies should be audited separately

ReKV makes the read set small while its exact archive grows. Fixed-state methods
make a harder write-time decision but cannot recover deleted evidence. RAG
systems may make one read small while their indexes and source stores grow. One
number called “memory” hides all three policies.

### 3. Recent perception and distant recall need different channels

A fixed high-fidelity recent window is a strong control and often the right path
for current perception. Far history should be retrieved or represented at lower
bandwidth only when needed. Mixing all history and the current frame in one
attention pool can increase cost and interference without preserving exact old
evidence.

### 4. Structured and latent memory trade different kinds of error

Event and entity records are readable and can point back to evidence, but their
writers and routers can hallucinate, merge identities, or hide branches. Latent
KV, slots, and prototypes are easier to keep compact, but they are opaque and
usually irreversible. A hybrid is promising only if each interface is evaluated
independently.

### 5. Evidence retrieval should become a first-class metric

Answer accuracy cannot reveal whether a method preserved the right history or
guessed from language priors. Evidence Recall@$k$, ranking quality, temporal
overlap, and agreement with a full-history oracle make the memory layer more
falsifiable. They also separate writer failure, retrieval failure, and generation
failure.

## Open Hypothesis: Preserve Future Query-to-Evidence Behavior

The most interesting open problem, in my view, is not another token-importance
score. It is this:

> Given a single-pass video stream, an unknown future query distribution, and a
> fixed online index/evidence budget, maintain a coreset that preserves as much
> as possible of the full-history index's future query-to-evidence behavior.

“Behavior” should be operational rather than metaphorical: top-$k$ membership,
ranking order, boundary margin, evidence recall, and temporal localization for
held-out future queries. The bounded structure may store several keys per
episode and sparse backlinks to high-risk visual evidence, but the budget must
charge for the keys, backlink metadata, and the retained frame/clip bytes those
backlinks address. A small pointer does not make its evidence store free or
bounded.

This hypothesis is falsifiable. Under a matched backbone, FPS, recent exact
window, training recipe, and legal query-arrival protocol, compare the bounded
index with a full-history oracle. If a new selection objective improves visual
coverage but fails to preserve retrieval agreement or long-delay answer quality,
then it has not solved the proposed problem. If it preserves retrieval but makes
online updates, I/O, or tail latency unsustainable, it has not solved the
streaming-system version either.

This is deliberately presented as a research direction, not a consensus result.
Semantic priors, K/V coresets, set-wise visual coverage, multi-key records, and
adaptive reading already cover important neighboring territory. The remaining
claim must be narrower and tested against those baselines.

## Series Map

### Overview maps

- [Long Streaming Video Understanding Pipeline]({{% relref path="/posts/StreamingVLM-Pipeline" %}})
  — architecture and pipeline stages.
- [Benchmarks for Streaming Video Understanding]({{% relref path="/posts/StreamingVideoBenchmarks" %}})
  — evaluation settings and protocol-specific numbers.

### Memory, KV cache, and compression

- [ReKV]({{% relref path="/posts/ReKV" %}})
- [StreamKV]({{% relref path="/posts/StreamKV" %}})
- [InfiniPot-V]({{% relref path="/posts/InfiniPotV" %}})
- [StreamMem]({{% relref path="/posts/StreamMem" %}})
- [LiveVLM]({{% relref path="/posts/LiveVLM" %}})
- [StreamingTOM]({{% relref path="/posts/StreamingTOM" %}})
- [STC: hierarchical token compression]({{% relref path="/posts/STC" %}})
- [MuKV]({{% relref path="/posts/MuKV" %}})
- [WeaveTime]({{% relref path="/posts/WeaveTime" %}})

### Retrieval and structured state

- [rLiVS]({{% relref path="/posts/rLiVS" %}})
- [AdaVideoRAG]({{% relref path="/posts/AdaVideoRAG" %}})
- [ViG-RAG]({{% relref path="/posts/ViG-RAG" %}})
- [OASIS]({{% relref path="/posts/OASIS" %}})

### Native streaming, interaction, and controls

- [StreamChat: Xiong et al., ICLR 2025, arXiv 2501.13468]({{% relref path="/posts/StreamChat" %}})
- [StreamingVLM]({{% relref path="/posts/StreamingVLM" %}})
- [Memento]({{% relref path="/posts/Memento" %}})
- [SimpleStream]({{% relref path="/posts/SimpleStream" %}})
- [Qwen3-VL: backbone note]({{% relref path="/posts/Qwen3-VL" %}})

### Thematic articles

- [**Bounded streaming-memory evolution**]({{% relref path="/posts/StreamingMemory-Retention" %}})
  — published in F2.
- **Set-wise streaming-memory selection** — planned (F3).
- **Structured long-term state** — planned (F4).
- **Verifiable multi-key Video RAG** — planned (F5).
- **StreamArena and asynchronous evaluation** — planned (F6).
- **Architecture versus streaming post-training** — planned (F7).

This overview is a map, not a final taxonomy. The boundaries will move as
preprints mature, evaluation protocols become stricter, and methods expose more
complete storage and systems accounting. The underlying comparison contract—
query visibility, clocks, resource boundaries, evidence recoverability, and
matched controls—should remain useful even when the paper list changes.
