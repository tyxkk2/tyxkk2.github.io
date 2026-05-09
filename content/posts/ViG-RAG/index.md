+++
date = '2026-05-09T20:54:59+08:00'
title = 'ViG-RAG'
description = 'Video-aware Graph Retrieval-Augmented Generation via Temporal and Semantic Hybrid Reasoning.(AAAI 2026)'
categories = ["AI", "VLM", "paper", "RAG"]
tags = ["Video-LLM", "long video", "retrieval", "knowledge graph", "temporal reasoning", "GMM", "ViG-RAG"]
math = true
decor_image = "images/bg2.png"
+++

Paper: [ViG-RAG: Video-aware Graph Retrieval-Augmented Generation via Temporal and Semantic Hybrid Reasoning](https://ojs.aaai.org/index.php/AAAI/article/view/36963)

PDF: [AAAI Proceedings PDF](https://ojs.aaai.org/index.php/AAAI/article/download/36963/40925)

Code: [AI-Researcher-Team/ViG-RAG](https://github.com/AI-Researcher-Team/ViG-RAG)

## Background
Long-video RAG is harder than text RAG because video evidence is not just a list of documents.

Useful information may be distributed across:
- visual scenes;
- speech transcripts;
- entities and events;
- temporal order;
- uncertain or noisy observations.

If we simply split the video into independent chunks and retrieve by static text similarity, two problems appear:
- the retrieved chunks may be semantically related but temporally wrong;
- the system may miss long-range relationships between events.

ViG-RAG focuses on this question:
> Can we build a video-aware graph memory that preserves both semantic relations and temporal structure?

## Core Idea
ViG-RAG is a **graph-based RAG framework for long video understanding**.

The main idea is:
- convert long videos into structured textual and visual knowledge;
- build a **Probabilistic Temporal Knowledge Graph (PTKG)**;
- retrieve candidate clips using both semantic and temporal signals;
- use **GMM-based filtering** to adaptively decide which clips are high-confidence;
- generate the final answer with retrieved clips, semantic anchors, and expanded context.

In one sentence:
> ViG-RAG turns video RAG from flat chunk retrieval into temporal-semantic graph retrieval.

This is close to AdaVideoRAG in spirit, because both are semantic-level VideoRAG systems.
But the focus is different:
- **AdaVideoRAG** routes questions by difficulty and chooses different retrieval paths;
- **ViG-RAG** builds a temporal probabilistic graph and improves retrieval with semantic-temporal hybrid reasoning.

So I think ViG-RAG is mainly a paper about:
> better video memory representation + better adaptive retrieval filtering.

## Key Insights

### 1. Video facts should have time and confidence
Traditional knowledge graphs usually store triples:

$$
(h, r, t)
$$

where **h** is the head entity, **r** is the relation, and **t** is the tail entity.

For video, this is not enough.
A relation may only hold during a certain time interval, and the extracted evidence may be uncertain because captions, ASR, and visual recognition can all be noisy.

ViG-RAG therefore uses a probabilistic temporal form:

$$
(h, r, t, \tau, p)
$$

where:
- **$\tau$** is the timestamp or time interval;
- **$p$** is the plausibility or confidence score.

This is the core representation shift.
The graph is not just saying:
> entity A is related to entity B.

It is saying:
> entity A is related to entity B at this time, with this confidence.

That is much more suitable for long-video reasoning.

### 2. Retrieval should check both semantic match and temporal coherence
A clip can look semantically relevant but still be temporally wrong.

For example, if the question asks:
> What did the person do after opening the box?

then a clip about "opening the box" may be relevant, but the answer may require the next event.

ViG-RAG uses two filtering functions:
- **Text-F**: does this clip semantically match the query?
- **Temp-F**: does this clip make sense in the temporal context of the query?

So retrieval is not only:
> find text similar to the query.

It becomes:
> find evidence that is both semantically aligned and temporally coherent.

### 3. Fixed Top-K is too rigid for video retrieval
Many retrieval pipelines choose a fixed **K**:
> always retrieve 4 chunks, or always retrieve 8 chunks.

This is convenient, but video queries have different score distributions.
Some questions have one very clear evidence region.
Other questions need several dispersed clips.

ViG-RAG uses a lightweight **Gaussian Mixture Model (GMM)** over candidate similarity scores.
The idea is simple:
- fit a mixture distribution to the retrieval scores;
- identify the high-mean component as the high-confidence region;
- keep candidates that probably belong to this region.

So the retrieval budget becomes query-adaptive.
The method does not need a handcrafted threshold or supervised ranker.

## Method

### 1. Video Segmentation and Multimodal Extraction
ViG-RAG first divides each long video into segments.
In the implementation details, the paper follows a **30-second segment** setup.

For each segment, it extracts two main sources of information.

**Audio / speech**

The audio stream is transcribed by ASR.
In the paper's setup, it uses **Distil-Whisper**.

The ASR transcript is important because many long videos, such as lectures, documentaries, and interviews, carry core information in speech rather than frames.

**Visual content**

Frames are sampled from each segment and passed to a VLM to produce detailed descriptions.
The paper uses a quantized **MiniCPM-V** as the vision-language interface.

In the main setup:
- each 30-second segment uses **5 representative frames** for initial analysis;
- a denser frame sampling of **15 frames per segment** is used for stronger section-level visual summarization.

So each segment becomes a multimodal textual unit:
- ASR transcript;
- visual caption;
- timestamp information;
- sampled visual evidence.

These segment-level texts are not the graph yet.
They are the raw material used in the next step to extract entities, events, relations, and confidence scores.

### 2. Probabilistic Temporal Knowledge Graph
PTKG is the central structured memory in ViG-RAG.

It is built after the segment-level multimodal text has been prepared.
The process is:
- collect the ASR transcript, visual caption, and timestamp of each segment;
- split the video text into coherent text chunks;
- ask an LLM to extract entities, relations, temporal information, and confidence values from each chunk;
- merge the extracted facts from all chunks into one global graph.

Each extracted fact is stored as a temporal probabilistic tuple:

$$
(h, r, t, \tau, p)
$$

where:
- **h** is the head entity;
- **r** is the relation;
- **t** is the tail entity;
- **$\tau$** is the timestamp or time interval;
- **p** is the plausibility / confidence score.

The whole graph can be written as:

$$
G = (N, E, T, P)
$$

where:
- **N** is the entity set;
- **E** is the relation set;
- **T** stores temporal information;
- **P** stores confidence values.

So PTKG is not produced directly by frame sampling or ASR.
It is produced by applying LLM-based information extraction to the segment-level text.

The extra time and confidence fields are important because video facts are dynamic and noisy.
The retriever can then reason over:
- what happened;
- when it happened;
- how confident the system is;
- how entities and events connect across segments or even across videos.

### 3. Multimodal Indexing
After PTKG construction, ViG-RAG builds several aligned retrieval views for the same video segments.

For each segment, the system keeps:
- the segment id and timestamp;
- the ASR transcript and visual caption;
- the PTKG facts linked to this segment;
- text embeddings for semantic retrieval over passages, entity mentions, and graph-related text;
- visual / multimodal embeddings for the sampled frames or clips.

So the indexing stage creates parallel but aligned indices:
- **graph index**: stores entities, relations, timestamps, and confidence values;
- **text index**: stores embeddings of captions, transcripts, entity mentions, and candidate passages;
- **visual index**: stores visual or multimodal embeddings, using ImageBind-style shared representations.

These indices are parallel retrieval surfaces, but they are not independent databases.
They are tied together by the same segment ids and timestamps.

This means any hit from the text index, graph index, or visual index can be mapped back to the original video segment.

The role of the visual index is to provide a retrieval path that does not depend entirely on ASR, captions, or graph extraction.
It helps recover visually relevant clips when the needed evidence is mainly visual or was not fully expressed in text.

### 4. Textual Retrieval from PTKG
Given a user query, ViG-RAG first performs textual retrieval over the PTKG-centered indices.

The retrieval flow is:
- refine the user query with an LLM;
- extract query-specific semantic anchors, such as entities, actions, events, and temporal cues;
- match these anchors to PTKG entities, relations, and graph text;
- use text embeddings to find semantically related passages or entity mentions when exact graph matching is not enough;
- use timestamps and temporal links in PTKG to collect temporally relevant segments;
- map the matched graph facts and text passages back to their original video segments.

The output of this stage is an initial candidate set:

$$
S_q^t
$$

where each candidate is a video segment with associated text, graph facts, and timestamp information.

So the third section provides the searchable structures.
This fourth section is where the query actually uses those structures to retrieve candidate evidence.

The key difference from plain vector search is that PTKG retrieval can use both semantic matching and graph-temporal structure.
It is not limited to chunks whose surface wording is directly similar to the query.

### 5. Text-F and Temp-F Filtering
After initial retrieval, not all candidates are useful.

ViG-RAG filters candidates with two LLM-based functions.

**Text-F**

Text-F checks whether the textual content of a candidate clip semantically matches the refined user query.

It asks:
> Is this clip about the right entities, actions, and concepts?

**Temp-F**

Temp-F checks temporal coherence.

It asks:
> Is this clip relevant at the right time, and does it preserve the needed temporal dependency?

The final score combines both:

$$
\operatorname{Score}(S, q) = \alpha \cdot \operatorname{TextF}(S, q) + (1 - \alpha) \cdot \operatorname{TempF}(S, q)
$$

This is why the paper calls the method **temporal and semantic hybrid reasoning**.

### 6. GMM-based Adaptive Top-K Selection
The next question is:
> How many candidate clips should be retained?

A fixed Top-K is fragile.
If K is too small, the system may miss multi-hop evidence.
If K is too large, the answer model sees noisy context.

ViG-RAG fits a univariate GMM over candidate scores.

The input to this step is not a clip embedding.
It is a one-dimensional score list:

$$
\{x_1, x_2, \ldots, x_N\}
$$

where:
- **$N$** is the number of candidate clips;
- **$x_i = \operatorname{Score}(S_i, q)$** is the relevance score of candidate clip **$S_i$**.

ViG-RAG assumes these scores are drawn from a mixture of one-dimensional Gaussian components:

$$
p(x) = \sum_{k=1}^{K} w_k \mathcal{N}(x \mid \mu_k, \sigma_k^2)
$$

where:
- **$w_k$** is the mixture weight;
- **$\mu_k$** is the mean score of component **$k$**;
- **$\sigma_k^2$** is the variance of component **$k$**.

The GMM parameters are estimated with the standard EM algorithm.
There is no supervised training or ranking loss.

The number of components **$K$** is also not fixed manually.
ViG-RAG selects it using BIC, so the score distribution itself decides how many confidence groups are needed.

After fitting the GMM, the method selects the component with the highest mean:

$$
k^* = \arg\max_k \mu_k
$$

This component is treated as the high-confidence evidence region.

For every candidate score **$x_i$**, ViG-RAG computes the posterior probability that it belongs to this high-confidence component:

$$
P(z_i = k^* \mid x_i)
$$

Candidates are then ranked or filtered by this posterior probability.
The retained clips form the final filtered evidence set:

$$
\hat{S}
$$

This is a small but useful systems trick:
> choose evidence by score distribution, not by a fixed global threshold.

It makes retrieval adapt to each query.

> Remark: This is a good idea. But the score is one-dimension, so the GMM method is actually a classifier. We can get more than one score for each clip, why don't we use higher dimension scores?

### 7. Query-Aware Generation
After filtering, ViG-RAG constructs the final input for the generator.

The paper describes two additional context-building steps:
- extract explicit semantic anchors from the query;
- build an implicit context field through local context refinement.

Then the VLM generates the answer from:
- query-specific semantic anchors;
- expanded context;
- filtered retrieved clips.

The generation formula in the paper is:

$$
R = \operatorname{VLM}(K_q, C_p, \hat{S})
$$

where:
- **$K_q$** is the semantic anchor set extracted from the query;
- **$C_p$** is the expanded implicit context field;
- **$\hat{S}$** is the filtered set of relevant clips.

So final answering is not just "paste retrieved chunks into a prompt".
It tries to coordinate query semantics, graph context, and visual evidence.

## Experiments

### Benchmarks
The paper evaluates ViG-RAG on:
- **LongerVideos**;
- **Video-MME**;
- **LongVideoBench**.

LongerVideos is used to test long-form and multi-video understanding.
The paper describes it as more than 20 video sets from public YouTube content, covering educational, documentary, and entertainment videos.

Video-MME tests video understanding across short, medium, and long videos.
LongVideoBench focuses on long-range multimodal reasoning with thousands of multiple-choice questions.

### Baselines
The RAG baselines include:
- **NaiveRAG**;
- **GraphRAG-local**;
- **GraphRAG-global**;
- **LightRAG-hybrid**;
- **VideoRAG**.

The paper also evaluates ViG-RAG as a plug-in module for several LVLM backbones:
- Video-LLaVA;
- LLaVA-NeXT-Video;
- LongVA;
- Long-LLaVA;
- Qwen2-VL;
- LLaVA-Video.

### Implementation Details
The main setup includes:
- 30-second video segments;
- 5 representative frames per segment;
- 15 frames per segment for denser visual summarization;
- MiniCPM-V for visual captioning;
- Distil-Whisper for ASR;
- ImageBind for multimodal representation;
- OpenAI `text-embedding-3-small` for text embeddings;
- GPT-4o-mini for orchestration, retrieval reasoning, and evaluation support.

This is important to note.
ViG-RAG is not a single model.
It is a multi-component RAG pipeline.

### Graph-RAG Comparison
On the LongerVideos-style win-rate evaluation, ViG-RAG consistently beats GraphRAG, LightRAG, NaiveRAG, and VideoRAG.

The overall pattern in Table 1 is roughly:
- graph/text RAG baselines are around the low 20% range;
- VideoRAG is around the mid 30% range;
- ViG-RAG is around the low 40% range.

The exact overall rows show ViG-RAG around **41.7% to 41.8%**, while VideoRAG is around **35.6% to 35.8%** under different baseline groupings.

This supports the paper's claim that static graph or flat retrieval is not enough for video.
The temporal and probabilistic graph structure matters.

### Video-MME Plug-in Results
ViG-RAG also improves multiple open-source LVLMs on Video-MME.

Some notable numbers:
- Video-LLaVA improves from **39.6** to **43.5** overall;
- LLaVA-NeXT-Video improves from **43.0** to **54.2** overall;
- LongVA improves from **51.4** to **58.8** overall;
- Long-LLaVA improves from **52.0** to **57.7** overall;
- Qwen2-VL-72B improves from **64.9** to **72.4** overall;
- LLaVA-Video-72B improves from **67.1** to **74.4** overall.

The gains are especially large on long videos.
For example:
- Qwen2-VL long-video score improves from **56.3** to **72.2**;
- LLaVA-Video long-video score improves from **59.6** to **72.8**.

This matches the method design.
PTKG and temporal retrieval are most useful when the evidence is spread over a long duration.

### Ablations
The ablations remove three core components:
- **PTKG**;
- **Query Enhancement**;
- **GMM Filtering**.

Removing any of them hurts performance.

The interpretation is straightforward:
- without PTKG, the system loses temporal and graph structure;
- without query enhancement, retrieval has weaker semantic anchors;
- without GMM filtering, candidate selection falls back toward raw similarity scores and becomes less adaptive.

So the method's advantage comes from the combination:
> structured video memory + query-aware retrieval + adaptive filtering.

## My Takeaways
The most useful part of ViG-RAG is the PTKG representation.

For long-video RAG, a normal chunk is often too weak as the basic memory unit.
Video evidence naturally has:
- entities;
- events;
- time;
- uncertainty.

PTKG puts these four pieces into one retrieval structure.
That makes the method conceptually cleaner than pure caption search.

The GMM filtering is also practical.
It is not a huge model innovation, but it solves a real retrieval problem:
> different queries should retrieve different amounts of evidence.

I also like the separation between semantic relevance and temporal coherence.
Many video retrieval methods treat time as metadata after retrieval.
ViG-RAG makes time part of the relevance decision itself.

## Relation to AdaVideoRAG
ViG-RAG and AdaVideoRAG are easy to confuse because both are graph-based long-video RAG papers.

My current view:
- **AdaVideoRAG** is more about adaptive routing by query difficulty;
- **ViG-RAG** is more about graph representation and score-distribution-aware retrieval;
- both move away from flat caption retrieval;
- neither is a KV-cache method like ReKV or StreamKV.

So if I only want a high-level routing system, AdaVideoRAG is the cleaner reference.
If I care about temporal graph memory and adaptive evidence filtering, ViG-RAG is more relevant.

## Limitations / Open Questions
- The pipeline depends on many components: ASR, captioning VLM, LLM-based graph extraction, embeddings, ImageBind, GMM filtering, reranking, and final VLM generation.
- PTKG quality depends heavily on extraction quality. Wrong entities, relations, timestamps, or confidence scores can propagate into retrieval.
- The graph construction cost may be high for very large video corpora.
- The paper uses LLM-based evaluation for some open-ended comparisons, so evaluator choice matters.
- The GMM filter is training-free, but it still assumes score distributions can be separated into useful confidence groups. This may fail for ambiguous queries.

> Remark: As I mentioned, there should be a better method if we consider multi-dimension score.

- The method improves long-video QA, but it does not directly solve low-level transformer memory or streaming KV-cache constraints.
