+++
date = '2026-04-23T14:20:00+08:00'
title = 'rLiVS'
description = 'Recurrent Attention-based Token Selection for Efficient Streaming Video-LLMs.(NeurIPS 2025)'
categories = ["AI", "VLM", "paper", "RAG"]
tags = ["Video-LLM", "streaming", "token selection", "caption", "rLiVS"]
math = true
+++

Paper: [Recurrent Attention-based Token Selection for Efficient Streaming Video-LLMs](https://arxiv.org/abs/2510.17364)

Code: [vdorovatas/rLiVS](https://github.com/vdorovatas/rLiVS)

## Background
**Streaming video understanding** is hard because the model must process incoming frames online, keep useful past information, and still answer questions with low latency.

The brute-force solution is to put as many frames as possible into the context window, but this quickly becomes too expensive for long videos.

Recent papers handle this in different ways:
- **ReKV** keeps rich visual memory in the form of KV cache and retrieves it later, but memory and latency are still significant.
- **Goldfish** stores only captions for each short clip, which is cheap, but clip-to-clip continuity can be weak.

rLiVS tries to sit between these two directions:
- keep a **tiny recurrent visual memory** so the model still has short-term continuity;
- keep **textual captions** as the long-term searchable memory for question answering.

## Core Idea
rLiVS stands for **recurrent LLM-informed Visual Selection**.

The key idea is very simple:
- process the video as short clips;
- let the Video-LLM generate a caption for each clip;
- look at which visual tokens the LLM actually attended to while generating that caption;
- keep only those important visual tokens;
- feed them recurrently into the next clips;
- answer future questions using retrieved **captions**, not retrieved visual tokens.

So the method is not trying to store all past visual evidence.
Instead, it uses:
- **selected visual tokens** for short-term coherence;
- **captions** for long-range retrieval and reasoning.

The whole pipeline is **training-free** and can be plugged into an existing Video-LLM.

It's actually a **CAPTION-BASED RAG**

## Method

### 1. Short-clip processing
Given a short video clip **$V$** and an instruction prompt **$X_I$**, the backbone Video-LLM first produces visual tokens and then generates a caption:

$$
X_V = P(VE(V)), \qquad C = LLM(X_V, X_I)
$$

Here:
- **$VE$** is the visual encoder;
- **$P$** is the projector into the LLM token space;
- **$C$** is the generated text, which reflects the model's understanding of the clip.

The paper's view is that the caption is not just an output.
It is also a signal telling us **which visual tokens the model actually used**.

### 2. Attention-based visual token selection
This is the central mechanism of the paper.

After the caption is generated, rLiVS extracts the attention from caption tokens to input visual tokens.
If **$A_{l,h}$** is the attention matrix at layer **$l$** and head **$h$**, the caption-to-visual part is:

$$
A^V_{l,h} = A_{l,h}[T N_V + N_I : T N_V + N_I + N_C,\ 0 : T N_V]
$$

Then the importance score of visual token **$j$** is obtained by averaging over generated caption tokens, attention heads, and selected layers:

$$
a_j = \frac{1}{L}\sum_{l=1}^{L}
\frac{1}{H}\sum_{h=1}^{H}
\frac{1}{N_C}\sum_{i=1}^{N_C}
A^V_{l,h,ij}
$$

Finally, rLiVS keeps only the top **$N_S$** visual tokens:

$$
S = X_V[\pi(1), \pi(2), \dots, \pi(N_S), :]
$$

where **$\pi$** sorts the scores in descending order.

The nice thing here is that the method uses the LLM's own attention as a **free relevance signal**.
It does not need extra training, clustering in the high-dimensional token space, or an external retrieval encoder.

In the main setup:
- each short clip contains **16 frames**;
- LLaVA-OV contributes **196 visual tokens per frame**;
- the current clip therefore has **3136** visual tokens;
- rLiVS keeps only **196** of them, which is about **6.25%**.

### 3. Recurrent visual memory
The selected tokens from clip **$t$** are prepended to the next clip **$t+1$**.

So the model does not process each short clip independently.
Instead, it maintains a **FIFO queue** of selected tokens from recent clips and reuses them as context for the next clip.

This recurrent design helps in two ways:
- it gives the model short-term continuity across neighboring clips;
- it also influences the next round of attention-based selection, so token selection becomes history-aware.

For the LLaVA-OneVision setup in the paper:
- the 32-frame context window is split into **16 frames for the current clip** and **16 memory slots** for recurrent tokens;
- one selected-token set is stored per past clip.

This is much lighter than storing the full historical KV cache or all historical frames.

### 4. Question answering with captions
During streaming, rLiVS also stores the generated caption for each clip.

When a question arrives:
- embed the query;
- compare it with stored captions;
- retrieve the most relevant captions;
- answer the question from the retrieved captions plus the question.

The retrieval is not plain top-K cosine search.
The paper uses **MMR (Maximal Marginal Relevance)** so that retrieved captions are not too redundant with one another.

This matters because recurrent caption generation can produce neighboring captions that are semantically similar.

An interesting finding in the paper is that **captions work better than selected visual tokens** for retrieval and QA.
The reason is intuitive:
- captions and questions already live in the same text space of the LLM;
- selected visual tokens do not naturally align with question tokens for similarity search.

So rLiVS is really a **hybrid memory system**:
- short-term memory is visual and recurrent;
- long-term memory is textual and searchable.

## Experiments

### Benchmarks and implementation details
The paper evaluates on:
- **RVS-Ego** and **RVS-Movie** from Realtime VStream-QA for streaming QA;
- **MovieChat**, **VS-Ego**, **VS-Movie**, and **CG-Bench** for long-video / offline evaluation;
- **NextQA-valset** for studying token-selection quality on shorter videos.

Main implementation details:
- backbone: **LLaVA-OneVision** with **7B** and **0.5B** variants;
- additional generalization test on **Qwen2.5-VL-7B**;
- **16** frames for the current short clip and **16** memory slots for recurrent tokens;
- **196** selected tokens out of **3136** current-clip tokens;
- attention scores averaged from **4 of 28** backbone layers;
- **10K** context tokens for retrieval and answering;
- **0.5 FPS** on RVS-Movie / RVS-Ego / offline VS-Stream, **1 FPS** on MovieChat;
- experiments run on **NVIDIA A100 40GB** GPUs.

### Main results
The token-selection ablation on **NextQA-valset** is already quite strong:
- full model: **78.6**
- uniform sampling at **6%**: **75.5**
- attention-based selection at **6%**: **77.0**
- attention-based selection at **12%**: **78.4**

So even after discarding roughly **94%** of current visual tokens, the model stays very close to full performance.

On offline long-video benchmarks, rLiVS also performs strongly:
- **VS-Ego**: **61.0 / 3.9**
- **VS-Movie**: **59.3 / 3.6**
- **MovieChat**: **78.0 / 4.0**
- **CG-Bench**: **33.1**

On the streaming **RVS** benchmark, the comparison with ReKV is probably the most interesting one.

For **LLaVA-OV 7B**:
- **RVS-Ego**: **65.3** for rLiVS vs **63.7** for ReKV
- **RVS-Movie**: **57.7** for rLiVS vs **54.4** for ReKV
- **latency**: **1.9s** vs **2.7s**
- **VRAM**: **25GB** vs **36GB**

For **LLaVA-OV 0.5B**:
- **RVS-Ego**: **57.6** vs **54.7**
- **RVS-Movie**: **51.3** vs **44.6**
- **VRAM**: **11GB** vs **19GB**

The paper also plugs rLiVS into **Qwen2.5-VL-7B**, reaching **68.1** accuracy on **RVS-Ego**.

Overall, the message is:
- attention-based token selection works;
- recurrent visual memory helps;
- caption-based QA is both cheaper and stronger than expected.

### Ablations
The ablations are clean and help explain where the gains come from.

#### Effect of recurrency
Removing recurrency hurts performance clearly:
- **RVS-Ego** drops from **65.3** to **62.5**
- **RVS-Movie** drops from **57.7** to **53.7**
- **MovieChat** drops from **78.0 / 4.0** to **74.1 / 3.9**

So recurrency is not a small detail.
It is what keeps neighboring clips visually connected.

#### Captions vs selected visual tokens
For retrieval and answering, the paper reports:
- **selected visual tokens**: **58.2 / 3.9** on RVS-Ego and **48.4 / 3.5** on RVS-Movie
- **captions**: **65.1 / 4.0** on RVS-Ego and **57.7 / 3.6** on RVS-Movie
- **combination** is still worse than captions alone

This is actually a very important result.
It says the best use of selected visual tokens is **not** direct long-range retrieval.
Their real value is helping short-term recurrent understanding while the system stores long-term memory in text.

#### Attention selection vs uniform sampling
Inside the full streaming pipeline:
- **uniform sampling** gets **64.2 / 3.9** on RVS-Ego and **56.0 / 3.5** on RVS-Movie
- **attention-based selection** gets **65.1 / 4.0** on RVS-Ego and **57.7 / 3.6** on RVS-Movie

So the LLM-informed selection still helps even when everything else in the pipeline stays the same.

#### Context length
The paper also studies context length for retrieval and answering:
- **6K** context is faster but hurts performance a bit;
- **20K** does not really help over **10K** and increases latency;
- **10K** seems to be the best trade-off.

## My Takeaways
The most interesting part of rLiVS is that it does **not** insist on solving long-video QA entirely in the visual modality.

Instead, it uses a very practical decomposition:
- keep a tiny amount of visual evidence for short-term continuity;
- convert the rest into captions;
- let the final long-range reasoning happen in text.

Compared with **ReKV**, this feels much lighter.
It avoids keeping a heavy visual memory bank and avoids query-time visual retrieval over the whole history.

Compared with caption-only approaches like **Goldfish**, rLiVS still preserves some visual continuity across clips, which is exactly where pure caption pipelines are weakest.

It's a caption-based RAG system, and the question used **caption**, rather than frames

> Remark: This paper feels closer to a hybrid visual-text memory system than to a KV-retrieval paper

## Limitations / Open Questions
- The method depends a lot on **caption quality**. If an important detail is missed in the caption, long-term QA may never recover it.
- Since final retrieval and answering rely mainly on **captions**, very fine-grained spatial evidence may still be lost.
- Selected tokens keep **temporal order** but not the full original spatial layout. The paper says this is fine empirically, but this may become trickier in newer VLMs.
- Token selection is **instruction-sensitive**. That is powerful, but it also means prompt design may affect what survives in memory.
- The recurrent visual memory is still **short-term and bounded**; very long-range evidence is mostly summarized into text rather than preserved visually.
