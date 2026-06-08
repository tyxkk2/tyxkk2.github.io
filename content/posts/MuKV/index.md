+++
date = '2026-06-05T22:50:59+08:00'
lastmod = '2026-06-08T15:26:57+08:00'
title = 'MuKV'
description = 'Multi-grained KV-cache compression for long streaming VideoQA.'
venue = 'CVPR 2026'
categories = ["AI", "VLM", "paper", "KV cache"]
tags = ["Video-LLM", "streaming", "long video", "retrieval", "compression", "KV cache", "MuKV"]
math = true
decor_image = "images/bg2.png"
+++

Paper: [MuKV: Multi-Grained KV Cache Compression for Long Streaming Video Question-Answering](https://arxiv.org/abs/2605.22269)

Code: [IMBALDY/MuKV](https://github.com/IMBALDY/MuKV)

## Background
Long streaming VideoQA has a simple but painful constraint:
the video keeps arriving, while the future user questions are unknown.

KV-cache methods such as ReKV make this setting more practical.
Instead of recomputing historical video tokens when a question arrives, the model can prefill the video stream in advance, store the visual KV cache, retrieve the relevant cache blocks later, and answer with much lower online cost.

But storing one KV block per frame is still a rough representation:
- it keeps a lot of redundant visual tokens;
- it mostly treats every frame as the same kind of memory unit;
- it can miss region-level visual details inside a frame;
- it can miss segment-level temporal context across frames.

MuKV asks a direct question:
> If the video contains information at different scales, why should the KV memory only have one scale?

## Core Idea
MuKV stores historical video KV cache at **three granularities**:
- **segment-level KV** for event and narrative context;
- **frame-level KV** for the representative visual state;
- **patch-level KV** for local region details.

Then it controls memory growth with a **dual-signal KV-cache compression** module.
The compression score combines:
- self-attention importance, which is already available during LLM prefill;
- frequency-domain signal from key vectors, which helps identify visual variation and correct the positional bias of attention scores.

At question time, MuKV retrieves from all three granularities.
It first performs parallel retrieval with the question as query, then applies a segment-guided reranking step so lower-level frame and patch matches remain consistent with the broader segment context.

So the main contribution is not only "compress KV cache".
It is:
> represent the past video at multiple semantic scales, compress each scale, and retrieve with enough hierarchy to reduce noise without fully trusting a coarse top-level decision.

## Key Observations

### 1. Segment memory is surprisingly important
The ablation shows that segment-level KV alone is stronger than patch-only or frame-only memory on the paper's long streaming benchmarks.

This makes sense.
Many streaming questions are not just asking "what object is visible now?".
They ask about actions, causes, summaries, and what happened earlier.
Those signals are naturally segment-level.

But segment memory alone is not enough.
The best result comes from using all three granularities together:
segment for context, frame for visual state, and patch for local details.

### 2. Attention is useful, but biased
Self-attention is a convenient pruning signal because it comes almost for free from the prefill pass.
However, the paper observes that attention scores often favor earlier tokens and can be less sample-specific than desired.

MuKV adds a frequency signal from the key vectors.
The intuition is video-specific:
- static or redundant regions tend to have lower-frequency patterns;
- foreground details and rapid motion often create stronger high-frequency components.

In the ablation, keeping high-frequency tokens works better than keeping low-frequency tokens.
The useful part is not FFT itself, but the fact that it gives compression a task-agnostic visual-variation signal.

### 3. Pure parallel retrieval is noisy, pure hierarchy is brittle
Parallel retrieval across all granularities is flexible, but it may overreact to local visual matches.
A patch can be similar to the question while still belonging to an irrelevant moment.

Naive hierarchical retrieval has the opposite problem.
If the top segment retrieval is wrong, lower-level retrieval is trapped inside the wrong region of memory.

MuKV uses a middle path:
- retrieve candidates from patch, frame, and segment memory in parallel;
- use top segment candidates to build a global segment query;
- rerank frame and patch candidates by combining their original question score with segment-level consistency.

This is why the paper calls the retrieval **semi-hierarchical**.

## Method

MuKV can be read as a four-stage system:

1. split the stream into segments and build three token views;
2. prefill each view to obtain KV cache blocks;
3. compress each block with a dual signal;
4. retrieve and rerank blocks when a question arrives.

I will use the paper notation first, then add code-level notes from the official implementation.

### 1. Streaming Setup
The task input is a video stream

$$
\mathcal{V}=\{f_t\}_{t=1}^{T}
$$

and questions

$$
\mathcal{Q}=\{q_i\}_{i=1}^{M}
$$

asked at timestamps $\{t_i\}_{i=1}^{M}$.
For question $q_i$, the model may only use video content before $t_i$.

This matters because the question is unknown during video encoding.
So the offline memory cannot be question-specific.
It must preserve generally useful visual evidence, then let retrieval specialize the memory at QA time.

The official code follows this streaming constraint directly.
In `run_mukv_rvs_ego.py`, each question advances an encoded frame pointer and only calls `encode_video(...)` for the newly arrived frames up to the question timestamp.

### 2. Three Token Views Per Segment
Assume a segment $v_t$ contains $F$ frames and each frame has $P$ visual tokens.
For LLaVA-OneVision, the code uses $P=196$ visual tokens per frame.

MuKV builds three granularities:

$$
g \in \{p, f, v\}
$$

where:

$$
|p_{f_t}|=\lfloor P/S \rfloor,\quad |f_t|=P,\quad |v_t|=P F.
$$

Here:

- $p_{f_t}$ is the patch / super-patch view of the middle frame;
- $f_t$ is the middle-frame view;
- $v_t$ is the whole-segment view.

In the public code, the default granularities are:

$$
\{49, 196, 784\}.
$$

This corresponds to:

- **49** tokens for the super-patch view;
- **196** tokens for one frame;
- **784** tokens for a 4-frame segment.

The useful implementation detail is that these views are formed from the same visual features.
The visual encoder produces a token sequence of shape roughly:

$$
X \in \mathbb{R}^{1 \times (N_v \cdot 196) \times d}.
$$

Then the code reshapes this sequence into blocks of size 49, 196, or 784.
So the three granularities do not require three separate vision-tower passes.

### 3. KV Prefill For Each Granularity
For each granularity $g$, MuKV prefills the LLM and obtains KV slices for every layer:

$$
\mathcal{M}_{g,t}=\{(\mathbf{K}^{(\ell)}_{g,t}, \mathbf{V}^{(\ell)}_{g,t})\}_{\ell=1}^{L}.
$$

The paper describes this as independent same-granularity prefill:
each granularity maintains its own historical KV stream, and the current block is encoded with previous blocks from the same granularity.

The released code is a little more conservative.
It encodes each block with the fixed initial prompt KV cache, extracts only the new block KV by slicing off the init tokens, then stores the resulting block in the multi-grain memory bank.
So the public implementation treats stored blocks as independently encoded memory units and combines them later during QA.

This is an important difference from ReKV.
ReKV-style encoding is closer to a continuous stream:

```text
init prompt + video tokens
-> sliding-window attention
-> keep the local window
-> offload / store out-of-window KV blocks
```

So the KV for a frame in ReKV is produced in the context of a running video sequence.
When the stream moves forward, old KV blocks leave the local attention window and become historical memory.

MuKV's public main implementation is different:

```text
granularity = 49:
  init prompt + block_1 -> KV_1
  init prompt + block_2 -> KV_2
  ...

granularity = 196:
  init prompt + block_1 -> KV_1
  init prompt + block_2 -> KV_2
  ...

granularity = 784:
  init prompt + block_1 -> KV_1
  init prompt + block_2 -> KV_2
  ...
```

In code, this is implemented with:

```python
output = self.language_model(
    inputs_embeds=block_features,
    past_key_values=self.init_kv_cache,
    use_cache=True,
    return_dict=True,
    output_attentions=True,
)
```

Then the init-prompt KV part is removed:

```python
new_k = k[:, :, init_len:, :]
new_v = v[:, :, init_len:, :]
```

So `block_2` is not encoded as `init + block_1 + block_2`.
It is encoded as `init + block_2`.
The relation among different blocks is introduced later by retrieval and reranking, not by continuous prefill.

This also answers the natural question:
> If the visual tokens are the same, why can different block sizes produce different KV?

Because the blocking happens **before** LLM prefill.
KV is not a static copy of the visual token.
For layer $\ell$, roughly:

$$
\begin{aligned}
\mathbf{K}^{(\ell)}_{g,b} &= \mathbf{H}^{(\ell)}_{g,b}\mathbf{W}^{(\ell)}_K,\\
\mathbf{V}^{(\ell)}_{g,b} &= \mathbf{H}^{(\ell)}_{g,b}\mathbf{W}^{(\ell)}_V.
\end{aligned}
$$

And $\mathbf{H}^{(\ell)}_{g,b}$ is contextualized by self-attention inside the current block.
A token inside a 49-token patch block attends to a small local region.
The same underlying visual token inside a 196-token frame block attends to the whole frame.
Inside a 784-token segment block, it attends across several frames.

So even if the raw visual feature starts from the same vision encoder output, the LLM hidden state after prefill is different, and therefore the resulting K/V tensors are different.
The multi-grained memory is produced by changing the **prefill context**, not merely by relabeling the same KV after the fact.

For every stored block, the code keeps:

- compressed KV tensors for every layer;
- a representative vector;
- retained token indices;
- compression statistics.

The KV tensors are moved to CPU when stored and moved back to GPU only for selected retrieved blocks.
That is important for long videos: the memory bank is large, but online generation only loads a small subset.

### 4. Attention Signal
For a block with $N_g$ tokens, let the last-layer attention be:

$$
\mathbf{A}^{(L)} \in \mathbb{R}^{H \times N_g \times N_g}.
$$

The paper uses the last layer because intermediate-layer attention did not show a clear enough distribution pattern.
For token $j$, a clearer way to write the attention score is:

$$
I_{\text{att}}(j)
= \frac{1}{H N_g}
\sum_{h=1}^{H}
\sum_{i=1}^{N_g}
A^{(L)}_{h,i,j}.
$$

This says:
> a token is important if many query positions and heads attend to it.

The code implements the same idea by averaging over batch and heads, then summing over query positions:

$$
\mathbf{I}_{\text{att}}
= \mathrm{sum}_{\text{query}}
\left(
\mathrm{mean}_{\text{head}}(\mathbf{A}^{(L)})
\right).
$$

It then slices away the init-prompt part and keeps scores only for the current visual block.

### 5. Frequency Signal
Attention is useful, but it is model-task biased.
MuKV adds a second signal from key-vector variation.

Let the block key sequence be:

$$
\mathbf{K}_g =
[\mathbf{k}_1,\ldots,\mathbf{k}_{N_g}]
\in \mathbb{R}^{N_g \times D}.
$$

The paper applies FFT along the token dimension:

$$
\mathbf{Z}_{\text{fft}}
= \mathrm{FFT}(\mathbf{K}_g),
\quad
\mathbf{Z}_{\text{fft}} \in \mathbb{R}^{N_g \times D}.
$$

Then it averages the magnitude over feature dimensions:

$$
I_{\text{fft}}(j)
= \frac{1}{D}
\sum_{d=1}^{D}
\left|Z_{\text{fft}}(j,d)\right|.
$$

The intuition is video-specific.
Low-frequency tokens often correspond to static or redundant content.
High-frequency components are more likely to reflect foreground changes, motion, or local detail.

The official code supports three related variants:

- `fft`: real FFT, then high-frequency energy is mapped back to token-level scores;
- `diff`: adjacent key-vector difference, a faster proxy for local variation;
- `spectral_entropy`: entropy of the frequency spectrum.

The provided RVS shell scripts set `FFT_METHOD="fft"`.
The Python loader default is `diff`, so this is a parameter worth checking when reproducing numbers.

### 6. Dual-Signal Compression
For each granularity $g$, MuKV normalizes both scores to $[0,1]$:

$$
\widehat{\mathbf{I}}_{\text{att}},
\quad
\widehat{\mathbf{I}}_{\text{fft}}.
$$

Then it fuses them:

$$
\mathbf{I}_{g} =
\alpha_g \widehat{\mathbf{I}}_{\text{att}} + (1-\alpha_g)\widehat{\mathbf{I}}_{\text{fft}}.
$$

The paper uses:

$$
\alpha_g=\{0.5,0.7,0.8\}
$$

for patch, frame, and segment levels respectively.
This means the segment-level cache leans more on attention, while patch-level cache gives frequency / variation more weight.

After scoring, MuKV keeps:

$$
\kappa_g = \lfloor \rho_g |g| \rfloor
$$

tokens at each granularity.
The main setting is:

$$
\rho_g=\{0.1,0.1,0.8\}
$$

for patch, frame, and segment levels.

This is the most important compression design:

- patch and frame tokens are aggressively pruned;
- segment tokens are mostly retained;
- the memory budget is shifted toward temporal context.

In the public code, the selected token indices are sorted before KV slicing.
So even after top-k selection, the stored KV tokens keep temporal order inside the block.

There is also an optional deduplication path in code:
it over-selects about $1.2\kappa_g$ candidates, computes cosine similarity between candidate key vectors, and removes near-duplicates above a threshold.
However, the provided main experiment shell scripts set `DEDUP_ENABLED="false"`, so I would treat dedup as an implementation option rather than the core DCP result.

### 7. Block Representative Vector
Retrieval does not compare the full KV tensor directly.
Each compressed block gets a representative vector.

For a frame-level block, the paper writes:

$$
\mathbf{k}_{f_t} =
\frac{1}{N_p}
\sum_{j=1}^{N_p}
\mathbf{k}_j,
\quad
\mathbf{k}_{f_t}\in\mathbb{R}^{C},
$$

where $N_p$ is the number of retained tokens and $C=H \times D$ after concatenating heads.

The code does this with the compressed last-layer key tensor:

$$
\mathbf{r}_{g,t} =
\mathrm{flatten}_{H,D}
\left(
\frac{1}{N_g'}
\sum_{j=1}^{N_g'}
\mathbf{K}^{(L)}_{g,t,j}
\right).
$$

These representative vectors are stored alongside the compressed KV cache.
So retrieval is cheap: compare one vector per block, not every token.

### 8. Stage-1 Parallel Retrieval
When a question arrives, MuKV first builds a query vector $\mathbf{q}$.
The paper describes mean-pooling question query tokens:

$$
\mathbf{q} =
\frac{1}{N_q}
\sum_{k=1}^{N_q}
\mathbf{q}_k.
$$

For each granularity, it scores all blocks before the question timestamp:

$$
s_{g,t}=\cos(\mathbf{q}, \mathbf{r}_{g,t}).
$$

Then it over-retrieves:

$$
\text{candidates}_g=\mathrm{Top}_{2k_g}(s_{g,t}).
$$

The main setting is:

$$
k_g=\{20,32,12\}
$$

for patch, frame, and segment blocks, with total retrieved budget 64.

The public code uses the last token's last-layer key from the question prefill as the query vector, rather than explicitly mean-pooling all question tokens.
That is another implementation detail worth remembering if comparing the paper equations with the released scripts.

### 9. Stage-2 Semi-Hierarchical Reranking
Pure parallel retrieval can be noisy because a local patch may match the question while belonging to the wrong event.
Full hierarchy is also risky because a wrong top segment would trap all lower-level retrieval.

MuKV uses a partial hierarchy.
First, it averages the top-$N$ segment candidates:

$$
\mathbf{c} =
\frac{1}{N}
\sum_{m=1}^{N}
\mathbf{r}_{v,m}.
$$

The code uses $N=5$ by default.

Then it computes a segment-consistency score for every lower-granularity candidate:

$$
\gamma_j=\cos(\mathbf{r}_{g,j}, \mathbf{c}).
$$

The final reranked score is:

$$
\widetilde{s}_j=(1-\lambda_g)s_j+\lambda_g\gamma_j.
$$

The paper and the main scripts use:

$$
\lambda_g=\{0.3,0.3,0\}
$$

for patch, frame, and segment levels.
So segment candidates keep their original ranking, while patch and frame candidates are nudged toward segment-level coherence.

Finally, MuKV keeps the top $k_g$ candidates per granularity after reranking.

### 10. QA With Retrieved KV
The retrieved blocks are converted back into a standard past-KV context.
For each transformer layer, the code concatenates:

$$
[\mathbf{K}_{\text{init}}, \mathbf{K}_{\text{retrieved}}],
\quad
[\mathbf{V}_{\text{init}}, \mathbf{V}_{\text{retrieved}}]
$$

along the token dimension.

The paper writes the generation step as:

$$
a_t =
\mathrm{LLM}
\left(
\mathbf{W}_Q\mathbf{X},
[\mathbf{R}_k,\mathbf{W}_K\mathbf{X}],
[\mathbf{R}_v,\mathbf{W}_V\mathbf{X}]
\right),
$$

where $\mathbf{R}_k,\mathbf{R}_v$ are retrieved video KV plus previously generated KV.

The key efficiency point is that historical visual tokens are not recomputed online.
The model only loads selected compressed KV blocks, appends the question / generated-token KV, and decodes autoregressively.

## Evaluation
The paper evaluates MuKV on RVS-Ego, RVS-Movie, and the real-time visual understanding subset of StreamingBench.
The main backbone is LLaVA-OneVision, with both 0.5B and 7B variants.

The most useful comparison is against ReKV, because both methods use video KV-cache retrieval.

For the 7B backbone at 0.5 FPS:
- ReKV uses 12.5K inference visual tokens and 59K memory tokens per 300 frames.
- MuKV uses 8.3K inference visual tokens and the same 59K memory tokens.
- On RVS-Ego, MuKV improves from 56.2 to 59.5.
- On RVS-Movie, it improves slightly from 48.2 to 48.5.
- On StreamingBench real-time understanding, it improves from 62.3 to 64.4 overall.

For the 0.5B backbone:
- RVS-Ego improves from 51.5 to 57.9;
- RVS-Movie improves from 42.3 to 45.2;
- StreamingBench overall improves from 52.7 to 56.8.

The supplement also tests MuKV on offline long-video QA benchmarks with newer backbones, including Qwen3-VL.
These results are not the main streaming table, but they are useful for checking whether the memory design transfers beyond LLaVA-OV.

For Qwen3-VL-4B:
- the base model scores 64.8 on MLVU, 65.8 on EgoSchema, and 62.5 overall on VideoMME;
- with MuKV at 0.5 FPS and 5.9K memory tokens, the scores become 66.0, 67.0, and 63.6.

For Qwen3-VL-2B:
- the base model scores 64.0 on MLVU, 65.0 on EgoSchema, and 61.5 overall on VideoMME;
- with MuKV at 0.5 FPS and 5.9K memory tokens, the scores become 65.2, 66.3, and 62.6.

So the Qwen3-VL results show a consistent but moderate gain.
The interesting part is not only the absolute improvement, but that the same multi-grained KV memory can still help a different VLM family.

The compression ablation is also important.
With MuKV, applying DCP at the 67% drop ratio reduces memory from 177K to 59K tokens and improves accuracy compared with the uncompressed multi-grained version.
For ReKV, DCP at 50% drop ratio cuts memory from 59K to 29K tokens and improves RVS-Ego from 51.5 to 56.1.

So compression is not only saving memory.
In this setting, removing redundant KV tokens can also improve retrieval quality and answer accuracy.

One caveat: the gains are not uniform across all question types.
On StreamingBench, MuKV improves many reasoning and summarization categories, but underperforms ReKV on counting.
That is a useful warning: aggressive KV pruning can preserve event semantics while hurting fine-grained counting evidence.

## My Takeaways
MuKV changes much more than a single component on top of ReKV.
It changes how video KV is generated, introduces a hierarchical / multi-grained memory design, adds FFT-based compression, and then uses semi-hierarchical reranking at retrieval time.

The ablations do suggest that these parts are useful.
But the improvement feels more like several reasonable gains being added together, rather than one dominant mechanism clearly explaining the whole result.
This is not a weakness by itself, but it makes the paper harder to reduce to one simple reusable trick.

The multi-grained KV generation is conceptually attractive because patch, frame, and segment blocks expose different prefill contexts.
However, running three granularities in parallel is not free.
The paper treats the three prefills as parallelizable, but in deployment that still means more GPU work, more memory pressure, and possibly more complicated scheduling across devices.
So the accuracy gain should be read together with the system cost of producing and managing three KV memories.

There is also a positional issue hidden behind KV retrieval.
Retrieved patch, frame, and segment KV blocks are eventually concatenated into one context, but those keys were produced under their own prefill positions.
For RoPE-based models, and especially mRoPE-style VLMs, the order of concatenation and the positional meaning of retrieved KV are not just bookkeeping details.
They can affect how the question attends to the retrieved memory.

Another thing to watch is the number of hyperparameters:
granularity sizes, retention ratios, attention / frequency weights, retrieval budgets, reranking weights, top segment count, FPS, and layer choices.
Many of the reported settings look tuned for the evaluated setup.
The paper gives useful ablations, but it is still not fully clear how sensitive the method is when these parameters move, or how much retuning is needed for a different backbone or video domain.

## Limitations / Open Questions
- Patch-level and frame-level views are based on the middle frame of each segment. This is efficient, but may miss local details that appear only in other frames.
- Retrieved KV blocks are concatenated into one generation context. The best ordering and positional treatment, especially for RoPE / mRoPE models, remains a real engineering question.
- Counting remains weak in the reported StreamingBench results, suggesting a trade-off between semantic compression and exact visual evidence.
- The method likely needs retuning across backbones and video domains because many choices are hyperparameter-driven.
