+++
date = '2026-05-09T19:22:47+08:00'
title = 'AdaVideoRAG'
description = 'Omni-Contextual Adaptive Retrieval-Augmented Efficient Long Video Understanding.(NeurIPS 2025)'
categories = ["AI", "VLM", "paper", "RAG"]
tags = ["Video-LLM", "long video", "retrieval", "knowledge graph", "AdaVideoRAG", "HiVU"]
decor_image = "images/bg2.png"
+++

Paper: [AdaVideoRAG: Omni-Contextual Adaptive Retrieval-Augmented Efficient Long Video Understanding](https://arxiv.org/abs/2506.13589)

Code: [xzc-zju/AdaVideoRAG](https://github.com/xzc-zju/AdaVideoRAG)

## Background
Long-video understanding is hard because the useful evidence is sparse, long-range, and often spread across multiple modalities:
- visual content;
- speech;
- scene text;
- temporal relations.

RAG is a natural fit here.
Instead of feeding the whole video to the MLLM every time, the system can first build a searchable memory, retrieve relevant evidence, and then answer with a smaller context.

But a fixed VideoRAG pipeline is not ideal.
Easy questions may not need retrieval at all, while hard questions may need structured graph reasoning.

So AdaVideoRAG focuses on one question:
> Can the system choose the retrieval strategy according to query difficulty?

This is the main idea behind its **adaptive retrieval** design.

## Core Idea
AdaVideoRAG is an **MLLM-centric adaptive RAG framework** for long-video understanding.

The key idea is:
- build an omni-contextual memory from the video;
- classify the user query into a difficulty level;
- use no retrieval, simple retrieval, or graph retrieval depending on that level;
- feed only the useful evidence back to the MLLM for final answering.

The method has four major parts:
- **Query Intent Classification**: decide whether the question is Level-1, Level-2, or Level-3;
- **Omni-Knowledge Indexing**: build text, visual, and graph databases from the video;
- **Adaptive Retrieval Paradigm**: route different query levels to different retrieval strategies;
- **Integration and Generation**: combine retrieved evidence and video clips for the final MLLM response.

In one sentence:
> AdaVideoRAG treats retrieval depth as a resource that should be spent according to query difficulty.

This is different from the KV-cache streaming papers like ReKV, StreamKV, StreamMem, or LiveVLM.
Those papers mainly ask how to store or retrieve model-internal KV cache efficiently.
AdaVideoRAG works at a higher semantic level:
- captions;
- ASR;
- OCR;
- visual embeddings;
- entities and relationships.

So it is closer to a long-video agent / RAG system than a pure cache-compression method.

## Key Insights

### 1. Not every video question deserves the same retrieval cost
This is the simplest but most important idea in the paper.

If a question is easy, complex retrieval can be harmful:
- it increases latency;
- it adds more irrelevant context;
- it may distract the final MLLM.

If a question is hard, simple retrieval can be too shallow:
- it may only retrieve one local clip;
- it may miss earlier causes or later consequences;
- it may not connect entities across time.

So AdaVideoRAG uses query routing:
- **Level-1**: direct MLLM answering;
- **Level-2**: naive multimodal retrieval;
- **Level-3**: graph-based retrieval.

This turns VideoRAG from a fixed pipeline into a conditional pipeline.

### 2. Long videos need omni-context, not only captions
Caption-only retrieval is useful, but it loses many things:
- facial expressions;
- object appearance changes;
- spatial layouts;
- small visual details;
- text shown on screen;
- audio information that is never visible.

AdaVideoRAG therefore builds several memory views of the same video:
- clip captions for visual semantics;
- ASR for speech;
- OCR for scene text;
- visual embeddings for direct visual grounding;
- graph structure for entities and relations.

The important point is that these are complementary.
The best evidence for a question may not be in the same modality as the question.

### 3. Graph retrieval should be reserved for questions that need it
Graph retrieval is powerful, but it is not free.
Building and searching a graph costs more than normal vector retrieval.

AdaVideoRAG uses the graph path mainly for Level-3 questions:
- multi-hop reasoning;
- cross-modal causal inference;
- high-level sensemaking;
- global understanding of the whole video.

This is a good design trade-off.
The graph is available when the question needs structure, but the system does not pay the graph cost for every query.

## Method

### 1. Query Intent Classification
AdaVideoRAG first classifies the user query into three levels.

**Level-1: straightforward reasoning**

These questions mostly ask about directly visible content.
They involve little logical reasoning.

Typical examples:
- object color;
- visible action;
- a simple detail at a specific time.

For this level, the paper argues that current MLLMs are already good enough.
Adding retrieval may mostly add overhead.

So the system uses:
> direct MLLM answering without external retrieval.

**Level-2: simple reasoning**

These questions require one-step reasoning over local events.
They may involve simple temporal, spatial, or causal links.

For example, the model may need to:
- locate a relevant moment;
- check what happened just before or after it;
- combine speech, scene text, and visual evidence.

For this level, direct MLLM answering can miss details.
But full graph retrieval may still be unnecessary.

So the system uses:
> multimodal naive retrieval from text and visual databases.

**Level-3: hard reasoning**

These questions require global understanding and multi-hop reasoning.
They may ask about:
- deep causal relationships;
- long-range event dependencies;
- abstract themes;
- relations between people, objects, and events across time.

For this level, a flat list of retrieved chunks is often not enough.
The model needs structured connections.

So the system uses:
> graph retrieval with entities and relationships.

The intent classifier itself is lightweight.
The paper uses a CoT-style LLM classifier, with Qwen2.5-7B as the main choice.
It reports that the classifier cost is small compared with the whole pipeline, around no more than 5% of total time.

### 2. Omni-Knowledge Text Base
AdaVideoRAG divides the input video into consecutive clips.
In the paper's setup, each clip is about **30 seconds**.

For each clip, it samples key frames.
The paper uses **5 frames** as the multimodal primitive, because more frames bring more cost without clear extra gain.

Then it builds three text-side databases.

**Caption database**

A VLM generates fine-grained clip captions from sampled frames.
These captions describe:
- characters;
- actions;
- objects;
- scene changes;
- temporal context.

In the implementation, the paper uses a quantized MiniCPM-V model for caption generation.

**ASR database**

Audio often contains information that is not visible.
For lectures, interviews, dramas, and news videos, speech may be the main carrier of meaning.

AdaVideoRAG uses FastWhisper to transcribe audio into text.
The ASR text is then embedded and stored for retrieval.

**OCR database**

Scene text is also important:
- subtitles;
- slides;
- signs;
- scoreboards;
- product names;
- UI text.

AdaVideoRAG uses EasyOCR to extract text from frames and stores it as another searchable database.

So the text base is not just "video captions".
It is:
> captions + speech + screen text.

This matters because different questions naturally match different text sources.

### 3. Knowledge Graph Construction
For Level-3 questions, AdaVideoRAG builds a graph from the auxiliary text sources:
- clip captions;
- ASR;
- OCR.

The graph contains two main types of information.

**Entities**

An entity is a semantic unit in the video.
It can represent a person, object, concept, event, location, or domain-specific item.

The paper describes each entity with information such as:
- entity type;
- entity name;
- spatio-temporal attributes.

**Relationships**

Relationships connect entities.
They can encode:
- temporal relations;
- spatial relations;
- causal relations;
- functional relations;
- other semantic associations.

This graph is useful because hard video questions often do not ask for one isolated clip.
They ask how several pieces of evidence connect.

So the graph acts as a structured memory over the long video.

### 4. Vision Base
Text alone is not enough for video.

Some information is hard to express in captions:
- whether a person looks nervous;
- how an object changes shape;
- where objects are placed;
- whether two actions look similar;
- fine-grained facial expressions and body movements.

AdaVideoRAG therefore also builds a visual database.

The paper uses ImageBind to encode key frames into a shared semantic space.
This is useful because ImageBind aligns different modalities, so text queries and visual clips can be compared in a common embedding space.

During retrieval, the system can use rewritten text queries as anchors and find visually relevant clips through similarity search.

This helps recover visual evidence that may be missing or poorly described in captions.

### 5. Adaptive Retrieval
After the query is classified, AdaVideoRAG chooses one retrieval path.

#### Level-1: no retrieval
For straightforward questions, the system feeds the query and the video input directly into the MLLM.

The point is efficiency.
If the question can be answered from direct perception, building or searching extra databases is unnecessary.

This is also a reminder that RAG is not always a win.
For simple visual QA, retrieval can become overhead.

#### Level-2: naive multimodal retrieval
For Level-2 questions, AdaVideoRAG performs simple retrieval from text and visual bases.

The interesting detail is query rewriting.
The paper does not use one query string for all modalities.
Instead, it rewrites the question differently for:
- clip caption retrieval;
- ASR retrieval;
- OCR retrieval.

This is sensible because the same user question may look different in different databases.

For example:
- captions prefer descriptive event-style sentences;
- ASR may contain colloquial speech fragments;
- OCR is often short and entity-like.

After text retrieval, AdaVideoRAG also searches the visual database.
It uses the caption-style rewritten query as the semantic anchor, compares it with ImageBind visual features, filters candidates by a similarity threshold, and keeps the top visual evidence.

The final Level-2 evidence pool contains:
- retrieved caption clips;
- retrieved ASR clips;
- retrieved OCR clips;
- retrieved visual clips.

This is enough for many local or single-step reasoning questions.

#### Level-3: graph retrieval
For Level-3 questions, AdaVideoRAG switches to graph retrieval.

The paper builds this part on a LightRAG-style graph retrieval mechanism.

The basic flow is:
- rewrite the query;
- search entity and relationship descriptions;
- retrieve relevant graph nodes and edges;
- expand associated information into a query-centered map;
- combine graph evidence with visual grounding results.

The graph retrieval result is not just a list of clips.
It gives the MLLM a more structured view:
- which entities matter;
- how they are related;
- where they appear in the video timeline;
- which events form a causal or semantic chain.

This is why graph retrieval helps more on hard reasoning tasks than on simple QA.

### 6. Filtering, Sorting, and Generation
After retrieval, AdaVideoRAG does another cleanup step.

The initial retrieval results may contain duplicates or irrelevant chunks because evidence can be found from several databases at the same time.

So the system:
- removes duplicate video blocks;
- uses a small LLM to filter irrelevant evidence;
- sorts the remaining clips by their original temporal order.

The temporal sorting is important.
For video reasoning, evidence order is often part of the answer.

Finally, the MLLM receives different inputs depending on the level:
- **Level-1**: video and query;
- **Level-2**: visual evidence, retrieved clips, auxiliary text, and query;
- **Level-3**: all Level-2 evidence plus graph evidence and graph text.

This makes the final generation stage adaptive as well.
The model does not always see the same kind of context.

## Experiments

### Benchmarks
The paper evaluates AdaVideoRAG mainly on:
- **HiVU**, the paper's new hierarchical long-video benchmark;
- **MLVU_test**;
- **Video-MME**.

HiVU is especially important for this paper because it matches the method's design.
It contains:
- **120** knowledge-rich long videos;
- about **60 hours** in total;
- video duration from about **1 minute** to **106 minutes**;
- three domains: knowledge education, information, and entertainment;
- three reasoning levels: L1, L2, and L3.

The goal is not only to test whether the model can see details.
It is to test whether the model can answer questions with different cognitive depth.

### Main Results on MLVU
AdaVideoRAG improves several open-source MLLMs on MLVU_test.

Some notable numbers:
- Video-LLaVA-7B improves from **29.4** to **37.9** average;
- Qwen2.5-VL-7B improves from **29.0** to **40.5** average;
- Qwen2.5-VL-72B improves from **41.7** to **45.1** average;
- VideoLLaMA3-7B improves from **47.7** to **53.2** average.

The strongest gain appears on weaker or smaller models.
This is expected: external retrieval gives the model better evidence, so it partially compensates for limited long-context reasoning.

### Comparison with VideoRAG on Video-MME
On Video-MME, AdaVideoRAG is compared with a previous VideoRAG method.

With Qwen2.5-VL-7B:
- base model: **47.2** overall;
- VideoRAG: **55.0** overall;
- AdaVideoRAG: **59.9** overall.

With VideoLLaMA3-7B:
- base model: **64.2** overall;
- VideoRAG: **67.3** overall;
- AdaVideoRAG: **68.5** overall.

The improvement is especially clear on long videos.
This supports the paper's central claim:
> adaptive retrieval and graph-aware retrieval are more useful when video duration and reasoning depth increase.

### HiVU Results
On HiVU, the paper uses win-rate style evaluation across several dimensions:
- comprehensiveness;
- empowerment;
- trustworthiness;
- depth;
- density.

AdaVideoRAG wins more clearly as the question difficulty increases.

Compared with the base VideoLLaMA3 on HiVU:
- Level-2 overall win rate for AdaVideoRAG: **62.73%**;
- Level-3 overall win rate for AdaVideoRAG: **77.13%**;
- overall win rate: **69.42%**.

Compared with VideoRAG:
- AdaVideoRAG is close on Level-2;
- AdaVideoRAG is better on Level-3;
- overall win rate is **55.9%**.

This is consistent with the method.
Graph retrieval is most useful when the question actually needs global multi-hop reasoning.

### Ablations
The ablation studies remove three components:
- graph retrieval;
- vision retrieval;
- text retrieval.

The full method is better than each removed version.

The most obvious drop appears when text retrieval is removed.
This makes sense because captions, ASR, and OCR carry a lot of searchable semantic information.

Graph retrieval is also important, especially for deep reasoning.
Vision retrieval gives a smaller but still useful gain, mainly by recovering visual details that text may miss.

The paper also tests query classification.
Qwen2.5-7B gives the best balance among tested classifiers, with **0.81** classification precision on HiVU and **68.5** overall score on Video-MME.

If all queries are forced into a single path, performance drops:
- all Level-1: **64.2**;
- all Level-2: **67.5**;
- all Level-3: **67.1**;
- adaptive routing: **68.5**.

This is a clean result.
It shows that the classifier is not just decoration.
The routing decision itself matters.

### Efficiency
The efficiency results also match the design.

For 100 videos from MLVU:
- Level-1 has no database construction;
- Level-2 database construction takes about **351s** on average;
- Level-3 database construction takes about **412s** on average because graph construction adds cost.

Single-process response time on one H20 GPU:
- Level-1: **8s**;
- Level-2: **26s**;
- Level-3: **27s**;
- adaptive average: **20s**.

So the system is not saying graph retrieval is cheap.
It says graph retrieval should be used only when it is worth the cost.

## My Takeaways
The most useful idea in this paper is the routing view.

Many VideoRAG papers focus on building a better memory or a better retriever.
AdaVideoRAG adds another question before retrieval:
> What kind of retrieval does this query actually need?

That is a practical systems idea.
It is also easy to imagine extending it:
- more than three query levels;
- cost-aware routing based on latency budget;
- model-aware routing depending on the backbone MLLM;
- dynamic fallback when simple retrieval fails.

The omni-knowledge base is also reasonable.
Long videos are not just visual streams.
For many real videos, speech and screen text may be more important than raw frames.
Using captions, ASR, OCR, visual embeddings, and graphs together is a more realistic setup.

The graph part is interesting, but I think the routing is the real contribution.
Graph retrieval alone is not new.
The more useful message is:
> Use graph retrieval when the query needs global structure, not as the default path for every question.

The latency of this frame work could be high, because there may be many LLM calls.

## Limitations / Open Questions
- The pipeline depends on many external components: captioner, ASR, OCR, embedding model, graph builder, classifier, reranker, and MLLM. Each component can introduce errors.
- Database construction is still expensive for Level-2 and Level-3. This is fine for offline video analysis, but less suitable for strict real-time streaming.
- The query classifier is important. If it sends a hard query to the simple path, the system may miss necessary graph evidence.
- The method currently uses three difficulty levels. Real applications may need finer routing based on cost, domain, video length, and user latency tolerance.
- This method is semantic-level RAG, not KV-cache reuse. It improves long-video QA, but it does not directly solve the transformer memory problem addressed by ReKV / StreamKV / StreamMem style systems.
