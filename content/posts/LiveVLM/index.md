+++
date = '2026-04-25T01:44:44+08:00'
lastmod = '2026-06-08T15:26:57+08:00'
title = 'LiveVLM'
description = 'Efficient Online Video Understanding via Streaming-Oriented KV Cache and Retrieval.'
venue = 'DAC 2026'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "retrieval", "compression", "LiveVLM"]
# Set to true on posts that need LaTeX rendering.
math = true
+++

Paper: [LiveVLM: Efficient Online Video Understanding via Streaming-Oriented KV Cache and Retrieval](https://arxiv.org/abs/2505.15269)

Code: [sjtu-zhao-lab/LiveVLM](https://github.com/sjtu-zhao-lab/LiveVLM)

## Background
**Online video understanding** is harder than offline long-video QA.

In the offline setting, the model usually receives a video and a question together.
It can then sample, compress, or retrieve content with the query already known.

In the online setting, the model has two separate phases:
- **encoding phase**: video frames arrive continuously before any question appears;
- **response phase**: when a user asks a question, the model should answer quickly from the already processed stream.

This creates three constraints at the same time:
- **quality**: the model should not forget long-term details;
- **overhead**: the KV cache cannot grow linearly forever;
- **speed**: answering should not require re-prefilling the whole video.

Existing directions each miss one part of this triangle:
- query-dependent compression can be accurate, but the query is unknown during streaming;
- vision-token pruning still requires expensive prefill over retained visual tokens at question time;
- ReKV preserves fine-grained historical KV cache, but CPU offloading and query-time loading become slow;
- fixed-budget KV compression methods are fast, but may discard details needed by future questions.

LiveVLM tries to combine the useful pieces:
> keep a compact streaming KV cache, then retrieve only query-relevant KV pages when the question arrives.

## Core Idea
LiveVLM is a **training-free, query-agnostic framework** for online video understanding.

The key idea is:
- process incoming video clips as they arrive;
- generate visual KV cache online instead of waiting for a question;
- keep recent KVs as short-term memory;
- compress older KVs into a long-term memory using **Vision Sink Bucketing (VSB)**;
- when a question arrives, use **Position-agnostic KV Retrieval (PaR)** to fetch relevant long-term KV pages;
- answer with both retrieved long-term KVs and recent short-term KVs.

So LiveVLM is not pure retrieval like ReKV, and not pure fixed-memory compression like StreamMem.
It is closer to:
> query-agnostic compression during streaming + query-aware retrieval during answering.

The two central mechanisms are:
- **VSB**: decide which historical visual KVs should survive compression;
- **PaR**: retrieve useful compressed KVs without being confused by discontinuous positional embeddings.

## Key Insights

Before going into the pipeline, there are three key insights worth separating from the implementation details.

### 1. Vision-to-vision attention is more useful for streaming compression
Many KV compression methods use **text-to-vision attention** to decide which visual tokens are important.
This is natural when the user query is already known.

But in online video understanding, future questions are unknown during the encoding phase.
So the text tokens available at compression time are not necessarily good indicators of what should survive.

LiveVLM instead looks at **vision-to-vision attention**.
The paper observes that some visual tokens consistently attract attention from other visual tokens.
These are called **sink vision tokens**.

The intuition is:
- if many later visual tokens attend to a token, this token affects future visual computation;
- discarding it may change the attention output of future tokens;
- such errors can accumulate over a long stream.

So the first insight is:
> For query-agnostic streaming compression, important visual tokens may be better found by other visual tokens, not by text tokens.

### 2. Pure TopK attention is too local
After switching to vision-to-vision attention, a naive solution would be:
> keep the top-**M** visual tokens with the largest attention scores.

But this can still fail.
Some high-score tokens are only locally important:
- they receive attention from nearby visual tokens;
- but they may not matter for later video content;
- TopK can overfill the cache with tokens from one local temporal region.

LiveVLM's answer is **bucketing**.
It keeps high-score tokens, but also forces the retained tokens to cover different parts of the video timeline.

So the second insight is:
> A good long-term video cache needs both saliency and temporal coverage.

### 3. Compressed KV retrieval should be position-agnostic
LiveVLM still needs retrieval at question time because the compressed cache is query-agnostic.
But retrieval over compressed KV pages has a subtle problem.

Compression removes tokens, so the retained tokens may come from discontinuous original positions.
Their key tensors already contain positional embeddings.
If we average these position-mixed keys into a page representative, the representative can become noisy.

The paper shows this clearly on MLVU:
- LiveVLM without retrieval: **66.2**
- retrieval **without** positional embeddings: **68.1**
- retrieval **with** positional embeddings: **64.8**

So the third insight is:
> Use position information for final reasoning, but remove it when computing retrieval similarity.

## Method

### Pipeline Overview
The complete LiveVLM pipeline has two phases.

During the **encoding phase**:
- video clips arrive continuously;
- the Video LLM encodes each clip and produces visual KV cache;
- recent KVs are kept in **short-term memory**;
- older KVs are moved into **long-term memory** by FIFO update;
- long-term memory is compressed by **VSB** under a fixed cache budget.

During the **response phase**:
- a user question arrives;
- the question is encoded into query tensors;
- **PaR** retrieves relevant pages from compressed long-term memory;
- full short-term KVs are kept for recent details;
- retrieved long-term KVs and short-term KVs are fed to the LLM for answer generation.

This order is important.
VSB happens before the question is known.
PaR happens after the question is known.

### 1. Online Encoding
LiveVLM processes the video stream clip by clip.

For each incoming video clip:
- frames are converted into visual features by the visual encoder;
- visual features are projected into the LLM token space;
- the Video LLM performs forward computation;
- visual **KV cache** is generated and stored.

The key difference from offline video QA is that this computation happens **before** the user asks a question.
So when a question finally arrives, the system does not need to prefill the whole video again.

This is the same broad motivation as ReKV:
> decouple video encoding from question answering by reusing video KV cache.

But unlike ReKV, LiveVLM does not try to preserve the full historical cache through CPU offloading.
It keeps a bounded streaming cache.

### 2. Memory Update: Short-term and Long-term KV
LiveVLM organizes the cache into two memories.

**Short-term memory** stores the most recent KVs in full.
This part is not compressed, because recent video content often contains fine-grained details needed by immediate questions such as:
> "How many people are there in the video now?"

**Long-term memory** stores older KVs under a fixed budget.
This part is compressed by VSB, because keeping every historical KV would make memory grow linearly with video length.

The update rule is FIFO-like:
- new clip KVs enter short-term memory;
- when KVs become old, they are moved toward long-term memory;
- if long-term memory exceeds the cache budget, VSB compresses it.

So the memory design is:
- short-term memory = high-resolution recent context;
- long-term memory = compressed historical context.

### 3. VSB Compression for Long-term Memory
VSB is the compression module used during the encoding phase.

Its job is:
> compress historical visual KVs without knowing future questions.

VSB starts by computing partial **vision-to-vision attention**.
Instead of materializing full attention matrices, it uses the last **$r$** vision tokens as an observation window.
Let:
- **$L$** be the current context length;
- **$K \in \mathbb{R}^{L \times d}$** be cached key tensors;
- **$Q_i$** be the query tensor of the **$i$**-th recent vision token.

The paper writes the score computation as:

$$
W = \operatorname{softmax}
\left(
\{Q_i\}_{i=L-r}^{L} K^\top
\right),
\qquad
S = \operatorname{MeanPool}(\{W_i\}_{i=1}^{r}).
$$

Here **$S \in \mathbb{R}^{L}$** is the importance score for each vision token.

The important systems detail is that LiveVLM does not need full attention matrices.
It only computes attention from a small recent observation window, and the paper reports less than **1%** extra compute and memory overhead.

Then VSB performs bucketed selection:
- sort all vision tokens by their importance scores;
- divide the original context into **$N$** temporal buckets;
- each bucket has capacity **$B$**;
- the total cache budget is **$M = N \times B$**;
- first greedily place the top-**R** highest-score tokens into buckets;
- then scan remaining tokens in descending score order and keep a token only if its bucket still has space;
- finally concatenate the retained tokens in bucket order to form the compressed cache.

This is a small but useful twist.
VSB is not just "keep the largest attention scores".
It says:
> high score matters, but temporal coverage also matters.

This helps LiveVLM keep more possible answer tokens than plain TopK, especially in shallow layers.

### 4. Response Phase: A Question Arrives
When a user question arrives, LiveVLM does not send the entire compressed cache into the model.

The reason is simple:
- VSB is query-agnostic;
- it tries to preserve generally useful visual information;
- but a specific question only needs part of the long-term cache;
- feeding all compressed historical KVs can introduce irrelevant context.

So the response phase uses both memory components differently:
- **short-term memory** is used directly, because recent details are valuable and small enough;
- **long-term memory** is retrieved with PaR, because older compressed content may contain lots of irrelevant information.

This is the second half of LiveVLM's design:
> compress query-agnostically, retrieve query-awarely.

### 5. PaR Retrieval from Long-term Memory
PaR stands for **Position-agnostic KV Retrieval**.

Its purpose is to retrieve useful pages from the compressed long-term KV cache.

Page-level KV retrieval usually works by:
- splitting cached KVs into pages;
- averaging keys inside each page to get a representative key;
- comparing the question query with each page key.

However, this becomes tricky after VSB compression.
After KV compression, retained tokens may come from discontinuous original positions.
Their key tensors already include positional embeddings from different places.
If we average these position-mixed keys directly, the page representative becomes noisy.

PaR solves this by separating retrieval from reasoning:
> remove positional embeddings during retrieval, then restore them for final reasoning.

> Remark: This is like ReKV

The PaR process is:
- encode the user question and obtain query tensors;
- remove positional embeddings from cached key tensors;
- partition the position-agnostic keys into pages of size **$C$**;
- average keys inside each page to get a representative page key;
- compute simplified attention between question queries and page keys;
- retrieve the highest-scoring KV pages;
- restore positional embeddings to the retrieved keys;
- feed retrieved long-term KVs plus full recent short-term KVs into the Video LLM.

This decouples two things:
- **retrieval** should depend on semantic similarity, so positions are removed;
- **reasoning** still needs positional information, so positions are restored afterwards.

This is the part that makes page-level retrieval usable on compressed KV caches.

### 6. Answer Generation and Complexity
After PaR finishes, LiveVLM feeds the following context into the LLM:
- the user question tokens;
- retrieved long-term KV pages;
- full short-term KV cache.

The model then generates the answer with both:
- fine-grained recent information from short-term memory;
- query-relevant historical information from long-term memory.

Because video KVs are already generated during streaming, the response phase no longer needs to prefill the entire video.
Answering mainly computes interactions between text query tensors and selected video KVs.

The paper describes this as reducing response computation from roughly:

$$
O(n^2)
$$

to approximately:

$$
O(n)
$$

with respect to the retained video context.

This is why LiveVLM can be much faster than methods that need to re-process all retained vision tokens after the question arrives.

## Experiments

### Benchmarks and Setup
The paper evaluates LiveVLM on both offline and online video QA benchmarks.

Offline benchmarks:
- **LongVideoBench (LVB)**
- **MLVU**
- **VideoMME** without subtitles

Online benchmarks:
- **RVS-Ego**
- **RVS-Movie**
- **StreamingBench**

Main setup:
- backbone: **LLaVA-OneVision-Qwen2-7B-OV**
- precision: **FP16**
- GPU: **NVIDIA 4090D 24GB**
- cache budget: **12k tokens**
- bucket capacity: **$B=1$**
- PaR page size: **$C=16$**
- retrieval ratio: **40%**

This 24GB setting is important.
It makes the comparison closer to a practical single-GPU online setup.

### Offline Long-video Results
On offline long-video benchmarks, LiveVLM is very competitive with the strongest online KV methods.

For **LLaVA-OneVision-7B**:
- base model: **55.6** on LVB, **64.7** on MLVU, **56.9** on VideoMME-All;
- ReKV: **55.8 / 68.2 / 58.3**;
- StreamMem: **54.4 / 66.9 / 59.4**;
- LiveVLM: **56.1 / 68.1 / 59.6**.

The MLVU score is almost tied with ReKV, while LiveVLM gets the best LVB and VideoMME-All scores among the listed online methods.

The VideoMME split is also useful:
- Medium: **57.0**
- Long: **51.3**
- All: **59.6**

So the method is not only improving short clips; it helps more on long-form video as well.

### Online RVS Results
On **RVS-Ego** and **RVS-Movie**, the paper compares under a 24GB GPU constraint and avoids CPU offloading for fairness.

Average results:
- ReKV with CPU offloading: **59.0 / 3.8**
- ReKV without offloading: **53.3 / 3.4**
- Flash-VStream: **55.0 / 3.6**
- InfiniPot-V: **54.6 / 3.5**
- StreamMem: **55.2 / 3.6**
- LiveVLM: **55.6 / 3.8**

The interesting point is that ReKV with offloading still has higher accuracy, but its latency is much worse.
Under the no-offloading memory-constrained setting, LiveVLM is the strongest overall.

### StreamingBench Results
On StreamingBench, LiveVLM is especially strong.

Overall accuracy:
- LLaVA-OneVision-7B: **58.85**
- ReKV-7B: **57.20**
- GPT-4o: **62.50**
- LiveVLM-7B: **63.10**

The paper reports a **4.25 percentage point** improvement over the foundation LLaVA-OneVision-7B.

This is a nice result because StreamingBench is closer to the online interaction setting than pure offline long-video QA.

### Efficiency
The paper measures memory and Time-To-First-Token (TTFT) across different frame budgets.

At **256 frames**, LiveVLM reduces peak GPU memory by:
- **3.02x** compared with Dispider;
- **1.19x** compared with ReKV.

For response latency, LiveVLM gives:
- **1.73x** speedup over ReKV.

This is the practical value of combining online KV generation, bounded compression, and query-time retrieval.

### Ablations

#### Contribution of VSB and PaR
On MLVU:
- without VSB / PaR: **64.7**
- VSB only: **66.2**
- VSB + PaR: **68.1**

So VSB helps by allowing more video frames to be streamed under the same memory budget.
PaR then helps because feeding the whole query-agnostic cache includes too much irrelevant context.

#### Retrieval ratio
The retrieval ratio controls what fraction of the compressed cache is retrieved at question time.

On MLVU:
- **0.2** ratio: **66.4**
- **0.4** ratio: **68.1**
- **0.6** ratio: **66.7**
- **0.8** ratio: **66.2**
- **1.0** ratio: **66.2**

The best ratio is **0.4**.

This is an important result:
> retrieving more cache is not always better.

Once the relevant evidence is already covered, extra KV pages mainly add irrelevant context and can hurt the answer.

## My Takeaways

The key methods are: **VSB** and **PaR**.

### VSB
VSB uses vision-to-vision attention, rather than text-to-vision. This need to evaluate. I think these two methods capture different kinds of key information.

Bucket selection is interesting, it can solve the problem of polarized distribution of attention score.

### PaR
This is simple. The novelty is using paged retrieval. Maybe come from paged attention of vllm.

## Limitations / Open Questions
- VSB is still query-agnostic. If compression discards a detail, PaR cannot recover it later.
- The method depends on the existence of stable vision-to-vision attention sink patterns. It would be useful to test this across more VLM backbones.
- PaR assumes positional information can be removed and restored cleanly. This may become more complicated in newer models with more involved positional schemes.
- Page size and retrieval ratio matter. The default **$C=16$** and **40%** retrieval ratio work well here, but they are still hyperparameters.
- The long-term cache is compressed, so very fine-grained spatial evidence may still be lost under tight memory budgets.
