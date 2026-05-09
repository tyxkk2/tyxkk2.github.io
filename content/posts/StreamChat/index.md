+++
date = '2026-05-02T01:19:20+08:00'
title = 'StreamChat'
description = 'Streaming Video Understanding and Multi-round Interaction with Memory-enhanced Knowledge.(ICLR 2025)'
categories = ["AI", "VLM", "paper", "RAG"]
tags = ["Video-LLM", "streaming", "memory", "multi-turn", "StreamChat", "Flash-VStream"]
math = true
decor_image = "images/bg2.png"
+++

Paper: [Streaming Video Understanding and Multi-round Interaction with Memory-enhanced Knowledge](https://arxiv.org/abs/2501.13468)

Code: [hmxiong/StreamChat](https://github.com/hmxiong/StreamChat)

## Background
Most Video-LLMs are still awkward in a real streaming setting.

Offline video QA usually assumes:
- the whole video is already available;
- the question is known before inference;
- the interaction is single-turn.

But a streaming assistant has a different problem:
- video frames keep arriving;
- the user may ask questions at arbitrary timestamps;
- the system should remember previous conversation turns;
- the answer should come back with low latency.

This is close to the motivation of ReKV, Flash-VStream, LiveVLM, and rLiVS, but StreamChat chooses a different abstraction.

ReKV keeps model-internal **KV cache** and retrieves relevant historical KV blocks.
rLiVS keeps short-term visual recurrence and uses **captions** as long-term textual memory.

StreamChat instead builds a higher-level **hierarchical memory system**:
- recent visual features as short-term memory;
- compressed visual/text memory as long-term memory;
- previous QA turns as dialogue memory.

So it is not a pure KV-cache retrieval paper.
It is closer to:

> RAG-inspired memory management for real-time multi-turn streaming video interaction.

## Core Idea
StreamChat is a **training-free** framework for streaming video understanding.

The key idea is:
- remove redundant incoming frames before they enter memory;
- store recent visual content in short-term memory;
- compress older content into a long-term memory tree;
- keep previous conversations in a dialogue memory;
- retrieve relevant visual/text/dialogue memories when a question arrives;
- run frame processing, memory update, and response generation in parallel threads.

The paper has two main contributions:
- **StreamChat**, the streaming memory system;
- **StreamBench**, a benchmark for online multi-turn video QA.

The important distinction from ReKV-style methods is that StreamChat does not try to preserve every historical LLM KV block.
Instead, it treats the video stream as a memory database that can be summarized, clustered, indexed, and retrieved.

This makes the method feel closer to application-level memory / RAG than to transformer-cache engineering.

## Method

### 1. What Is Stored
StreamChat separates memory into three parts:

$$ M_l \cup M_s = \{l_i\}_{i=0}^{T/L} \cup \{s_i\}_{i=0}^{S}, \qquad M_d = \{d_i\}_{i=0}^{D}. $$

Here:
- **$M_s$** is short-term visual memory;
- **$M_l$** is long-term visual-text memory;
- **$M_d$** is dialogue memory;
- **$T$** is video duration;
- **$L$** is the chunk length for long-term memory construction;
- **$S$** is the short-term memory length;
- **$D$** is the number of previous dialogue turns.

The important design is that StreamChat does not store one flat list of frames.
It stores different things for different time scales:

```text
recent stream
  -> short-term visual memory

old stream
  -> long-term memory tree
     -> compressed visual feature
     -> text clue / caption

previous Q&A
  -> dialogue memory
```

This already explains why the method is RAG-like.
The text clues and dialogue embeddings are searchable indices.
The compressed visual features are the evidence that gets brought back after retrieval.

### 2. Selective Frame Stacking
The first problem is that the raw stream may contain many nearly identical frames.
StreamChat does not encode every frame.

For each incoming frame **$F_i$**, it compares it with the previous accepted frame using **Lucas-Kanade optical flow**.
The optical-flow assumption is:

$$ I_x u + I_y v + I_t = 0. $$

where:
- **$I_x$** and **$I_y$** are spatial image gradients;
- **$I_t$** is the temporal gradient;
- **$(u,v)$** is the local motion vector.

The method aggregates the motion vectors into a total motion magnitude:

$$ \|\theta\|,\qquad \theta=(u,v). $$

Then it applies a threshold **$t \in [0,1]$**:

```text
if ||theta|| > t:
    encode frame F_i
    push visual embedding e_i into B_vision
else:
    skip this frame
```

> Remark: This is a different method of frame deduplication. Like the cosine similarity.

The retained frame is encoded into a visual embedding:

$$ e_i \in \mathbb{R}^{n \times d}. $$

where **$n$** is the number of visual tokens/features for the frame and **$d$** is the feature dimension.
These embeddings are appended to a visual buffer:

$$ B_{\mathrm{vision}} = [e_0, e_1, \ldots]. $$

So selective frame stacking is not a semantic selector.
It is a motion-based gate before memory construction.

This matters because all later memory modules work on **$B_{\mathrm{vision}}$**, not on raw frames.
If a frame is filtered out here, it cannot be recovered later.

### 3. Short-term Memory
Short-term memory is built from recent entries in **$B_{\mathrm{vision}}$**.

The goal is to keep recent visual details available for questions such as:
> "What did the person just do?"

StreamChat first chooses **$N$** recent visual embeddings as candidates:

$$ C = \{\sigma_{N-1} e_{i-(N-1)}, \sigma_{N-2} e_{i-(N-2)}, \ldots, \sigma_0 e_i\}. $$

Here **$\sigma_j$** is a normalized forgetting probability inspired by the Ebbinghaus forgetting curve.
The point is not to keep all recent frames uniformly.
Instead, StreamChat samples **$S$** items from this candidate set to form short-term memory:

$$ M_s = \mathrm{Sample}_S(C), \qquad M_s = \{s_i \in \mathbb{R}^{n \times d}\}_{i=0}^{S}. $$

So **$M_s$** is a compact set of recent visual embeddings.
It is still visual, not textual.

This is different from long-term memory:
- short-term memory preserves more direct visual evidence;
- long-term memory compresses and abstracts older content.

### 4. Long-term Memory Unit
Long-term memory is built when the visual buffer has enough features.

First, StreamChat splits **$B_{\mathrm{vision}}$** into chunks:

$$ B_{\mathrm{vision}} = \{K_i\}_{i=0}^{T/L}, \qquad K_i = \{e_j\}_{j=0}^{L}. $$

Each chunk **$K_i$** contains **$L$** visual embeddings.

Then it produces two things from each chunk.

**First**, it compresses visual features with K-Means:

$$ v_i = f_{\mathrm{KMeans}}(K_i), \qquad v_i \in \mathbb{R}^{C \times d}. $$

Here **$C$** is the clustering goal, namely the number of visual representatives kept for the chunk.
This is the visual part of the long-term memory.

**Second**, it generates a text clue / caption for the chunk:

$$ t_i = p_\theta(x_i \mid K_i). $$

The text clue describes what happened in that chunk.
It is not just for human readability.
It is the retrieval key used later.

The visual feature and text clue together form one long-term memory unit:

$$ l_i = \{v_i, t_i\}. $$

So a base long-term memory node is:

```text
l_i
  visual part: v_i = clustered visual features
  text part:   t_i = caption / clue for retrieval
```

This is the core abstraction of StreamChat.
It stores old video as paired **compressed visual evidence + searchable text clue**.

### 5. Long-term Memory Tree
If all memory units stayed at one level, retrieval would still need to search many old chunks.
StreamChat instead organizes long-term memory into a tree.

Base nodes are pushed in chronological order:

$$ [l_0, l_1, \ldots, l_i] = [l_0, l_1, \ldots, l_{i-1}] \cup \{l_i\}. $$

Then neighboring nodes are grouped into higher-level nodes.
For a group of **$g$** lower-level nodes, the paper constructs a higher-level node as:

$$ l_k^1 = \left\{ f_{\mathrm{KMeans}}(\{v_i\}_{i=0}^{g}),\; p_\theta(x_i \mid \{t_i\}_{i=0}^{g}) \right\}. $$

This means:
- merge the visual representatives from several lower nodes with K-Means;
- summarize the lower-level text clues into a higher-level text clue.

Then this grouping repeats until a tree is formed.

The tree gives StreamChat a coarse-to-fine retrieval path:

```text
root / high-level summaries
  -> choose relevant branch
  -> lower-level memory units
  -> retrieve compressed visual evidence
```

This is cheaper than comparing the query against every small video chunk.
It also preserves temporal order, because nodes are grouped chronologically.

### 6. Dialogue Memory
The video memory alone is not enough for multi-turn interaction.
The user may ask a follow-up question that depends on previous answers.

StreamChat treats every question-answer pair as a dialogue memory fragment:

$$ d_i = E(\langle Q_i, A_i \rangle). $$

where:
- **$Q_i$** is the user question in turn **$i$**;
- **$A_i$** is the model answer in turn **$i$**;
- **$E(\cdot)$** is the dialogue encoder.

The paper uses **MiniLM-L6** as this encoder.

The dialogue memory is updated by appending the new encoded fragment:

$$ M_d = \{d_0, d_1, \ldots, d_i\}. $$

At query time, the new question is encoded and searched against **$M_d$** with FAISS.
The retrieved dialogue history is then added to the prompt.

So StreamChat has two retrieval channels:
- video memory retrieval;
- dialogue memory retrieval.

This is why it can handle questions where the visual evidence is not enough unless previous conversation context is also remembered.

### 7. Query-time Retrieval
When a user question **$q$** arrives, StreamChat does not replay the video.
It searches the already-built memory.

For long-term video memory, the query is compared with text clues in the memory tree.
Conceptually:

$$ \mathrm{Sim}(q, t_i) = \cos(E_q(q), E_t(t_i)). $$

The retrieval algorithm follows the tree:
- compute similarity between the question and candidate node text clues;
- choose the highest-similarity node at the current level;
- if the node has children, continue into that branch;
- stop when it reaches the selected lower-level memory units;
- return the matched text clue and compressed visual feature.

This is a greedy tree traversal rather than exhaustive search over all memory units.
The benefit is speed.
The risk is that an early wrong branch can hide the correct evidence.

For dialogue memory, the query is encoded and searched against previous dialogue embeddings:

$$ \mathrm{Retrieve}(q, M_d) = \mathrm{TopK}_{d_i \in M_d} \cos(E(q), d_i). $$

The final context contains:
- the current user question;
- retrieved long-term visual memory **$v_i$**;
- retrieved text clue **$t_i$**;
- retrieved dialogue history from **$M_d$**;
- short-term memory **$M_s$** for recent visual details.

Then the Video-LLM generates the answer from this reconstructed multimodal context.

So the query-time path is:

```text
question q
  -> retrieve text/visual memory from long-term tree
  -> retrieve related previous QA from dialogue memory
  -> combine with short-term visual memory
  -> construct prompt / multimodal input
  -> answer with Video-LLM
```

### 8. System Scheduling
The paper's systems contribution is that these steps are not executed serially.

StreamChat runs three components in parallel:

- **Thread 1: Selective Frame Stacking**
  - receives incoming frames;
  - runs optical-flow filtering;
  - encodes accepted frames;
  - fills **$B_{\mathrm{vision}}$**.

- **Thread 2: Memory Formation**
  - consumes full visual buffers;
  - updates short-term memory;
  - chunks and clusters old features;
  - builds or extends the long-term memory tree;
  - writes new dialogue records after each turn.

- **Thread 3: Contextual Summarization**
  - listens for user requests;
  - retrieves from **$M_l$** and **$M_d$**;
  - combines retrieved memory with **$M_s$**;
  - starts answer generation.

This is why the response does not wait for the whole memory pipeline to finish.
The response thread uses the latest available memory snapshot.

The paper reports that this scheduling supports:
- up to **32 FPS** video processing;
- request processing delay below about **0.9s**.

The practical lesson is:

> StreamChat's memory design decides what the model can remember; its scheduling design decides whether the system can answer in real time.

## StreamBench
The paper also introduces **StreamBench**, because existing video QA benchmarks are mostly offline and single-turn.

StreamBench contains:
- **306** videos;
- **24.8h** total duration;
- **4.5 min** average duration;
- about **1.8K** QA pairs;
- four broad domains: egocentric, web, work, and movie videos;
- multi-turn questions designed for online interaction.

The benchmark has six question types:

- **Object Search (OS)**: find an object that appeared briefly in the past;
- **Long-term Memory Search (LM)**: recall an older event;
- **Short-term Memory Search (SM)**: answer about recent events;
- **Conversational Interaction (CI)**: use previous dialogue turns;
- **Knowledge-based QA (KG)**: combine video content with model knowledge;
- **Simple Factual (SF)**: answer simple early-video questions.

This benchmark design matches StreamChat's architecture pretty directly:
- long-term memory should help OS and LM;
- short-term memory should help SM;
- dialogue memory should help CI.

## Experiments

### Setup
The paper builds StreamChat on **LongVA**.

Implementation details include:
- visual encoder: **CLIP-L-P14**;
- text/dialogue encoder: **MiniLM-L6**;
- selected memory units: **5**;
- candidate length: **20**;
- hardware: **2 NVIDIA Tesla A800 80GB** GPUs.

The paper reports three variants:

| Variant | Goal |
| --- | --- |
| Slow | better accuracy |
| Base | balanced speed and accuracy |
| Fast | better FPS and lower latency |

The difference mainly comes from memory parameters such as optical-flow threshold, chunk length, group size, and clustering target.

### StreamBench Results
On StreamBench, StreamChat improves clearly over prior streaming methods.

| Method | FPS | Score | Acc. | Coherence | RPD |
| --- | ---: | ---: | ---: | ---: | ---: |
| Video-online | 5 | 3.11 | 56.4 | 1.94 | 1.07 |
| Flash-VStream | 1 | 2.89 | 52.1 | 2.21 | 4.15 |
| StreamChat Slow | 15 | 3.48 | 64.7 | 1.76 | 0.90 |
| StreamChat Base | 20 | 3.42 | 63.8 | 1.79 | 0.89 |
| StreamChat Fast | 32 | 3.28 | 61.7 | 1.81 | 0.85 |

The key comparison is with Video-online:
- **Slow** improves accuracy from **56.4** to **64.7**;
- **Fast** still gets **61.7** accuracy while running at **32 FPS**;
- all variants keep request processing delay around **0.9s**.

So StreamChat is not only more accurate.
It also changes the latency profile.

The paper also reports strong gains on the memory-heavy question types:
- object search;
- long-term memory search;
- short-term memory search;
- conversational interaction.

This supports the claim that the three memory components are not decorative.
They map to different failure modes in streaming video QA.

### Offline Video QA Results
StreamChat is mainly an online method, but the paper also evaluates it on offline open-ended video QA:
- **ActivityNet-QA**
- **NExT-QA**
- **MSVD-QA**
- **MSRVTT-QA**

The Base variant gets:
- **50.1** on ActivityNet-QA;
- **50.5** on NExT-QA;
- **58.7** on MSVD-QA;
- **43.4** on MSRVTT-QA;
- **50.6** average accuracy.

This is higher than the LongVA base average of **48.1** in the paper's table.

The offline result is not the most important part of the paper, but it suggests that the memory modules are not only useful for the new benchmark.

### Ablation
The memory ablation is clean.

With no memory modules, the Base model gets **60.3** average accuracy on StreamBench.
Adding all three memories reaches **63.8**.

The effects line up with the intended design:
- dialogue memory mainly improves **Conversational Interaction**;
- long-term memory improves **Long-term Memory Search**;
- short-term memory improves **Short-term Memory Search**;
- combining long-term and short-term memory works better than either alone.

This is a useful sanity check.
It means the benchmark is actually testing the memory behaviors the system is designed for.

## My Takeaways
The most useful way to place StreamChat in this line of papers is:

> StreamChat is not a KV-cache retrieval method. It is a real-time memory architecture around a Video-LLM.

Compared with **ReKV**, it gives up the idea of preserving full model-internal historical evidence.
That makes it less fine-grained, but much more like a deployable streaming assistant.

Compared with **rLiVS**, it is less purely caption-based.
rLiVS says long-term memory can be mostly textual captions.
StreamChat says long-term memory should contain both text clues and compressed visual memory, plus dialogue history.

Compared with **StreamMem / InfiniPot-V**, it is less about bounded transformer KV cache.
It is more about application-level memory and retrieval.

I think the strongest part is the system view:
- frame filtering reduces redundant input;
- hierarchical memory keeps old context searchable;
- dialogue memory makes multi-turn interaction possible;
- parallel scheduling keeps latency low.

This is closer to how a real streaming video assistant would be built.

The weakest part is retrieval.
The paper itself notes that the retrieval algorithm is still basic.
Cosine matching over text clues and dialogue embeddings is simple, but it can retrieve the wrong memory path when the question needs fine-grained visual evidence.

> Remark: StreamChat feels like a practical bridge between Video-RAG and streaming Video-LLM systems.

## Limitations / Open Questions
- The long-term memory depends heavily on the quality of text clues / captions. If a clue misses an important detail, retrieval may not find the right memory unit.
- Retrieval is relatively simple. More fine-grained or multi-hop retrieval might help, especially for questions involving multiple distant events.
- The memory tree can still consume large VRAM as video duration and memory resolution increase.
- The official repo says the current setup needs **2x80GB GPUs**, so the system is not lightweight in practice.
- Because the memory is not the original LLM KV cache, some fine-grained information that ReKV-style systems preserve may be lost.
- The latency numbers depend on parallel scheduling and hardware. It would be interesting to see the same design under a single-GPU or edge-device constraint.
