+++
date = '2026-07-24T02:01:09+08:00'
title = 'OASIS'
description = 'Hierarchical external event memory and agentic on-demand retrieval for streaming video reasoning.'
venue = 'CVPR 2026'
math = true
categories = ["AI", "VLM", "paper", "RAG"]
tags = ["Video-LLM", "streaming", "long video", "memory", "retrieval", "agent", "OASIS"]
decor_image = "images/bg4.png"
+++

Paper: [OASIS: On-Demand Hierarchical Event Memory for Streaming Video Reasoning](https://arxiv.org/abs/2604.17052)

PDF: [CVPR 2026 Open Access](https://openaccess.thecvf.com/content/CVPR2026/papers/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.pdf)

Code: [Solus-sano/OASIS](https://github.com/Solus-sano/OASIS)

## Core Idea

OASIS is a training-free external memory and agentic RAG system for streaming video. It organizes the past into an online event hierarchy, reasons from a small working context by default, and retrieves historical keyframes only when the MLLM decides that more evidence is needed.

The method can be summarized as:

> short/medium visual working memory + an online tree of event summaries and keyframes + prompt-based history routing + planned-query retrieval.

OASIS does not compress or retrieve the Video-LLM's internal KV cache. Its memory carriers are raw or downsampled frames, MLLM-generated summaries, text embeddings, and historical question-answer pairs. In the broader streaming pipeline, it is an **external hierarchical episodic memory**, not a KV-cache method.

| Component | Representation | Main role |
|---|---|---|
| Short Window | Recent high-rate frames | Ground questions about the present |
| Medium Buffer | Wider, lower-rate recent frames | Preserve recent non-immediate events |
| Event Forest | Keyframes, text summaries, embeddings, hierarchy | Index long-term video history |
| QA Memory | Rolling summary and embedded QA pairs | Preserve multi-turn references and naming |
| Two-phase reasoning | MLLM answer or tool call | Decide whether to access long-term memory |

This makes OASIS conceptually closer to a streaming VideoTree plus Self-RAG than to ReKV or InfiniPot-V.

## Motivation: Long History Is Also a Distractor

The paper argues that streaming video is not difficult only because the history is long. The more important problem is that the evidence needed by a particular question is usually sparse.

Two naive strategies fail in opposite ways:

- stacking a large visual history into the context can distract the model with old but salient events;
- permanently compressing the history can destroy a brief detail that becomes important to a future question.

This is especially visible for questions about the present. A model that sees several minutes of frames may answer from an older visually obvious event even when the question contains a cue such as *now* or *currently*.

OASIS therefore treats streaming reasoning as **temporal routing**. The normal path should stay focused on a small recent context. Long-term history should be accessed only when that context does not settle the question.

## Pipeline

```text
Incoming video frames
        |
        +--> high-rate Short Window
        |
        +--> lower-rate Medium Buffer
        |
        +--> periodic segment summarization
                  |
                  v
             new event leaf
                  |
                  v
          online Event Forest merge

Question arrives
        |
        v
Coarse reasoning with:
Short Window + Medium Buffer
+ root summaries + QA summary
        |
        +--> answer directly
        |
        +--> emit a retrieval tool call
                  |
                  v
        generate an internal evidence query
                  |
                  v
        retrieve event nodes and old QA
                  |
                  v
        load historical keyframes and answer again
```

## Hierarchical Event Memory

### 1. High-Fidelity Short Window

The Short Window retains the most recent frames at the highest rate. The default experiment uses:

- an 8-second duration;
- 2 fps sampling;
- approximately 16 frames.

This window preserves small and transient visual changes. It is also a deliberate attention constraint: current-scene questions are answered without forcing the model to compete with the whole past.

### 2. Medium-Resolution Buffer

The Medium Buffer covers a wider recent range at a lower frame rate:

- a 32-second duration;
- 1 fps sampling;
- approximately 32 frames.

It catches events that have left the 8-second Short Window but are still too recent to be represented only by a long-term summary.

### 3. Event Forest

The Event Forest stores long-term video history as a multi-resolution tree. For every fixed, non-overlapping input window, OASIS uniformly selects up to 16 keyframes and asks the same MLLM used for QA to produce a factual event summary.

An event node is represented as:

$$ R_j=\left([t_s^{(j)},t_e^{(j)}],F_j,s_j,e_j,d_j\right), $$

where:

- $[t_s^{(j)},t_e^{(j)}]$ is the temporal interval;
- $F_j$ is the retained keyframe set;
- $s_j$ is the MLLM-generated summary;
- $e_j=E(s_j)$ is its text embedding;
- $d_j$ is the hierarchical depth.

New stream segments enter the forest as level-0 leaves. Despite the terminology, leaf boundaries are not discovered by a learned event detector: the initial leaves are fixed-duration video chunks. Their event semantics come from the generated summary and later merging.

### 4. Online Node Merging

Only a small number of root nodes are allowed to remain in the coarse memory. The experiments cap the root set at $n_r=4$.

When inserting a new leaf exceeds this budget, OASIS considers temporally adjacent root pairs and scores them by:

$$ \operatorname{score}(R_j,R_k)=\cos(e_j,e_k)-\lambda(d_j+d_k). $$

The first term prefers merging semantically similar adjacent events. The depth penalty discourages repeatedly merging already abstract nodes and producing a single excessively coarse history.

The best pair is replaced by a parent node whose:

- interval spans both children;
- keyframes are uniformly resampled from their combined frames;
- summary is generated by merging the two child summaries;
- embedding is recomputed from the merged summary;
- depth is $\max(d_j,d_k)+1$.

This is an online agglomerative hierarchy. Four root summaries provide a compact view of the whole stream, while the descendants preserve multiple temporal resolutions for later retrieval.

### 5. QA Memory

After every question, OASIS stores the question-answer pair and its embedding. It also uses the MLLM to update a rolling QA summary capped at roughly 300 words.

The compact summary is always available during coarse reasoning. Individual historical QA pairs can be retrieved later to resolve entity names, pronouns, or dependencies across multiple questions.

## Two-Phase Reasoning

### Coarse Reasoning: Answer from the Present First

For a question $q_i$, the initial MLLM context contains:

$$ C_{\mathrm{coarse}}=W_s\oplus W_m\oplus\{s_r:r\in\mathrm{roots}\}\oplus s_{\mathrm{QA}}. $$

The model is prompted to inspect the current evidence and either:

- produce a final answer inside `<answer>...</answer>`; or
- emit a `<tool_call>` requesting historical retrieval.

There is no entropy threshold, confidence head, or trained router. The paper's phrase *when uncertainty arises* means prompt-based MLLM self-assessment rather than a calibrated uncertainty signal.

This is an important difference from WeaveTime:

```text
WeaveTime: predictive entropy --> retrieve historical KV
OASIS:     MLLM tool decision --> retrieve external event frames
```

### Fine Reasoning: Plan, Retrieve, and Answer

When retrieval is triggered, the MLLM generates a short internal query $I_i$ describing the evidence it wants to find. It can incorporate entities, actions, locations, colors, counts, and other clues inferred from the recent frames and root summaries.

For example:

```text
Raw question:
Were there any teddy bear dolls in the classroom?

Planned retrieval query:
stuffed animals on bookshelf behind the woman
```

The query is embedded with Qwen3-Embedding-0.6B. OASIS then ranks all event nodes using cosine similarity:

$$ \operatorname{sim}(I_i,R_j)=\cos(E(I_i),e_j). $$

The default configuration retrieves two event nodes and one historical QA pair. The selected nodes contribute their saved keyframes, not only their summaries, so the MLLM can inspect higher-fidelity visual evidence during a second generation pass.

### Hierarchical Deduplication

Because the candidate set contains leaves and their ancestors, ordinary top-$K$ retrieval can select two versions of the same event. OASIS uses greedy lineage pruning:

1. select the highest-scoring node;
2. remove its ancestors and descendants from the candidate set;
3. select the next node from a different branch.

This allows the retriever to choose an appropriate granularity without spending both retrieval slots on one temporal region.

## What “Semantic Retrieval” Actually Means

The paper contrasts OASIS with retrieval based on embedding similarity. The implementation still uses embedding cosine similarity for ranking. The real change is earlier in the process:

```text
Naive RAG:
raw user question --> embedding search

OASIS:
question + recent frames + root summaries
    --> MLLM-generated evidence description
    --> embedding search
```

The contribution is therefore **context-conditioned query rewriting**, not the replacement of vector retrieval itself.

This distinction matters because retrieval can still fail if:

- the event summary omitted a future-relevant visual detail;
- the summary embedding does not represent the rewritten query;
- the MLLM generates the wrong evidence hypothesis;
- repeated summary merging introduces semantic drift.

## Evaluation

The main experiments use Qwen3-VL-8B, Qwen2.5-VL-7B, and GLM-4.6V under a causal online protocol. OASIS uses the same MLLM for segment summarization, node merging, QA-summary updates, and answer generation.

### OVO-Bench

| Backbone and method | Perception | Backward |
|---|---:|---:|
| Qwen2.5-VL-7B | 60.93 | 50.24 |
| + OASIS | **67.26** | **52.61** |
| Qwen3-VL-8B | 66.79 | 51.19 |
| + OASIS | **78.14** | **57.21** |
| GLM-4.6V | 54.96 | 51.35 |
| + OASIS | **68.39** | **55.27** |

The large Perception gains are as important as the Backward gains. They show that a major benefit comes from preventing old visual evidence from contaminating questions about the present, not only from improving historical retrieval.

The smaller gains on Qwen2.5-VL also reveal that the framework depends on the base model's instruction-following, tool-calling, and evidence-planning ability.

### StreamingBench

| Qwen3-VL-8B setting | Real-Time All | ACU | MCU | SQA |
|---|---:|---:|---:|---:|
| Baseline | 72.83 | 35.63 | 35.74 | 43.90 |
| + OASIS | **78.22** | **42.74** | **49.60** | **48.40** |

The largest gain appears on Misleading Context Understanding, which is explicitly designed to expose distraction from similar historical scenes. This matches the Short-Window-first design.

### What the Ablations Show

The retrieval-policy ablation is especially informative:

| Reasoning policy | Perception | Backward |
|---|---:|---:|
| Without RAG | 76.19 | 55.22 |
| Raw-query naive RAG | 78.01 | 56.13 |
| Planned-query OASIS | **78.14** | **57.21** |

Relative to raw-query retrieval, the planned internal query contributes only +0.13 Perception and +1.08 Backward. OASIS's total improvement is much larger, but most of it comes from the working-memory layout, bounded root summaries, and access to an event index rather than query rewriting alone.

The memory ablation shows the intended trade-off:

- Short Window alone gives strong current perception but weaker historical recall.
- Medium Buffer improves recent backward recall but can introduce more distraction.
- adding the Event Forest to both produces the best joint result.

## Efficiency and the Meaning of “Bounded”

### Active Context

The MLLM context is bounded by fixed budgets:

- 16 recent frames;
- 32 medium-buffer frames;
- at most four root summaries;
- a capped QA summary;
- two retrieved event nodes and one retrieved QA pair.

The paper reports that full-context token consumption grows to 29,517 tokens on StreamingBench, while OASIS stays much closer to roughly 10K--15K tokens across the tested datasets. Peak GPU memory on OVO-Bench falls from 76.59 GB for the full-context Qwen3-VL baseline to 28.48 GB for OASIS on an A800 80GB GPU.

### Total Historical Storage

The complete historical memory is not bounded in the same sense.

The public [Event Forest implementation](https://github.com/Solus-sano/OASIS/blob/main/src/oasis/event/forest.py) retains every leaf and merged parent in `self.nodes`, including their frame references, summaries, and embeddings. It also keeps all historical QA nodes. Only the number of active roots is capped.

Fine retrieval stacks and scores the embeddings of all nodes. As a stream becomes truly infinite:

- external frame storage continues to grow;
- the node and QA indices continue to grow;
- brute-force retrieval cost grows with the history length.

OASIS therefore provides **bounded active MLLM context and bounded root summaries**, not bounded total CPU or disk memory.

### Latency

On one A800 GPU, the reported timing is:

| Operation | Time |
|---|---:|
| Baseline end-to-end query | 4.14 s |
| OASIS end-to-end query | 6.52 s |
| Embedding and retrieval | 0.11 s |
| Coarse MLLM inference | 3.45 s |
| Fine MLLM inference, if triggered | 3.06 s |
| Generate an event node | 7.73 s |
| Merge two roots | 6.52 s |

Retrieval itself is cheap, but two-stage generation increases complete answer latency by about 57% over the single-pass baseline. The reported Request Processing Delay of 0.19 seconds measures how quickly request handling starts, not when the final answer is completed.

Node generation and root merging are performed asynchronously while video continues. The default 32-second segment interval leaves enough nominal time for these operations, but contention between maintenance and a sudden user query on the same GPU is not fully evaluated.

## Relation to Previous Work

The basic ingredients have clear precedents.

[VideoTree](https://openaccess.thecvf.com/content/CVPR2025/html/Wang_VideoTree_Adaptive_Tree-based_Video_Representation_for_LLM_Reasoning_on_Long_CVPR_2025_paper.html) already constructs a query-adaptive hierarchical representation for long-video reasoning. Its video is fully available and the tree is built for a known query, while OASIS maintains a reusable tree online before future queries are known.

[HEM-LLM](https://arxiv.org/abs/2409.06299) models long videos as a hierarchy of event memories, and [Hierarchical Event Memory for Online Video Temporal Grounding](https://openaccess.thecvf.com/content/ICCV2025/html/Zheng_Hierarchical_Event_Memory_for_Accurate_and_Low-latency_Online_Video_Temporal_ICCV_2025_paper.html) brings multi-scale event memory into an online task under a limited budget.

The plan--retrieve--answer policy follows the broader line of iterative and agentic RAG: use the model's intermediate hypothesis to form a better search query instead of assuming that the raw user question is already an ideal retrieval key.

OASIS's contribution is therefore integration-level:

```text
online event hierarchy
    + recent high-resolution context
    + bounded root summaries
    + rolling QA memory
    + prompt-based history routing
    + planned-query keyframe retrieval
```

## Paper and Code Details

Several implementation details deserve attention when reproducing the paper.

First, the paper prompt says the model *can* call retrieval when necessary. The current [query prompt](https://github.com/Solus-sano/OASIS/blob/main/src/oasis/model.py) more strongly instructs the model to call `rag_retrieval` after thinking. If followed literally, this weakens the adaptive no-retrieval path described in the method.

Second, the paper describes retrieving historical QA with the planned internal query $I_i$. The current code calls `retrieve_QA(query)` with the original user question instead of the generated retrieval text.

Third, the forest code records each merged parent's `children`, but does not visibly update each child's `parent` field during merging. Descendant pruning works when a parent is selected first, but ancestor pruning may not work as described when a leaf is selected first. The exact parent--child deduplication behavior should be verified in a reproduction.

## Limitations

- **The router is prompted, not learned.** Strong results depend on the base MLLM correctly deciding when to search and producing a useful evidence description.
- **Summaries control discoverability.** Raw keyframes may still exist, but a detail omitted from the event summary is unlikely to be retrieved because search operates over summary embeddings.
- **Repeated merging can drift.** Parent summaries are produced from child summaries rather than fresh inspection of every original frame, allowing omission and hallucination to accumulate.
- **Leaves are fixed windows rather than detected events.** The semantic event structure emerges from summarization and merging, not explicit boundary detection.
- **Active context is bounded, total memory is not.** All nodes, keyframes, embeddings, and QA pairs continue to accumulate.
- **Retrieval remains embedding-based.** Query planning improves the search key but does not solve embedding-index failures.
- **The planned-query gain is modest.** Ablations attribute only a small part of the final improvement to query rewriting over naive RAG.
- **Answer latency increases.** On-demand retrieval saves context tokens and GPU memory but can require a second full MLLM generation.
- **Long-horizon evidence is still limited.** HourVideo improves only from 35.11 to 37.35; the larger long-clip OVO gains are measured on only 37 Perception and 10 Backward examples.

## Takeaways

OASIS is best understood as a **semantic read policy over an external event memory**.

Compared with the preceding papers:

- STC decides which visual patches should be computed and written into the LLM.
- InfiniPot-V decides which generated KV states should survive under a memory budget.
- ReKV retrieves historical KV after a question arrives.
- WeaveTime adds an entropy-based decision about whether historical KV is needed.
- OASIS replaces the KV history with a navigable hierarchy of summaries and keyframes, and replaces entropy routing with MLLM tool use.

The strongest idea is not the particular merging score. It is the decomposition of memory access into three semantic decisions:

1. Is the recent visual context sufficient?
2. If not, what missing evidence would make the answer decidable?
3. At what temporal granularity should that evidence be retrieved?

The main open direction is to learn these decisions instead of relying on prompts. A stronger streaming memory system would jointly train evidence-need estimation, future-value-aware memory writing, hierarchy construction, and cost-aware retrieval while keeping both the active context and total storage genuinely bounded.

OASIS is a useful systems composition rather than a new primitive. Its value is showing that present grounding, historical organization, and retrieval planning should be designed together instead of treating all stored history as equally relevant to every question.
