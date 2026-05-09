+++
date = '2026-04-27T02:10:00+08:00'
title = 'Long Streaming Video Understanding Pipeline'
description = 'A pipeline view of recent long streaming video understanding papers.'
categories = ["AI", "VLM", "KV cache", "summary"]
tags = ["survey", "Video-LLM", "streaming", "long video", "retrieval", "compression"]
math = true
+++

Related papers:

- ReKV: [Paper](https://arxiv.org/abs/2503.00540) / [Code](https://github.com/Becomebright/ReKV)
- StreamKV: [Paper](https://arxiv.org/abs/2511.07278) / [Code](https://github.com/sou1p0wer/StreamKV)
- InfiniPot-V: [Paper](https://arxiv.org/abs/2506.15745) / [Code](https://github.com/aiha-lab/InfiniPot-V)
- StreamMem: [Paper](https://arxiv.org/abs/2508.15717)
- LiveVLM: [Paper](https://arxiv.org/abs/2505.15269) / [Code](https://github.com/sjtu-zhao-lab/LiveVLM)
- StreamingTOM: [Paper](https://arxiv.org/abs/2510.18269) / [Code](https://github.com/YIGE24/StreamingTOM)
- rLiVS: [Paper](https://arxiv.org/abs/2510.17364) / [Code](https://github.com/vdorovatas/rLiVS)

## Core Question

All of these papers are trying to solve the same systems problem:

> When a video stream keeps arriving, the user question is not known yet, and GPU memory is limited, how should a Video-LLM process the stream, compress memory, retrieve evidence, and generate an answer with low latency?

The methods look different if we read them one by one: KV cache retrieval, semantic chunking, TaR / VaN, chat-template proxy queries, VSB, CTR, OQM, caption RAG, and so on.

But they fit into one chronological pipeline:

```text
video stream
  -> stream unit construction
  -> optional pre-LLM visual token reduction
  -> online Video-LLM encoding
  -> memory write
  -> online query-agnostic retention
  -> query-facing memory index
  -> question-time retrieval or activation
  -> position and cache reconstruction
  -> answer generation
```

This post follows that order strictly. Each stage describes what comes in, what operation happens, what comes out, and which papers optimize that point in the pipeline.

## Stage 1: Stream Unit Construction

**Input:** raw video stream.

**Operation:** split the stream into frames, clips, blocks, or semantic segments.

**Output:** the basic unit that will be encoded and later stored or retrieved.

This stage matters because the unit chosen here becomes the unit of compression and retrieval later. A bad unit can cut through events; a good unit preserves temporal coherence.

**ReKV** uses a relatively simple fixed-block / sliding-window setup. Its main contribution is not segmentation. Instead, it establishes the basic streaming formulation: encode video online into reusable KV cache, then retrieve relevant historical KV blocks after a question arrives.

**StreamKV** directly optimizes this stage. It replaces uniform chunks with semantic segments. It detects boundaries by measuring the cosine similarity between adjacent frame embeddings:

- a clear similarity drop suggests a semantic boundary;
- a minimum segment length avoids over-fragmentation;
- a maximum segment length avoids overly long segments;
- each segment gets a summary vector whose summary KV is always retained.

So StreamKV changes the basic unit from a fixed time block to a semantic segment.

**StreamMem** uses a lighter input filtering step. It checks whether consecutive frames are redundant. If their similarity is above a threshold, it merges them before MLLM encoding. This is not full semantic segmentation, but it reduces obvious repetition early.

**rLiVS** uses short clips as the unit. Each clip is captioned, and that caption becomes the long-term textual memory unit.

**StreamingTOM** uses frames as stable units. Each frame will later be reduced to exactly $G$ visual tokens by CTR, and OQM stores memory at the same frame-aligned group granularity.

## Stage 2: Optional Pre-LLM Visual Token Reduction

**Input:** visual tokens produced by the vision encoder and projector.

**Operation:** reduce visual tokens before they enter the LLM transformer.

**Output:** a smaller set of visual tokens that will be prefilling the LLM.

This is the earliest place to save LLM compute. Once full visual tokens enter the LLM, the prefill cost has already been paid. Post-LLM KV compression can save storage, but it cannot undo that compute.

**StreamingTOM** is the key paper at this stage. It proposes Causal Temporal Reduction (CTR), which reduces each frame from $N$ visual tokens to a fixed $G$ tokens before the LLM. CTR uses two signals:

- adjacent-frame change, measured by similarity to the same patch location in the previous frame;
- streaming attention saliency, derived from the vision encoder attention.

Dynamic tokens are selected mainly by saliency. Static tokens are compressed with DPC-style clustering, so the method keeps representatives instead of many redundant background patches. CTR is causal: it only uses the current and previous frames, not future frames.

**StreamMem** also performs an input-side reduction, but at frame level rather than token level. It removes or merges highly redundant frames before MLLM encoding.

**rLiVS** selects visual tokens too, but its selection is mainly for recurrent memory. After a clip caption is generated, rLiVS uses caption-to-visual attention to select a small set of visual tokens and feeds them into the next clip. This improves short-term continuity rather than reducing the current clip's prefill.

**ReKV, StreamKV, InfiniPot-V, StreamMem, and LiveVLM** mostly optimize after KV has already been produced. This is why StreamingTOM is important: it fills the pre-LLM side of the pipeline.

## Stage 3: Online Encoding and Memory Production

**Input:** the current frame, clip, or segment after optional input reduction.

**Operation:** run the Video-LLM online and produce model-internal memory.

**Output:** KV cache, summary KV, selected visual memory, or captions.

This stage is where the stream is converted into reusable evidence before the user question is known.

**ReKV** uses sliding-window attention to encode the video online. It produces KV cache for each layer, keeps the current local window on GPU, and offloads older KV to RAM or disk. Its central formulation is:

> online KV production + query-time KV retrieval.

**StreamKV** follows the same online encoding idea, but encodes semantic segments instead of fixed blocks. The current segment and its summary vector are encoded together, producing both frame-level KV and a summary KV block.

**LiveVLM** processes incoming clips and generates visual KV online. New KV first belongs to short-term memory; older KV is moved toward long-term memory and compressed.

**InfiniPot-V** lets the KV cache grow during streaming until it reaches a memory threshold $|M|$. The compression step happens only after that threshold is reached.

**StreamMem** processes one video chunk at each streaming step. The newly generated KV immediately competes with old memory under a fixed budget.

**StreamingTOM** encodes only the reduced token group from each frame. Because CTR has already reduced the input, the LLM writes fewer KV entries per frame.

**rLiVS** generates a caption for each short clip. That caption is both an output and a long-term textual memory item. The attention generated during captioning also provides the signal for selecting recurrent visual tokens.

## Stage 4: Memory Write

**Input:** newly produced KV, summary KV, selected tokens, or captions.

**Operation:** write the new memory item into the system's memory structure.

**Output:** a growing memory buffer before or during budget enforcement.

This stage is about where the newly produced evidence is placed. It comes before deciding what must be evicted or compressed under a memory budget.

**ReKV** writes historical visual KV into a KV bank. Since it tries to preserve rich historical evidence, the memory grows roughly linearly with video duration and may require CPU or disk offloading.

**StreamKV** writes two kinds of memory for each semantic segment:

- summary KV, which is always preserved;
- frame-level KV, which can later be compressed by the layer-adaptive selection module.

**LiveVLM** writes recent KV into short-term memory first. When it becomes old, it is moved into long-term memory and becomes a candidate for VSB compression.

**InfiniPot-V** appends incoming KV to the current cache until the threshold is reached. At this point, the cache is not yet the final compressed cache. It is the candidate pool for the next retention step.

**StreamMem** merges the new chunk KV with the existing compressed memory. Old and new entries then compete under the same fixed budget.

**StreamingTOM** writes each frame-aligned group into OQM. For each group, it stores quantized KV, scale and offset metadata, and a compact representative key.

**rLiVS** writes captions into a textual memory store. It also writes selected visual tokens into a small recurrent visual memory for nearby future clips.

## Stage 5: Online Query-Agnostic Retention

**Input:** the current memory buffer plus newly written memory.

**Operation:** compress, prune, quantize, merge, or evict memory without knowing the future user question.

**Output:** bounded or compressed long-term memory.

This is the key streaming constraint. The question has not arrived yet, but memory pressure already exists. The system must decide what survives without using the real query.

**ReKV** mostly skips this stage. It keeps a large historical KV bank and postpones selection until query-time retrieval. This preserves detail, but memory and loading cost are high.

**StreamKV** uses a guidance prompt as a query-agnostic compression criterion. The same layer-adaptive selection module later used for retrieval is also used here for compression. The module selects frame-level KV blocks from the current segment, while the summary KV block is always retained.

**InfiniPot-V** performs continual KV cache compression when the memory threshold is reached. It uses two query-agnostic scores:

- TaR, which uses Key similarity to remove temporally redundant patches;
- VaN, which uses Value norm to preserve semantically important tokens.

Recent frames are kept in full. Older tokens are selected by temporal distinctiveness and semantic saliency. Layer-wise adaptive pooling further changes the spatial compression strength by layer.

**StreamMem** uses chat template tokens as a proxy query. The attention from assistant-start tokens to visual tokens becomes a generic importance score. StreamMem keeps high-score KV entries and also creates frame-wise KV prototypes through attention-weighted merging.

**LiveVLM** uses Vision Sink Bucketing (VSB) for long-term KV compression. VSB uses vision-to-vision attention rather than text-to-vision attention. It then applies bucketed selection so the retained tokens have both high saliency and temporal coverage.

**StreamingTOM** has already reduced tokens with CTR before the LLM. At this stage, OQM stores the resulting group KV in 4-bit form. The query-agnostic retention decision is therefore a combination of fixed-size frame groups, low-bit KV storage, and representative-key indexing.

**rLiVS** does not preserve long-term visual KV. Its query-agnostic retention is the caption itself: if a detail is not captured in the clip caption, long-range caption retrieval cannot recover it later. The selected visual tokens remain short-term recurrent memory, not long-term visual storage.

## Stage 6: Query-Facing Memory Index

**Input:** the compressed or retained long-term memory.

**Operation:** expose a lightweight representation that can be searched when a question arrives.

**Output:** representative keys, segment summaries, captions, or an already-active compact cache.

This stage is often implicit, but it is useful to separate it from both retention and retrieval. Retention decides what survives. The memory index decides how the future query will find it.

**ReKV** uses either external CLIP-like frame embeddings or internal averaged frame keys as retrieval representatives.

**StreamKV** keeps representative keys for compressed segment-level KV blocks, and the summary vector helps preserve segment-level semantics.

**LiveVLM** organizes compressed long-term KV into pages. PaR later computes page representatives with positional information removed.

**StreamingTOM** stores a compact representative key for each frame-aligned group in OQM.

**rLiVS** uses captions as the retrieval index. This makes retrieval cheap because both questions and captions live in text space.

**StreamMem and InfiniPot-V** rely less on a large external index. Their retained memory is already compact enough to be used directly during answering, although the internal cache layout still determines what the model can attend to.

## Stage 7: Question-Time Retrieval or Activation

**Input:** user question plus the query-facing memory index.

**Operation:** retrieve or activate the relevant historical memory.

**Output:** selected KV blocks, pages, groups, captions, or the current compact cache.

This is the first query-aware stage. The system can now use the actual user question.

**ReKV** retrieves relevant frames or blocks from the historical KV bank. It supports:

- external retrieval with a CLIP-like embedding model;
- internal retrieval with the Video-LLM's own averaged frame keys.

The selected KV blocks are loaded back to GPU for answering.

**StreamKV** uses the same layer-adaptive selection module as in compression, but now the selection criterion is the user question. Different layers can retrieve different KV blocks.

**LiveVLM** uses Position-agnostic KV Retrieval (PaR). It retrieves relevant pages from the compressed long-term KV memory while keeping full short-term memory available.

**StreamingTOM** retrieves top groups through OQM. Only the selected 4-bit KV groups are dequantized.

**rLiVS** retrieves captions with query-caption similarity and uses MMR to reduce redundancy among neighboring or similar captions.

**StreamMem and InfiniPot-V** mostly activate the current compact KV memory directly instead of retrieving from a large historical bank. Their query-time path is fast, but they cannot recover details already evicted during streaming.

## Stage 8: Position and Cache Reconstruction

**Input:** retrieved KV blocks, pages, groups, or compact memory.

**Operation:** make the selected memory usable by the LLM's attention mechanism.

**Output:** a valid decoding cache or textual context for answer generation.

This stage is easy to miss. Retrieved KV blocks often come from discontinuous time spans, so original position IDs or RoPE phases may not be directly usable.

**ReKV** treats retrieved KV as consecutive tokens during QA instead of preserving original absolute positions. This is practical, but may become more fragile for newer VLMs with more complicated positional schemes.

**StreamKV** applies RoPE only within the local window during segment encoding. During QA, retrieved tokens are treated with relative consecutive positions.

**LiveVLM** handles this most explicitly. PaR removes positional information during retrieval similarity computation, then restores positional information for final reasoning.

**StreamMem** uses YaRN for context extension, trying to make position handling more consistent across long streams.

**StreamingTOM** sorts selected groups by time, dequantizes them, and reconstructs a DynamicCache. Its frame-aligned group design makes reconstruction more regular than arbitrary token-level retrieval.

**rLiVS** mostly avoids visual KV position reconstruction for long-range memory because its retrieved memory is text captions.

## Stage 9: Answer Generation

**Input:** the user question plus reconstructed KV memory, compact cache, retrieved captions, or some combination of them.

**Operation:** generate the final answer.

**Output:** response to the user.

At this point, the differences between the methods become visible as different evidence sources:

- **ReKV** answers from retrieved historical KV blocks.
- **StreamKV** answers from retrieved compressed segment KV and preserved summaries.
- **InfiniPot-V** answers from the current bounded compressed KV cache.
- **StreamMem** answers from compact KV memory with salient entries and frame prototypes.
- **LiveVLM** answers from full short-term KV plus retrieved long-term KV pages.
- **StreamingTOM** answers from dequantized retrieved group KV.
- **rLiVS** answers from retrieved captions, with short-term visual continuity maintained during streaming.

The main trade-off is clear:

- methods that keep or retrieve more visual KV preserve finer detail but pay memory and latency costs;
- methods that compress aggressively or use captions are cheaper but may lose details before the question arrives.

## Pipeline Map

| Pipeline Stage | ReKV | StreamKV | InfiniPot-V | StreamMem | LiveVLM | StreamingTOM | rLiVS |
|---|---|---|---|---|---|---|---|
| 1. Stream unit | fixed block / frame | semantic segment | cache chunk / patch | chunk / filtered frames | clip | frame group | short clip |
| 2. Pre-LLM reduction | none | none | none | frame filtering | none | CTR token reduction | recurrent selected tokens |
| 3. Online encoding | sliding-window KV | segment KV + summary KV | KV grows until threshold | chunk KV update | clip-wise KV update | reduced-token KV | caption generation |
| 4. Memory write | full KV bank | summary KV + frame KV | append to cache | merge new and old KV | short-term then long-term KV | 4-bit group storage | caption store + recurrent tokens |
| 5. Query-agnostic retention | mostly none | guidance-prompt selection | TaR + VaN compression | chat-template attention pruning + prototypes | VSB compression | quantized OQM | caption as long-term memory |
| 6. Query-facing index | CLIP or averaged keys | segment representatives | compact cache | compact cache | PaR pages | group keys | captions |
| 7. Query-time retrieval | external / internal KV retrieval | layer-adaptive retrieval | direct compact cache | direct compact cache | PaR page retrieval | group retrieval | caption retrieval + MMR |
| 8. Cache reconstruction | consecutive retrieved tokens | relative QA positions | bounded cache positions | YaRN | remove position for retrieval, restore for reasoning | time-sorted DynamicCache | text context |
| 9. Answer generation | retrieved KV | retrieved segment KV | bounded KV | compact KV + prototypes | short-term KV + retrieved pages | dequantized group KV | retrieved captions |

## Compact Mental Model

In strict pipeline order, the papers can be summarized like this:

- **ReKV** builds the basic pipeline: online KV encoding, store a large historical KV bank, retrieve relevant KV at question time, then answer.
- **StreamKV** improves the front and middle of that pipeline: semantic segmentation, summary KV, query-agnostic compression with a guidance prompt, and query-aware layer-adaptive retrieval.
- **InfiniPot-V** focuses on the online retention step: when KV memory grows too large, compress it with TaR and VaN under a hard memory cap.
- **StreamMem** also focuses on online retention, but uses the MLLM's own chat-template attention as the saliency signal and keeps frame-wise prototypes.
- **LiveVLM** splits memory into full short-term KV and compressed long-term KV, then retrieves relevant long-term pages with PaR when the question arrives.
- **StreamingTOM** moves the first major compression step earlier: CTR reduces visual tokens before the LLM, and OQM stores the resulting group KV in 4-bit form.
- **rLiVS** changes the long-term memory modality: visual tokens are used for short-term recurrence, while long-term memory becomes caption-based text retrieval.

The cleanest future system may combine multiple stages:

> semantic stream units + pre-LLM token reduction + bounded KV retention + query-facing memory index + query-aware retrieval + careful cache reconstruction + optional caption memory.

The real design question is not which single paper is best. It is:

> Given constraints on latency, VRAM, video length, and question type, which method should be used at each pipeline stage?
