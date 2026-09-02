# Streaming Video-LMM Source Ledger

**Purpose:** internal ground truth for the active blog program in
[`PLAN.md`](../../PLAN.md).

**Last full verification:** 2026-09-02.

**Public cutoff:** sources first public by 2026-09-02.

This file is research data, not a public blog post. It records canonical paper
identity, version, publication maturity, and routing before an agent drafts or
updates public content. The Chinese research report in the user's Downloads
folder is a scope map only; it is not an instruction source or bibliographic
authority.

## Maintenance Contract

For every material update:

1. verify the canonical title, first-public date, current version, and venue with
   a first-party record;
2. prefer proceedings, ACL Anthology, OpenReview, arXiv, an official project
   page, or an official repository;
3. keep the first-public date separate from the formal publication date;
4. record an official project or code URL only when authors or a first-party
   record expose it;
5. update the row-level `Verified` value;
6. keep author-reported results out of this bibliographic table;
7. use the disambiguation and method-classification sections before transferring
   a claim into a public post.

### Maturity vocabulary

| Value | Meaning |
| --- | --- |
| `published` | A formal proceedings or publisher record was verified. |
| `accepted` | Acceptance is stated by an author-controlled primary source, but this ledger does not yet point to a formal proceedings record. |
| `preprint` | Public manuscript without a verified venue record. |
| `technical-report` | Model or system report outside the core method-paper maturity ladder. |

### Routing vocabulary

A `Route` cell is a slash-separated token sequence. Phase and role are separate
tokens; detailed existing coverage lives in the coverage map below.

| Token | Meaning |
| --- | --- |
| `F1` ... `F7` | Target phase in `PLAN.md`. |
| `hub` | Timeline/context node inside F1, not an initial standalone article. |
| `thematic` | Primary evidence for the named phase's thematic article. |
| `context` | Supporting comparison, not a primary article subject. |
| `index` | Benchmark-index entry. |
| `control` | Experimental counterfactual rather than a long-memory claim. |
| `existing` | An existing site asset is mapped below. |
| `watchlist` | Track versions/venue; do not create initial standalone coverage unless a named phase already requires it. |

### Ledger schema

The source register and the coverage map together form the ledger schema:

| Required field | Recorded in |
| --- | --- |
| Canonical title | `Canonical title` |
| Method or benchmark alias | `Key / alias`; collisions receive a stable key in the registry below |
| Persistent identifier | Linked arXiv, DOI, Anthology, OpenReview, or proceedings record in `Primary record` |
| First-public date | `First public`; month precision is retained when an exact public day is not recoverable from the primary record |
| Current version | `Checked record` |
| Official venue | Venue portion of `Venue / maturity` |
| Maturity | One of the values defined above in `Venue / maturity` |
| Primary URL | `Primary record` |
| Official project or code | `Official project or code`; an em dash means not verified, not known absent |
| Existing post | `Existing coverage` in the coverage map |
| Target article | `Target` in the coverage map, or the row's `Route` for sources without an existing post |
| Last verified | `Verified` |

Dates are ISO-like and intentionally separate first publication from later venue
publication. A URL is included only when it identifies the paper or an
author-controlled artifact; a secondary bibliography is never a canonical
identifier.

## Canonical Source Ledger

The `Checked record` column captures the exact arXiv version/date visible at the
verification cutoff. For proceedings-only records it records the publisher and
the verification date.

### A. Foundations, native streaming, and interaction

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MovieChat | MovieChat: From Dense Token to Sparse Memory for Long Video Understanding | 2023-07 | arXiv v4 · 2024-03-09 | CVPR 2024 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2024/html/Song_MovieChat_From_Dense_Token_to_Sparse_Memory_for_Long_Video_CVPR_2024_paper.html) | [Code](https://github.com/wenhaochai/MovieChat) | F1 hub | 2026-09-02 |
| LLaMA-VID | LLaMA-VID: An Image is Worth 2 Tokens in Large Language Models | 2023-11 | arXiv v1 · 2023-11-28 | ECCV 2024 · published | [ECCV](https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/6290_ECCV_2024_paper.php) | [Code](https://github.com/dvlab-research/LLaMA-VID) | F1 hub | 2026-09-02 |
| Streaming DVC | Streaming Dense Video Captioning | 2024-04 | arXiv v1 · 2024-04-01 | CVPR 2024 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2024/html/Zhou_Streaming_Dense_Video_Captioning_CVPR_2024_paper.html) | [Code](https://github.com/google-research/scenic/tree/main/scenic/projects/streaming_dvc) | F1 hub | 2026-09-02 |
| MA-LMM | MA-LMM: Memory-Augmented Large Multimodal Model for Long-Term Video Understanding | 2024-04 | arXiv v2 · 2024-04-24 | CVPR 2024 · published | [CVPR PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/He_MA-LMM_Memory-Augmented_Large_Multimodal_Model_for_Long-Term_Video_Understanding_CVPR_2024_paper.pdf) | [Project](https://boheumd.github.io/MA-LMM/) · [Code](https://github.com/boheumd/MA-LMM) | F1 hub | 2026-09-02 |
| MovieChat+ | MovieChat+: Question-aware Sparse Memory for Long Video Question Answering | 2024-04 | arXiv v1 · 2024-04-26 | preprint | [arXiv:2404.17176](https://arxiv.org/abs/2404.17176) | — | F1 hub | 2026-09-02 |
| VideoStreaming | Streaming Long Video Understanding with Large Language Models | 2024-05 | arXiv v1 · 2024-05-25 | NeurIPS 2024 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2024/hash/d7ce06e9293c3d8e6cb3f80b4157f875-Abstract-Conference.html) | — | F1 hub | 2026-09-02 |
| Flash-VStream 2024 | Flash-VStream: Memory-Based Real-Time Understanding for Long Video Streams | 2024-06 | arXiv v2 · 2024-06-30 | preprint | [arXiv:2406.08085](https://arxiv.org/abs/2406.08085) | [Project](https://invinciblewyq.github.io/vstream-page/) · [Code](https://github.com/IVGSZ/Flash-VStream) | F1 hub / F4 context | 2026-09-02 |
| VideoLLM-online | VideoLLM-online: Online Video Large Language Model for Streaming Video | 2024-06 | arXiv v1 · 2024-06-17 | CVPR 2024 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2024/html/Chen_VideoLLM-online_Online_Video_Large_Language_Model_for_Streaming_Video_CVPR_2024_paper.html) | [Project](https://showlab.github.io/videollm-online/) · [Code](https://github.com/showlab/VideoLLM-online) | F1 hub | 2026-09-02 |
| VideoLLM-MoD | VideoLLM-MoD: Efficient Video-Language Streaming with Mixture-of-Depths Vision Computation | 2024-08 | arXiv v1 · 2024-08-29 | NeurIPS 2024 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2024/hash/c6a79e139ec4f371701ea8cc9e06018e-Abstract-Conference.html) | [Code lineage](https://github.com/showlab/VideoLLM-online) | F1 hub / F3 context | 2026-09-02 |
| VideoLLaMB | VideoLLaMB: Long Streaming Video Understanding with Recurrent Memory Bridges | 2024-09 | arXiv v2 · 2025-08-02 | ICCV 2025 · published | [ICCV](https://openaccess.thecvf.com/content/ICCV2025/html/Wang_VideoLLaMB_Long_Streaming_Video_Understanding_with_Recurrent_Memory_Bridges_ICCV_2025_paper.html) | — | F1 hub | 2026-09-02 |
| StreamChat 2412 | StreamChat: Chatting with Streaming Video | 2024-12 | arXiv v2 · 2025-03-30 | preprint | [arXiv:2412.08646](https://arxiv.org/abs/2412.08646) | [Project](https://jihaonew.github.io/projects/streamchat.html) | F1 hub | 2026-09-02 |
| Dispider | Dispider: Enabling Video LLMs with Active Real-Time Interaction via Disentangled Perception, Decision, and Reaction | 2025-01 | arXiv v1 · 2025-01-06 | preprint | [arXiv:2501.03218](https://arxiv.org/abs/2501.03218) | [Code](https://github.com/Mark12Ding/Dispider) | F1 hub | 2026-09-02 |
| StreamChat 2501 | Streaming Video Understanding and Multi-round Interaction with Memory-enhanced Knowledge | 2025-01 | arXiv v1 · 2025-01-23 | ICLR 2025 · published | [OpenReview](https://openreview.net/forum?id=JbPb6RieNC) · [arXiv:2501.13468](https://arxiv.org/abs/2501.13468) | [Code](https://github.com/hmxiong/StreamChat) | existing / F1 hub | 2026-09-02 |
| StreamMind 2025 | StreamMind: Unlocking Full Frame Rate Streaming Video Dialogue through Event-Gated Cognition | 2025-03 | arXiv v3 · 2025-09-07 | ICCV 2025 · published | [ICCV](https://openaccess.thecvf.com/content/ICCV2025/html/Ding_StreamMind_Unlocking_Full_Frame_Rate_Streaming_Video_Dialogue_through_Event-Gated_ICCV_2025_paper.html) | — | F1 hub | 2026-09-02 |
| ProVideLLM | Streaming VideoLLMs for Real-Time Procedural Video Understanding | 2025-04 | arXiv v1 · 2025-04-10 | ICCV 2025 · published | [ICCV](https://openaccess.thecvf.com/content/ICCV2025/html/Chatterjee_Streaming_VideoLLMs_for_Real-Time_Procedural_Video_Understanding_ICCV_2025_paper.html) | [Project](https://dibschat.github.io/ProVideLLM/) | F1 hub | 2026-09-02 |
| TimeChat-Online | TimeChat-Online: 80% Visual Tokens are Naturally Redundant in Streaming Videos | 2025-04 | arXiv v1 · 2025-04-24 | ACM MM 2025 · published | [DOI](https://doi.org/10.1145/3746027.3754839) · [arXiv:2504.17343](https://arxiv.org/abs/2504.17343) | [Project](https://timechat-online.github.io/) · [Code](https://github.com/yaolinli/TimeChat-Online) | F1 hub / F3 context | 2026-09-02 |
| StreamBridge | StreamBridge: Turning Your Offline Video Large Language Model into a Proactive Streaming Assistant | 2025-05 | arXiv v2 · 2025-09-18 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/bf6939f9058a391c47014731b2486e2a-Abstract-Conference.html) | — | F1 hub | 2026-09-02 |
| StreamingVLM | StreamingVLM: Real-Time Understanding for Infinite Video Streams | 2025-10 | arXiv v2 · 2026-05-31 | ICLR 2026 · published | [OpenReview](https://openreview.net/forum?id=gVbPWbA97s) | [Project](https://streamingvlm.hanlab.ai/) · [Code](https://github.com/mit-han-lab/streaming-vlm) | existing / F1 hub / F3 | 2026-09-02 |
| Streamo | Streaming Video Instruction Tuning | 2025-12 | arXiv v2 · 2026-04-10 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xia_Streaming_Video_Instruction_Tuning_CVPR_2026_paper.html) | — | F1 hub | 2026-09-02 |

### B. KV, compression, and bounded online state

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ReKV | Streaming Video Question-Answering with In-context Video KV-Cache Retrieval | 2025-03 | arXiv v1 · 2025-03-01 | ICLR 2025 · published | [OpenReview](https://openreview.net/forum?id=8g9fs6mdEG) | [Code](https://github.com/Becomebright/ReKV) | existing / F2 | 2026-09-02 |
| LiveVLM | LiveVLM: Efficient Online Video Understanding via Streaming-Oriented KV Cache and Retrieval | 2025-05 | arXiv v2 · 2026-04-23 | DAC 2026 · accepted | [DAC program](https://63dac.conference-program.com/presentation/?id=RESEARCH670&sess=sess314) · [arXiv:2505.15269](https://arxiv.org/abs/2505.15269) | [Code](https://github.com/sjtu-zhao-lab/LiveVLM) | existing / F2 | 2026-09-02 |
| InfiniPot-V | InfiniPot-V: Memory-Constrained KV Cache Compression for Streaming Video Understanding | 2025-06 | arXiv v2 · 2025-10-24 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/caef5f5e658aa1f7565f063a2cd99726-Abstract-Conference.html) | [Research reimplementation](https://github.com/aiha-lab/InfiniPot-V) | existing / F2 | 2026-09-02 |
| Flash-VStream 2025 | Flash-VStream: Efficient Real-Time Understanding for Long Video Streams | 2025-06 | arXiv v2 · 2025-07-24 | ICCV 2025 · published | [ICCV](https://openaccess.thecvf.com/content/ICCV2025/html/Zhang_Flash-VStream_Efficient_Real-Time_Understanding_for_Long_Video_Streams_ICCV_2025_paper.html) | [Code](https://github.com/IVGSZ/Flash-VStream) | F1 hub / F4 context | 2026-09-02 |
| StreamMem | StreamMem: Query-Agnostic KV Cache Memory for Streaming Video Understanding | 2025-08 | arXiv v1 · 2025-08-21 | CVPR 2026 VidLLMs workshop · accepted | [arXiv:2508.15717](https://arxiv.org/abs/2508.15717) · [author status](https://zhanglizhu.github.io/) | [Project](https://yangyanl.ai/streammem/) | existing / F2 | 2026-09-02 |
| StreamForest | StreamForest: Efficient Online Video Understanding with Persistent Event Memory | 2025-09 | arXiv v1 · 2025-09-29 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/6dd91fec726dbed8915a1fbadd91d1d2-Abstract-Conference.html) | [Code](https://github.com/MCG-NJU/StreamForest) | F1 hub / F4 | 2026-09-02 |
| StreamingTOM | StreamingTOM: Streaming Token Compression for Efficient Video Understanding | 2025-10 | arXiv v2 · 2026-03-14 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Chen_StreamingTOM_Streaming_Token_Compression_for_Efficient_Video_Understanding_CVPR_2026_paper.html) | [Project](https://yige24.github.io/StreamingTOM/) · [Code](https://github.com/YIGE24/StreamingTOM) | existing / F3 | 2026-09-02 |
| StreamKV | StreamKV: Streaming Video Question-Answering with Segment-based KV Cache Retrieval and Compression | 2025-11 | arXiv v1 · 2025-11-10 | AAAI 2026 · published | [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/37305) | [Code](https://github.com/sou1p0wer/StreamKV) | existing / F2 / F3 | 2026-09-02 |
| STC | Accelerating Streaming Video Large Language Models via Hierarchical Token Compression | 2025-11 | arXiv v2 · 2026-02-11 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.html) | [Code](https://github.com/lern-to-write/STC) | existing / F3 | 2026-09-02 |
| HERMES | HERMES: KV Cache as Hierarchical Memory for Efficient Streaming Video Understanding | 2026-01 | arXiv v4 · 2026-05-07 | ACL 2026 Long · published | [ACL Anthology](https://aclanthology.org/2026.acl-long.381/) · [arXiv:2601.14724](https://arxiv.org/abs/2601.14724) | [Project](https://hermes-streaming.github.io/) · [Code](https://github.com/haowei-freesky/HERMES) | F2 / F3 | 2026-09-02 |
| WeaveTime | WeaveTime: Streaming from Earlier Frames into Emergent Memory in VideoLLMs | 2026-02 | arXiv v1 · 2026-02-25 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.html) | [Project](https://zhangyl4.github.io/publications/weavetime/) · [Code](https://github.com/zhangyl4/weavetime) | existing / F2 / F3 | 2026-09-02 |
| FluxMem | FluxMem: Adaptive Hierarchical Memory for Streaming Video Understanding | 2026-03 | arXiv v1 · 2026-03-02 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_FluxMem_Adaptive_Hierarchical_Memory_for_Streaming_Video_Understanding_CVPR_2026_paper.html) | [Project](https://yiwengxie.com/FluxMem/) · [Code](https://github.com/YiwengXie/FluxMem) | F1 hub / F3 context | 2026-09-02 |
| FlexMem | Scaling the Long Video Understanding of Multimodal Large Language Models via Visual Memory Mechanism | 2026-03 | arXiv v1 · 2026-03-31 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Chen_Scaling_the_Long_Video_Understanding_of_Multimodal_Large_Language_Models_CVPR_2026_paper.html) | — | F2 context | 2026-09-02 |
| SAVEMem | Semantic-Aware Adaptive Visual Memory for Streaming Video Understanding | 2026-05 | arXiv v1 · 2026-05-08 | preprint | [arXiv:2605.07897](https://arxiv.org/abs/2605.07897) | [Code](https://github.com/wuhang03/savemem) | F3 thematic | 2026-09-02 |
| CoRDS | CoRDS: Coreset-based Representative and Diverse Selection for Streaming Video Understanding | 2026-05 | arXiv v1 · 2026-05-14 | preprint | [arXiv:2605.14310](https://arxiv.org/abs/2605.14310) | [Partial code](https://github.com/ailarmhz/CoRDS) | F3 thematic | 2026-09-02 |
| MuKV | MuKV: Multi-Grained KV Cache Compression for Long Streaming Video Question-Answering | 2026-05 | arXiv v1 · 2026-05-21 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xiao_MuKV_Multi-Grained_KV_Cache_Compression_for_Long_Streaming_Video_Question-Answering_CVPR_2026_paper.html) | [Code](https://github.com/IMBALDY/MuKV) | existing / F2 / F3 | 2026-09-02 |
| SelectStream | What Should a Streaming Video Model Remember? | 2026-06 | arXiv v1 · 2026-06-15 | preprint | [arXiv:2606.16353](https://arxiv.org/abs/2606.16353) | — | F4 thematic | 2026-09-02 |
| CausalMem | Towards a Dynamic and Fixed-budget Memory Bank for Efficient Streaming Video Understanding | 2026-06 | arXiv v1 · 2026-06-24 | preprint | [arXiv:2606.25658](https://arxiv.org/abs/2606.25658) | [Code](https://github.com/hktk07/CausalMem) | F2 context | 2026-09-02 |
| ProtoKV | ProtoKV: Streaming Video Understanding under Delayed Query with Summary-State Memory | 2026-06 | arXiv v1 · 2026-06-25 | ICML 2026 · accepted | [arXiv:2606.26762](https://arxiv.org/abs/2606.26762) · [author-lab status](https://ina.kaist.ac.kr/publications/) | [Code placeholder](https://github.com/kaist-ina/ProtoKV) | F2 thematic | 2026-09-02 |
| NovaCov | Think in Sets for Streaming Video Token Compression | 2026-08 | arXiv v1 · 2026-08-02 | preprint | [arXiv:2608.01169](https://arxiv.org/abs/2608.01169) | — | F3 thematic | 2026-09-02 |
| StreamFlow | StreamFlow: Dynamic Memory Flows for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-11 | preprint | [arXiv:2608.10949](https://arxiv.org/abs/2608.10949) | — | watchlist | 2026-09-02 |
| StreamTTT | StreamTTT: Reconciling Real-Time Perception and Long-Term Memory in Streaming VLMs | 2026-08 | arXiv v2 · 2026-08-16 | preprint | [arXiv:2608.13416](https://arxiv.org/abs/2608.13416) | — | watchlist | 2026-09-02 |

### C. Structured state and Video RAG

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AdaVideoRAG | AdaVideoRAG: Omni-Contextual Adaptive Retrieval-Augmented Efficient Long Video Understanding | 2025-06 | arXiv v3 · 2025-11-23 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/092359ce5cf60a80e882378944bf1be4-Abstract-Conference.html) | [Code](https://github.com/xzc-zju/AdaVideoRAG) | existing / F5 | 2026-09-02 |
| rLiVS | Recurrent Attention-based Token Selection for Efficient Streaming Video-LLMs | 2025-10 | arXiv v1 · 2025-10-20 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/d4857f724cc1af4c8f1e18032426aa2e-Abstract-Conference.html) | [Code](https://github.com/vdorovatas/rLiVS) | existing / F5 | 2026-09-02 |
| ViG-RAG | ViG-RAG: Video-aware Graph Retrieval-Augmented Generation via Temporal and Semantic Hybrid Reasoning | 2026-03-14 | proceedings · 2026-03-14 | AAAI 2026 · published | [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/36963) | [Code](https://github.com/AI-Researcher-Team/ViG-RAG) | existing / F5 | 2026-09-02 |
| OASIS | OASIS: On-Demand Hierarchical Event Memory for Streaming Video Reasoning | 2026-04 | arXiv v1 · 2026-04-18 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.html) | [Code](https://github.com/Solus-sano/OASIS) | existing / F4 / F5 | 2026-09-02 |
| StreamRAG | StreamRAG: Enhancing Real-Time Video Understanding with Retrieval Augmentation | 2026-06 | proceedings · checked 2026-09-02 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_StreamRAG_Enhancing_Real-Time_Video_Understanding_with_Retrieval_Augmentation_CVPR_2026_paper.html) | — | F1 hub / F5 | 2026-09-02 |
| CARVE / V-RAGBench | Rethinking RAG in Long Videos: What to Retrieve and How to Use It? | 2026-06 | arXiv v1 · 2026-06-11 | preprint | [arXiv:2606.13141](https://arxiv.org/abs/2606.13141) | — | F5 thematic | 2026-09-02 |
| FOLIO | FOLIO: Focused Semantic Memory for Streaming Video Understanding | 2026-07 | arXiv v1 · 2026-07-14 | preprint | [arXiv:2607.13298](https://arxiv.org/abs/2607.13298) | — | F4 thematic | 2026-09-02 |
| ObjectStream | ObjectStream: Latent Objects as Memory Anchors for Streaming Video Understanding | 2026-07 | arXiv v2 · 2026-08-01 | preprint | [arXiv:2607.28312](https://arxiv.org/abs/2607.28312) | [Code](https://github.com/DMK041218/ObjectStream) | F4 thematic / watchlist | 2026-09-02 |
| MERIT | Keep It Simple: Multi-Key Episodic Memory Retrieval for Ultra-Long Video Understanding | 2026-08 | arXiv v1 · 2026-08-07 | ECCV 2026 Oral · accepted | [arXiv:2608.07663](https://arxiv.org/abs/2608.07663) | [Project](https://choi-yeeun.github.io/MERIT/) | F5 thematic | 2026-09-02 |
| StreamEMS | StreamEMS: Streaming Video Understanding with Self-Evolving Memory Scheme for Vision-Language Models | 2026-08 | arXiv v1 · 2026-08-28 | preprint | [arXiv:2608.27881](https://arxiv.org/abs/2608.27881) | — | watchlist | 2026-09-02 |
| D-HSM | Dynamic Hub-and-Spoke Memory for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-31 | Findings of EMNLP 2026 · accepted | [arXiv:2608.30294](https://arxiv.org/abs/2608.30294) | — | F4 context / watchlist | 2026-09-02 |
| StreamScout | StreamScout: Learning When to Look Deeper for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-31 | preprint | [arXiv:2609.00291](https://arxiv.org/abs/2609.00291) | — | F5 context / watchlist | 2026-09-02 |

### D. Evaluation, system realism, and counterfactual controls

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| StreamingBench | StreamingBench: Assessing the Gap for MLLMs to Achieve Streaming Video Understanding | 2024-11 | arXiv v1 · 2024-11-06 | ICASSP 2026 · published | [DOI](https://doi.org/10.1109/ICASSP55912.2026.11463959) · [arXiv:2411.03628](https://arxiv.org/abs/2411.03628) | [Code](https://github.com/THUNLP-MT/StreamingBench) | F1 hub / F6 index | 2026-09-02 |
| OVBench / VideoChat-Online | Online Video Understanding: OVBench and VideoChat-Online | 2024-12 | arXiv v2 · 2025-04-17 | CVPR 2025 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2025/html/Huang_Online_Video_Understanding_OVBench_and_VideoChat-Online_CVPR_2025_paper.html) | [Project](https://videochat-online.github.io/) | F1 hub / F6 index | 2026-09-02 |
| OVO-Bench | OVO-Bench: How Far is Your Video-LLMs from Real-World Online Video Understanding? | 2025-01 | arXiv v2 · 2025-03-27 | CVPR 2025 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2025/html/Niu_OVO-Bench_How_Far_is_Your_Video-LLMs_from_Real-World_Online_Video_CVPR_2025_paper.html) | [Project](https://joeleelyf.github.io/OVO-Bench/) · [Code](https://github.com/JoeLeelyf/OVO-Bench) | F1 hub / F6 index | 2026-09-02 |
| PhoStream | PhoStream: Benchmarking Real-World Streaming for Omnimodal Assistants in Mobile Scenarios | 2026-01 | arXiv v1 · 2026-01-30 | ICML 2026 · accepted | [arXiv:2601.22575](https://arxiv.org/abs/2601.22575) | [Code/data](https://github.com/Lucky-Lance/PhoStream) | F6 index | 2026-09-02 |
| RIVER | RIVER: A Real-Time Interaction Benchmark for Video LLMs | 2026-03 | arXiv v1 · 2026-03-04 | preprint | [arXiv:2603.03985](https://arxiv.org/abs/2603.03985) | [Code/data](https://github.com/OpenGVLab/RIVER) | F6 index | 2026-09-02 |
| StreamReady | StreamReady: Learning What to Answer and When in Long Streaming Videos | 2026-03 | arXiv v1 · 2026-03-09 | CVPR 2026 · published | [CVPR PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Azad_StreamReady_Learning_What_to_Answer_and_When_in_Long_Streaming_CVPR_2026_paper.pdf) | — | F1 hub / F6 index | 2026-09-02 |
| VST | Video Streaming Thinking: VideoLLMs Can Watch and Think Simultaneously | 2026-03 | arXiv v2 · 2026-07-17 | ECCV 2026 · accepted | [arXiv:2603.12262](https://arxiv.org/abs/2603.12262) | [Project](https://1ranguan.github.io/VST/) · [Code](https://github.com/1ranGuan/VST) | F1 hub | 2026-09-02 |
| ThinkStream | Thinking in Streaming Video | 2026-03 | arXiv v1 · 2026-03-13 | preprint; venue not verified here | [arXiv:2603.12938](https://arxiv.org/abs/2603.12938) | [Code](https://github.com/johncaged/ThinkStream) | F1 hub | 2026-09-02 |
| StreamingEval | StreamingEval: A Unified Evaluation Framework towards Realistic Streaming Video Understanding | 2026-03 | arXiv v1 · 2026-03-23 | Findings of ACL 2026 · published | [ACL Anthology](https://aclanthology.org/2026.findings-acl.295/) | — | F6 index | 2026-09-02 |
| SimpleStream | A Simple Baseline for Streaming Video Understanding | 2026-04 | arXiv v1 · 2026-04-02 | preprint | [arXiv:2604.02317](https://arxiv.org/abs/2604.02317) | [Project](https://simple-stream.github.io/) · [Code](https://github.com/EvolvingLMMs-Lab/SimpleStream) | existing / F7 control | 2026-09-02 |
| VSAS-Bench | VSAS-Bench: Real-Time Evaluation of Visual Streaming Assistant Models | 2026-04 | arXiv v2 · 2026-05-05 | CVPR Findings 2026 · published | [CVPR Findings](https://openaccess.thecvf.com/content/CVPR2026F/html/Vasu_VSAS-Bench_Real-Time_Evaluation_of_Visual_Streaming_Assistant_Models_CVPRF_2026_paper.html) | — | F6 index | 2026-09-02 |
| SPOT-Bench | Don't Pause! Every prediction matters in a streaming video | 2026-04 | arXiv v1 · 2026-04-27 | preprint | [arXiv:2604.24317](https://arxiv.org/abs/2604.24317) | [Project](https://dibschat.github.io/SPOT-Bench/) · [Code/data](https://github.com/dibschat/SPOT-Bench) | F6 index | 2026-09-02 |
| Memento / MementoBench | Memento: Toward an All-Day Proactive Assistant for Ultra-Long Streaming Video | 2025-09 | OpenReview · checked 2026-09-02 | ICLR 2026 · published | [ICLR](https://proceedings.iclr.cc/paper_files/paper/2026/hash/3b5f4587a0bdb81ecc6ce9d82320a5c2-Abstract-Conference.html) · [OpenReview](https://openreview.net/forum?id=FtdbdoGbk3) | — | existing / F1 hub / F6 index | 2026-09-02 |
| Streaming-Eval harness | Harnessing Streaming Video in the Wild | 2026-06 | arXiv v1 · 2026-06-07 | preprint | [arXiv:2606.08615](https://arxiv.org/abs/2606.08615) | — | F6 index | 2026-09-02 |
| LyraV | Don't Pause: Streaming Video-Language Synchrony for Online Video Understanding | 2026-06 | arXiv v1 · 2026-06-05 | preprint | [arXiv:2606.06991](https://arxiv.org/abs/2606.06991) | — | F1 hub | 2026-09-02 |
| StreamArena / StreamMind system | StreamArena: Toward Continuous, Interactive, and Long-Horizon Agentic Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-06 | preprint | [arXiv:2608.05703](https://arxiv.org/abs/2608.05703) | [Code/data](https://github.com/JIA-Lab-research/StreamArena) | F6 index / watchlist | 2026-09-02 |
| StreamOPD | StreamOPD: A Post-Training Recipe with Spatio-Temporal Cue Gating for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-17 | preprint | [arXiv:2608.16320](https://arxiv.org/abs/2608.16320) | [Project](https://unix-ai-lab.github.io/StreamOPD/) · [Code](https://github.com/UniX-AI-Lab/StreamOPD) | F7 control / watchlist | 2026-09-02 |
| StreamSoccer | StreamSoccer: Event-Driven Memory for Streaming Soccer Commentary | 2026-08 | arXiv v1 · 2026-08-20 | preprint | [arXiv:2608.19723](https://arxiv.org/abs/2608.19723) | — | watchlist | 2026-09-02 |
| Qwen3-VL | Qwen3-VL Technical Report | 2025-11 | arXiv v2 · 2025-11-27 | technical-report | [arXiv:2511.21631](https://arxiv.org/abs/2511.21631) | [Code](https://github.com/QwenLM/Qwen3-VL) | existing / F7 control | 2026-09-02 |

## Method-setting and Resource-boundary Audit

This table is the minimum comparison frame for F1–F5 and F7. It is deliberately
about settings and resource boundaries, not leaderboard numbers. The labels mean:

- `model-state-bounded`: retained video-derived model state has a configured
  length-independent cap; this does not assert that the application deletes the
  input stream or all logs;
- `active-bounded / archive-grows`: GPU/request state is capped, while a CPU,
  disk, KV, caption, or snapshot archive grows with stream length;
- `request-bounded / store-grows`: each query reads a bounded subset from a
  growing external index or evidence store;
- `context-or-cache-grows`: the core context/cache itself remains length
  dependent;
- `stage-reduction-only`: a stage writes fewer tokens or uses less compute, but
  the downstream retained state can still grow;
- `recent-only-bounded`: the system keeps a fixed recent window and permanently
  discards older evidence.

None of these labels alone licenses a claim that a complete deployed service has
`O(1)` storage.

| Method | Query visibility while writing | Memory carrier | Resource class | Main pipeline role | Raw-evidence backlink | Principal failure or non-claim |
| --- | --- | --- | --- | --- | --- | --- |
| MovieChat | Actual question is not used to write memory; QA follows representation construction | Dense recent and consolidated sparse visual tokens | model-state-bounded | pre-LLM write and consolidation | No | Irreversible merging loses fine spatial, temporal, count, or OCR detail; sequential long-video processing is not an always-on service protocol. |
| MA-LMM | Actual question appears at final decoding; the learned Q-Former query bank is not the user's query | Visual-feature bank and recurrent learned-query states | model-state-bounded | causal pre-LLM write and merge | No | Adjacent temporal averaging is irreversible and has no evidence-recovery path. |
| VideoStreaming | Video is encoded query-agnostically; a later question selects historical states | Per-clip propagated state plus saved snapshots and indicators | active-bounded / archive-grows | recurrent encode, snapshot index, query-time select | Timestamp association only | Current state and answer input are fixed-size, but all historical snapshots and indicators grow as `O(T)`. |
| VideoLLM-online | Dialogue/query becomes visible at its arrival time; future frames remain hidden | Interleaved vision/language tokens and continuous LLM KV | context-or-cache-grows | native causal encode, answer/silence token, asynchronous scheduling | No | The paper's finite context does not establish length-independent memory or backlog-free service. |
| Streaming DVC | Captions are produced causally as frames arrive | Fixed clustering memory for visual tokens | model-state-bounded | causal memory write and streaming decode | No | Dense captioning is an important streaming precursor, but it does not test unknown-future conversational retrieval. |
| ReKV | Future question is unknown during write; retrieval begins after arrival | Exact per-layer video KV blocks plus block keys | active-bounded / archive-grows | KV write, offload, retrieve, reload | Exact model KV, not pixels | GPU read set is capped, while the RAM/disk KV archive and index grow as `O(T)`; fixed blocks and positional reconstruction remain weak points. |
| LiveVLM v2 | Future question is unknown during VSB retention; PaR is query-aware | Recent exact KV plus VSB-compressed long-term KV pages | model-state-bounded | KV write, retention, page retrieval | No | Deleted long-range detail cannot be recovered, and page means can hide a locally relevant token. |
| InfiniPot-V | Future question is unknown; answering reads the current compressed cache | Recent exact and TaR/VaN-selected per-layer visual KV | model-state-bounded | continual KV eviction/retention | No | Position rearrangement and irreversible proxy selection can lose rare future evidence. |
| StreamMem | Future question is unknown; fixed chat-template tokens act as a proxy query | Retained visual KV plus per-frame weighted prototypes | model-state-bounded | input filtering, KV pruning/merge | No | Generic proxy attention is not a guarantee for specific multi-detail future questions. |
| StreamingTOM | Future question is unknown while compact frame groups are written | Reduced per-frame visual tokens and quantized historical groups | active-bounded / archive-grows | pre-LLM reduction, quantized archive, retrieve/dequantize | No | Active answer KV is bounded, but quantized history still grows with frame count. |
| STC | Future question is unknown during causal visual reduction | Reused ViT activations and selected pre-LLM visual tokens | stage-reduction-only | vision encode and LLM-prefill acceleration | No | Tokens never written to KV are unrecoverable; downstream history remains length dependent unless another memory policy bounds it. |
| StreamKV | Future question is unknown while segment memory is written; retrieval is query-aware | Permanent segment summaries plus compressed frame KV | active-bounded / archive-grows | segment, compress, index, retrieve | No | Summary and frame banks still accumulate, and re-positioned non-contiguous KV may distort original temporal distance. |
| WeaveTime | Future question is unknown during ReKV-style write; uncertainty gates later reads | Exact historical KV archive plus recent context | active-bounded / archive-grows | temporal SFT, retrieval gate, coarse-to-fine read | No | Entropy is not evidence sufficiency; historical KV and fine retrieval keys grow as `O(T)`. |
| MuKV | Future question is unknown; later retrieval spans three granularities | Segment-, frame-, and patch-level compressed KV banks | active-bounded / archive-grows | multi-grain write/compress, retrieve/rerank | No | Multiple prefills and archives add compute/storage; a per-300-frame budget is not a fixed lifetime budget. |
| HERMES | Actual question is unknown; fixed generic guidance prompts influence middle/deep eviction | Layer-specific sensory, working, and long-term KV plus summaries | model-state-bounded | layer-wise KV retention and direct answer | No | Generic prompts and summary aggregation can erase rare detail; “no query-time retrieval” does not mean purely visual retention. |
| SAVEMem | Actual question is unknown in Stage 1; fixed pseudo-questions guide write, actual query guides read scope | Short/mid/long projected visual-token tiers | model-state-bounded | semantic retention, scope gate, late-interaction read | No | Fixed semantic probes have domain bias and pointwise salience does not preserve multi-evidence retrieval behavior. |
| CoRDS | Future question is unknown; selection uses joint K/V geometry | Selected K/V coreset plus protected recent tail | model-state-bounded | representative/diverse KV retention | No | Geometric coverage is a surrogate for unknown downstream evidence value. |
| ProtoKV | Delayed question is unknown while state is maintained | Exact near-window KV plus far-history prototype statistics | model-state-bounded | near write, prototype update, pseudo-KV materialization | No | Repeated events can merge into one prototype, destroying counts, episode boundaries, and relative order. |
| NovaCov | Actual question does not guide per-frame set selection | Bounded Historical Reference Bank used to select `K` visual tokens per frame | context-or-cache-grows | pre-LLM set-wise token selection | No | Only the reference bank is bounded; selected tokens still enter downstream history at `K` per frame. |
| StreamingVLM | Continuous narration/dialogue is trained into the stream rather than deferred to a future retrieval query | Attention sinks, recent visual/text KV, rolling generated text | recent-only-bounded | streaming cache, position maintenance, continuous decode | No | Stable infinite runtime is not infinite recall; evicted visual and text evidence cannot be retrieved. |
| ProVideLLM | Streaming procedural tasks and dialogue are available at current time, not as unknown far-future queries | Long-term verbalized summaries plus recent fine-grained visual tokens | context-or-cache-grows | online verbalization and multimodal cache | No | Long-term text is not hard-capped in the reported setup; verbalization can omit exact visual evidence. |
| rLiVS | Future QA is unknown while clips are selected/captioned | Bounded recurrent visual memory plus caption store/index | active-bounded / archive-grows | visual selection, caption write, caption retrieval | Clip association; raw retention not established | Caption omission is irreversible, and the searchable text archive still grows. |
| OASIS | Future question is unknown during event-tree construction; query controls descent | Event hierarchy, summaries, embeddings, keyframes, recent buffer | request-bounded / store-grows | event write/index, route, retrieve | Keyframe/evidence nodes | Root context can be small while the tree and evidence store grow; bad summaries can hide whole branches. |
| FOLIO | Future question is unknown during entity-state writing | Entity/action/state records, recent visual buffer, evidence cache | request-bounded / store-grows | structured write, entity match, evidence expansion | Explicit evidence/keyframe links | Entity merge and writer errors propagate through state chains; records and evidence accumulate. |
| ObjectStream | Future question is unknown during online updates | Fixed latent object, change, and recent-state slots | model-state-bounded | object-centric state update and direct answer | No | Identity drift and slot merging can erase small objects, OCR, and exact event order. |
| AdaVideoRAG | Whole video/index precedes a query; routing is query-aware | Text, visual, and graph databases | request-bounded / store-grows | offline index, route, retrieve, generate | Visual-store association | It is a long-video RAG reference, not native causal streaming; a bounded read does not bound the databases. |
| ViG-RAG | Whole video graph/index precedes a query | Temporal-semantic graph plus multimodal indexes | request-bounded / store-grows | offline graph build, hybrid retrieve, answer | Source association | Graph extraction and retrieval errors must be separated from answer/judge errors; storage scales with source material. |
| StreamRAG | Events are indexed online; actual question gates later retrieval | Event captions/tokens and reusable retrieval entries | request-bounded / store-grows | online segment/write, dynamic retrieve, answer | Event/source association | Query cost can be controlled while the event store grows; caption keys can miss fine visual evidence. |
| MERIT | Episodic memory is built before an unknown query; query uses multiple keys | Growing episodes with multiple semantic keys and temporal neighbors | request-bounded / store-grows | episode write, multi-key retrieve, context expand | Episode/source association | Multi-key recall improves addressability but does not make total storage fixed or guarantee source-faithful generation. |
| SimpleStream | Question is visible only when answered | Most recent `N` frames | recent-only-bounded | query-time recent-window input | Recent frames only | Strong current-perception control, but it deliberately cannot answer distant-history questions. |
| StreamOPD | Post-training teaches decisions from a four-frame, 1 FPS recent window | No long-term memory; recent frames only | recent-only-bounded | post-training and spatio-temporal cue gating | Recent frames only | Gains identify a training counterfactual, not a solution to long-term evidence retention. |

### Quantitative-claim provenance contract

No cross-paper number should leave this ledger unless it is bound to all of the
following: `model/backbone`, `model/version`, `FPS or sampling`, `write and read
budget`, `active versus total storage boundary`, `hardware`, `query timing`,
`judge/version`, `evaluation protocol`, and the exact source `table/row`. Missing
fields turn the number into within-paper context, not a comparable rank.

## Benchmark and Control Protocol Map

Use three different clocks in F1 and F6:

- `Delta_mem`: query video timestamp minus evidence video timestamp;
- `Delta_ready`: first timestamp at which enough evidence exists minus query or
  request registration time;
- `Delta_sys`: output wall-clock time minus input/query wall-clock arrival time.

The first two are video-time properties. They do not prove that a deployed
producer-consumer pipeline keeps up in wall-clock time.

| Artifact | Query/output protocol | Primary evaluation axis | Wall-clock producer-consumer test? | Boundary or shortcut to preserve | Route |
| --- | --- | --- | --- | --- | --- |
| StreamingBench | Timestamped questions over causal video prefixes; 18 task types | Broad streaming QA at query points | No | Query-point accuracy can reward recent-window shortcuts; formal ICASSP metadata supersedes the older arXiv author list. | F1 / F6 |
| OVBench | Online past/current/future understanding with six task families and 16 subtasks | Temporal relation to the present | No | Past, current, and future subsets must not be collapsed into one memory claim. | F1 / F6 |
| OVO-Bench | Backward tracing, real-time understanding, and forward active responding | Retrospective/current/proactive behavior | No | It is independent of OVBench; overall scores can hide distant-history failure. | F1 / F6 |
| StreamBench | Benchmark component inside StreamChat (`2501.13468`) with multi-round interaction | Multi-domain streaming dialogue and reasoning | Not a standardized asynchronous harness | It has no independent paper ID and must not be confused with StreamingBench. | F1 / F6 |
| PhoStream | Mobile, omnimodal, real-world streaming scenarios | Perception and interaction across scenario/task splits | No verified wall-clock producer-consumer test | Preserve sensor/modalities and query direction; do not infer deployment latency from task timing. | F6 |
| RIVER | Retrospective Memory, Live-Perception, Proactive Anticipation | Accuracy as memory delay and interaction type change | No | Its memory-delay curve measures `Delta_mem`, not automatically `Delta_sys`. | F6 |
| StreamReady | A request is known before the answer becomes ready; model predicts what and when | Evidence readiness and response timing | No | Query-known filtering is an oracle relative to unknown-future-query retention. | F1 / F6 |
| MementoBench | Persistent request registered before an all-day stream; proactive outputs | Long-horizon persistent-query text/object/action behavior | No | MementoBench is a component of Memento, not a standalone paper; the query may guide every memory update. | F1 / F6 |
| StreamingEval | Fixed-capacity-memory framework with task quality, visual encoding, decoding, and storage measurements | Deployability and resource/quality trade-offs | Partly: explicit component timing, not a camera backlog test | Formal ACL title uses “Framework”; do not merge it with Streaming-Eval. | F6 |
| VSAS-Bench | Synchronous and asynchronous camera-producer / VLM-consumer protocols | Accuracy, proactivity, consistency, latency trade-off | Yes | Report queueing, frame age, and latency percentiles rather than only average task score. | F6 |
| SPOT-Bench | Prediction at every stream slot across Detection, Interaction, and Intervention | Continuous proactive timeliness via Timeliness-F1 | No by default | It removes the pause-at-query shortcut but video-time timeliness still differs from wall-clock throughput. | F6 |
| Streaming-Eval | Benchmark component in *Harnessing Streaming Video in the Wild* | Streaming Interaction and Streaming Understanding, including SW-F1 | No verified asynchronous harness | Hyphenated component, not the ACL StreamingEval paper; keep its training set and harness provenance attached. | F6 |
| StreamArena | Open-ended QA over full long videos with perception, history, interaction, and tool use | Hour-scale agentic behavior | No verified real-time producer-consumer guarantee | Recent-only, text-only history, and repeatedly compressed visual memory are distinct controls. | F6 standalone |
| SimpleStream | Recent-`N` frame, training-free method control | Whether benchmark gains require long-term memory | No | Bind every reported number to exact model variant and protocol; it is a method, not a benchmark. | F7 |
| StreamOPD | Recent four frames at 1 FPS after streaming-specific post-training | Whether gains come from post-training rather than memory architecture | No | Match backbone and post-training in the long-memory cell before attributing gains to architecture. | F7 standalone |

## Disambiguation Registry

Stable keys below are mandatory in research notes, commit messages, and scratch
data whenever a short name can collide.

| Stable key | Canonical object | Resolution rule |
| --- | --- | --- |
| `streamchat-liu-2412` | *StreamChat: Chatting with Streaming Video* (`2412.08646`) | Trained cross-attention and visual-context refresh during decoding; arXiv-only. Never inherit StreamBench, hierarchical memory, or the Xiong et al. code. |
| `streamchat-xiong-iclr25` | *Streaming Video Understanding and Multi-round Interaction with Memory-enhanced Knowledge* (`2501.13468`) | Training-free hierarchical memory and multi-round system; owns StreamBench. This is the paper covered by the existing `StreamChat` post. |
| `flash-vstream-2024` | *Flash-VStream: Memory-Based Real-Time Understanding for Long Video Streams* (`2406.08085`) | STAR memory and VStream-QA; arXiv-only. |
| `flash-vstream-iccv25` | *Flash-VStream: Efficient Real-Time Understanding for Long Video Streams* (`2506.23825`) | Distinct paper and architecture using Context Synopsis Memory and Detail Augmentation Memory. It is not arXiv v2 of the 2024 paper. High-resolution history may be retained on disk, so total storage is not proven fixed. |
| `livevlm-v1` | LiveVLM arXiv v1 (`2505.15269v1`, 2025-05-21) | Older attention-discard/FIFO/chunk-retrieval mechanism. Keep v1-specific metrics with this key. |
| `livevlm-v2` | LiveVLM arXiv v2 (`2505.15269v2`, 2026-04-23) / DAC 2026 | Canonical current work: Vision Sink Bucketing plus Position-agnostic KV Retrieval. The v1→v2 change is a material rewrite within one arXiv lineage. |
| `ovbench-cvpr25` | OVBench in *Online Video Understanding: OVBench and VideoChat-Online* (`2501.00584`) | Independent CVPR 2025 benchmark; not a spelling variant of OVO-Bench. |
| `ovo-bench-cvpr25` | *OVO-Bench: How Far is Your Video-LLMs from Real-World Online Video Understanding?* (`2501.05510`) | Independent CVPR 2025 benchmark; keep proceedings author order when formally citing it. |
| `streamingbench-icassp26` | *StreamingBench: Assessing the Gap for MLLMs to Achieve Streaming Video Understanding* (`2411.03628`) | Standalone ICASSP 2026 paper. Formal proceedings metadata supersedes the shorter arXiv author list. |
| `streambench-streamchat-iclr25` | StreamBench benchmark component | Belongs only to `streamchat-xiong-iclr25`; it has no independent paper identifier. |
| `streamarena-2608` | *StreamArena: Toward Continuous, Interactive, and Long-Horizon Agentic Streaming Video Understanding* (`2608.05703`) | 2026 frontier preprint and planned F6 note; unrelated to StreamingBench and StreamBench. |
| `streamingeval-acl26` | *StreamingEval: A Unified Evaluation Framework towards Realistic Streaming Video Understanding* (`2603.21493`) | Findings of ACL 2026 deployability framework; formal title uses “Framework,” while arXiv used “Protocol.” |
| `streaming-eval-yao-2606` | Streaming-Eval inside *Harnessing Streaming Video in the Wild* (`2606.08615`) | Hyphenated content/interaction benchmark component; never merge data, metrics, or code with ACL StreamingEval. |
| `streammind-iccv25` | *StreamMind: Unlocking Full Frame Rate Streaming Video Dialogue through Event-Gated Cognition* (`2503.06220`) | ICCV 2025 event-gated dialogue paper. |
| `streammind-streamarena-2608` | StreamMind system bundled with StreamArena | Distinct 2026 two-tier system; cite through the StreamArena paper and repository. |
| `spot-bench-2604` | SPOT-Bench in *Don't Pause! Every prediction matters in a streaming video* (`2604.24317`) | Continuous per-slot benchmark/method package; `SPOT-Bench` is not the paper title. |
| `lyrav-2606` | *Don't Pause: Streaming Video-Language Synchrony for Online Video Understanding* (`2606.06991`) | Separate “Don't Pause” title and LyraV method; no relation should be inferred from wording alone. |
| `mementobench-memento-iclr26` | MementoBench inside *Memento* | Benchmark suite within the ICLR 2026 Memento paper, not an independent paper or arXiv ID. |

### Method aliases and title drift

| Short name used in prose | Canonical citation title at cutoff | Rule |
| --- | --- | --- |
| SelectStream | *What Should a Streaming Video Model Remember?* | SelectStream is the method alias; do not replace the reference title with “Adaptive Evidence Selection.” |
| SAVEMem | *Semantic-Aware Adaptive Visual Memory for Streaming Video Understanding* | SAVEMem is the method alias and is not prefixed in the arXiv title. |
| CausalMem | *Towards a Dynamic and Fixed-budget Memory Bank for Efficient Streaming Video Understanding* | CausalMem is the method alias. |
| NovaCov | *Think in Sets for Streaming Video Token Compression* | NovaCov is the method alias. |
| MERIT | *Keep It Simple: Multi-Key Episodic Memory Retrieval for Ultra-Long Video Understanding* | MERIT is the method alias. |
| ProVideLLM | *Streaming VideoLLMs for Real-Time Procedural Video Understanding* | Use the ICCV proceedings title; the earlier arXiv title included “Memory-efficient.” |
| WeaveTime | *WeaveTime: Streaming from Earlier Frames into Emergent Memory in VideoLLMs* | Use “Streaming from” for the CVPR citation; arXiv v1 used “Stream from.” |
| StreamingEval | *StreamingEval: A Unified Evaluation Framework towards Realistic Streaming Video Understanding* | ACL proceedings changed arXiv's “Protocol” to “Framework.” |
| StreamEMS | *StreamEMS: Streaming Video Understanding with Self-Evolving Memory Scheme for Vision-Language Models* | Use this full arXiv title, not the descriptive shorthand “Evolving Memory States.” |
| SPOT-Bench | *Don't Pause! Every prediction matters in a streaming video* | Keep the benchmark alias separate from the paper title. |
| Inf-Streams-Eval | Dataset name in the StreamingVLM paper | The official Hugging Face slug is `Inf-Stream-Eval`; record both forms instead of silently normalizing one into the other. |
| STC | *Accelerating Streaming Video Large Language Models via Hierarchical Token Compression* | Spell out the CVPR 2026 method on first use because older comparison tables may use `STC` for another compressor. |

## Existing-site Coverage Map

Coverage status is about how reusable the local article is for this program; it
does not replace source verification:

- `detailed`: reusable focused note; later phases should link instead of copying;
- `needs-update`: existing URL is preserved, but material research or framing is
  missing;
- `supporting`: useful context, not a streaming-memory method article;
- `planned`: no current asset; the target bundle is already fixed by `PLAN.md`.

The research corpus contains 20 in-scope assets: 15 detailed paper notes, four
assets that need material updates, and one supporting model note. The personal
Hello World post is excluded from the research-series denominator.

| Canonical key / identifier | Existing coverage | Status | Target | Required follow-up |
| --- | --- | --- | --- | --- |
| `AdaVideoRAG` · `2506.13589` | [`content/posts/AdaVideoRAG/index.md`](../../content/posts/AdaVideoRAG/index.md) | detailed | F5 primary; F1/F3 context | Reuse the method detail; label it query-known/offline long-video RAG, keep its databases growing, and add the formal NeurIPS source. |
| `InfiniPot-V` · `2506.15745` | [`content/posts/InfiniPotV/index.md`](../../content/posts/InfiniPotV/index.md) | detailed | F2/F3 primary; F6 context | Preserve the visual-KV budget boundary, separate other retained state, expand `STC` on first use, and link the formal NeurIPS record. |
| `livevlm-v2` · `2505.15269v2` | [`content/posts/LiveVLM/index.md`](../../content/posts/LiveVLM/index.md) | detailed | F2/F3 primary; F6 context | Add v1→v2 provenance and DAC acceptance source; never mix v1 metrics with VSB/PaR. |
| `mementobench-memento-iclr26` · `FtdbdoGbk3` | [`content/posts/Memento/index.md`](../../content/posts/Memento/index.md) | detailed | F6 primary; F3/F4 context | Keep persistent-query visibility and growing dialogue/external state explicit; MementoBench remains a component. |
| `MuKV` · `2605.22269` | [`content/posts/MuKV/index.md`](../../content/posts/MuKV/index.md) | detailed | F2/F3 primary; F6 context | Do not turn a per-300-frame token budget into a lifetime bound; preserve paper/code differences and add CVPR proceedings. |
| `OASIS` · `2604.17052` | [`content/posts/OASIS/index.md`](../../content/posts/OASIS/index.md) | detailed | F4/F5 primary; F3/F6 context | Reuse via links; retain the bounded-request/growing-tree distinction and the optional-vs-prompted retrieval implementation caveat. |
| `Qwen3-VL` · `2511.21631` | [`content/posts/Qwen3-VL/index.md`](../../content/posts/Qwen3-VL/index.md) | supporting | F7 matched-backbone control; F1 context | Treat as a backbone report, not a streaming-memory method; qualify “current model” language and identify StreamChat by stable key. |
| `ReKV` · `2503.00540` | [`content/posts/ReKV/index.md`](../../content/posts/ReKV/index.md) | needs-update | F2 primary; F1/F3/F5/F6 context | Add setting card, write/read/archive split, `O(T)` CPU/disk accounting, positional caveat, matched protocol, substantive takeaways, and formal ICLR source. |
| `STC` · `2512.00891` | [`content/posts/STC/index.md`](../../content/posts/STC/index.md) | detailed | F3 primary; F1/F6 context | Preserve stage-only acceleration and growing downstream history; disambiguate the acronym in inherited comparison tables. |
| `SimpleStream` · `2604.02317` | [`content/posts/SimpleStream/index.md`](../../content/posts/SimpleStream/index.md) | needs-update | F7 primary; F1/F6 context | Add setting/protocol/failure analysis and metric provenance; recent-only success is not long-term-memory success. |
| `streamchat-xiong-iclr25` · `2501.13468` | [`content/posts/StreamChat/index.md`](../../content/posts/StreamChat/index.md) | detailed | F1/F6 primary; F3 context | Add explicit collision note for `streamchat-liu-2412`; resolve every Flash-VStream reference to one paper; do not equate RPD/FPS with wall-clock latency. |
| `StreamKV` · `2511.07278` | [`content/posts/StreamKV/index.md`](../../content/posts/StreamKV/index.md) | detailed | F2/F3 primary; F6 context | State that summary/frame banks accumulate, retain the position caveat, and add the AAAI proceedings source. |
| `StreamMem` · `2508.15717` | [`content/posts/StreamMem/index.md`](../../content/posts/StreamMem/index.md) | detailed | F2/F3 primary; F6 context | Qualify the venue as CVPR 2026 VidLLMs workshop, audit non-visual state separately, and disambiguate Flash-VStream baselines. |
| `StreamingTOM` · `2510.18269` | [`content/posts/StreamingTOM/index.md`](../../content/posts/StreamingTOM/index.md) | detailed | F3 primary; F1/F6 context | Preserve bounded active cache versus `O(T)` quantized history; add the formal CVPR source. |
| pipeline survey | [`content/posts/StreamingVLM-Pipeline/index.md`](../../content/posts/StreamingVLM-Pipeline/index.md) | needs-update | F3 primary; bridge F1/F2/F4/F5/F7 | Add the full 2026 pipeline, query visibility and scheduler stages; remove the duplicate InfiniPot-V row and replace copied detail with internal links. |
| `StreamingVLM` · `2510.09608` | [`content/posts/StreamingVLM/index.md`](../../content/posts/StreamingVLM/index.md) | detailed | F1/F6 primary; F3/F7 context | Keep “infinite runtime ≠ infinite recall,” add version/formal ICLR provenance, and preserve benchmark-name and judge/hardware constraints. |
| benchmark survey | [`content/posts/StreamingVideoBenchmarks/index.md`](../../content/posts/StreamingVideoBenchmarks/index.md) | needs-update | F6 primary; F1/F7 context | Add the six missing P0 benchmarks, three-clock model, queue/frame-age/percentile metrics, collision keys, and metric provenance without creating a unified leaderboard. |
| `ViG-RAG` · AAAI `36963` | [`content/posts/ViG-RAG/index.md`](../../content/posts/ViG-RAG/index.md) | detailed | F5 primary; F1/F3 context | Keep it query-known/offline, separate retrieval from answer/judge quality, and account for growing graph/index/source storage. |
| `WeaveTime` · `2602.22142` | [`content/posts/WeaveTime/index.md`](../../content/posts/WeaveTime/index.md) | detailed | F2/F3 primary; F6 context | Record the arXiv/proceedings title drift; preserve growing ReKV archive, entropy, attribution, and position-integrity caveats. |
| `rLiVS` · `2510.17364` | [`content/posts/rLiVS/index.md`](../../content/posts/rLiVS/index.md) | detailed | F5 primary; F1/F3 context | Separate bounded recurrent vision from the growing caption index, retain caption-omission failure, and add the formal NeurIPS source. |

### Fixed targets with no existing asset

| Target phase | Planned asset | Primary job | Source groups already seeded |
| --- | --- | --- | --- |
| F1 | `content/posts/StreamingVideoLMM-Development/index.md` | Development overview and series hub | Timeline nodes, interaction systems, six-path framing |
| F2 | `content/posts/StreamingMemory-Retention/index.md` | Bounded-memory evolution | ReKV, LiveVLM, InfiniPot-V, StreamMem, HERMES, ProtoKV |
| F3 | `content/posts/SetWise-Streaming-Memory/index.md` | Set-wise retention comparison | SAVEMem, CoRDS, NovaCov and existing pipeline methods |
| F4 | `content/posts/Structured-Streaming-Memory/index.md` | Structured long-term state | StreamForest, OASIS, FOLIO, ObjectStream, D-HSM, StreamEMS |
| F5 | `content/posts/Verifiable-Video-RAG/index.md` | Multi-key and independently testable Video RAG | rLiVS, AdaVideoRAG, ViG-RAG, StreamRAG, OASIS, MERIT, CARVE, StreamScout |
| F6 | `content/posts/StreamArena/index.md` | Hour-scale benchmark/system note | StreamArena plus benchmark controls in the protocol map |
| F7 | `content/posts/StreamOPD/index.md` | Architecture-versus-post-training control | StreamOPD, SimpleStream, Qwen3-VL backbone context |

### Cross-site integration debt captured for later phases

- None of the 20 research assets yet uses the canonical
  `streaming-video-lmm` tag.
- There are no post-to-post internal links; all reciprocal series navigation is
  still pending.
- Several paper notes expose only arXiv at the top even though a formal primary
  record now exists; the row-specific actions above preserve that debt for F2–F8.
- Bare `Flash-VStream`, `StreamChat`, `StreamBench`, `StreamingEval`, and `STC`
  references must be resolved before any touched public post passes its content
  gate.

## Records Not Routed to Initial Standalone Coverage

These entries may be added when they materially affect the active articles:

- Inf-MLLM (`arXiv:2409.09086`) and V-Rex (`arXiv:2512.12284`) for a dedicated
  systems-acceleration branch;
- query-known methods beyond their role as oracle comparisons;
- offline long-video benchmarks that do not establish a streaming protocol;
- domain-specific event-memory work beyond StreamSoccer;
- secondary surveys and community-maintained paper lists.
