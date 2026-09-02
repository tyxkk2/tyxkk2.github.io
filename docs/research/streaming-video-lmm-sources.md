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
| `frontier-preprint` | Very recent preprint used for frontier tracking, not for carrying a mature survey conclusion. |
| `technical-report` | Model or system report outside the core method-paper maturity ladder. |

### Routing vocabulary

| Value | Meaning |
| --- | --- |
| `F1 hub` | Development overview; no standalone article in the initial program. |
| `F2 thematic` | Bounded-memory evolution article or ReKV update. |
| `F3 thematic` | Set-wise retention article or Pipeline v2. |
| `F4 thematic` | Structured-memory article. |
| `F5 thematic` | Verifiable Video RAG article. |
| `F6 index` | Benchmark index or StreamArena note. |
| `F7 control` | SimpleStream/StreamOPD counterfactual. |
| `existing` | Existing detailed post; link and update selectively. |
| `watchlist` | Track versions; do not create an initial standalone article. |

### Ledger schema

The source register and the coverage map together form the ledger schema:

| Required field | Recorded in |
| --- | --- |
| Canonical title | `Canonical title` |
| Method or benchmark alias | `Key / alias`; collisions receive a stable key in the registry below |
| Persistent identifier | Linked arXiv, DOI, Anthology, OpenReview, or proceedings record in `Primary record` |
| First-public date | `First public`; `proceedings YYYY` is used when no earlier primary record is verified |
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
| MA-LMM | MA-LMM: Memory-Augmented Large Multimodal Model for Long-Term Video Understanding | 2024-04 | arXiv v2 · 2024-04-24 | CVPR 2024 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2024/html/He_MA-LMM_Memory-Augmented_Large_Multimodal_Model_for_Long-Term_Video_CVPR_2024_paper.html) | [Project](https://boheumd.github.io/MA-LMM/) · [Code](https://github.com/boheumd/MA-LMM) | F1 hub | 2026-09-02 |
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
| LiveVLM | LiveVLM: Efficient Online Video Understanding via Streaming-Oriented KV Cache and Retrieval | 2025-05 | arXiv v2 · 2026-04-23 | DAC 2026 · published | [DAC program](https://63dac.conference-program.com/presentation/?id=RESEARCH670&sess=sess314) · [arXiv:2505.15269](https://arxiv.org/abs/2505.15269) | [Code](https://github.com/sjtu-zhao-lab/LiveVLM) | existing / F2 | 2026-09-02 |
| InfiniPot-V | InfiniPot-V: Memory-Constrained KV Cache Compression for Streaming Video Understanding | 2025-06 | arXiv v2 · 2025-10-24 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/caef5f5e658aa1f7565f063a2cd99726-Abstract-Conference.html) | [Research reimplementation](https://github.com/aiha-lab/InfiniPot-V) | existing / F2 | 2026-09-02 |
| Flash-VStream 2025 | Flash-VStream: Efficient Real-Time Understanding for Long Video Streams | 2025-06 | arXiv v2 · 2025-07-24 | ICCV 2025 · published | [ICCV](https://openaccess.thecvf.com/content/ICCV2025/html/Zhang_Flash-VStream_Efficient_Real-Time_Understanding_for_Long_Video_Streams_ICCV_2025_paper.html) | [Code](https://github.com/IVGSZ/Flash-VStream) | F1 hub / F4 context | 2026-09-02 |
| StreamMem | StreamMem: Query-Agnostic KV Cache Memory for Streaming Video Understanding | 2025-08 | arXiv v1 · 2025-08-21 | CVPR 2026 VidLLMs workshop · accepted | [arXiv:2508.15717](https://arxiv.org/abs/2508.15717) · [author status](https://zhanglizhu.github.io/) | [Project](https://yangyanl.ai/streammem/) | existing / F2 | 2026-09-02 |
| StreamForest | StreamForest: Efficient Online Video Understanding with Persistent Event Memory | 2025-09 | arXiv v1 · 2025-09-29 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/6dd91fec726dbed8915a1fbadd91d1d2-Abstract-Conference.html) | [Code](https://github.com/MCG-NJU/StreamForest) | F1 hub / F4 | 2026-09-02 |
| StreamingTOM | StreamingTOM: Streaming Token Compression for Efficient Video Understanding | 2025-10 | arXiv v2 · 2026-03-14 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Chen_StreamingTOM_Streaming_Token_Compression_for_Efficient_Video_Understanding_CVPR_2026_paper.html) | [Project](https://yige24.github.io/StreamingTOM/) · [Code](https://github.com/YIGE24/StreamingTOM) | existing / F3 | 2026-09-02 |
| StreamKV | StreamKV: Streaming Video Question-Answering with Segment-based KV Cache Retrieval and Compression | 2025-11 | arXiv v1 · 2025-11-10 | AAAI 2026 · published | [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/37305) | [Code](https://github.com/sou1p0wer/StreamKV) | existing / F2 / F3 | 2026-09-02 |
| STC | Accelerating Streaming Video Large Language Models via Hierarchical Token Compression | 2025-11 | arXiv v2 · 2026-02-11 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Wang_Accelerating_Streaming_Video_Large_Language_Models_via_Hierarchical_Token_Compression_CVPR_2026_paper.html) | [Code](https://github.com/lern-to-write/STC) | existing / F3 | 2026-09-02 |
| HERMES | HERMES: KV Cache as Hierarchical Memory for Efficient Streaming Video Understanding | 2026-01 | arXiv v4 · 2026-05-07 | ACL 2026 Long · published | [ACL Anthology](https://aclanthology.org/2026.acl-long.381/) · [arXiv:2601.14724](https://arxiv.org/abs/2601.14724) | [Project](https://hermes-streaming.github.io/) · [Code](https://github.com/haowei-freesky/HERMES) | F2 / F3 | 2026-09-02 |
| WeaveTime | WeaveTime: Streaming from Earlier Frames into Emergent Memory in VideoLLMs | 2026-02 | arXiv v1 · 2026-02-25 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Zhang_WeaveTime_Streaming_from_Earlier_Frames_into_Emergent_Memory_in_VideoLLMs_CVPR_2026_paper.html) | [Project](https://zhangyl4.github.io/publications/weavetime/) · [Code](https://github.com/zhangyl4/weavetime) | existing / F2 / F3 | 2026-09-02 |
| FluxMem | FluxMem: Adaptive Hierarchical Memory for Streaming Video Understanding | 2026-03 | arXiv v1 · 2026-03-02 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_FluxMem_Adaptive_Hierarchical_Memory_for_Streaming_Video_Understanding_CVPR_2026_paper.html) | [Project](https://yiwengxie.com/FluxMem/) | F1 hub / F3 context | 2026-09-02 |
| FlexMem | Scaling the Long Video Understanding of Multimodal Large Language Models via Visual Memory Mechanism | 2026-03 | arXiv v1 · 2026-03-31 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Chen_Scaling_the_Long_Video_Understanding_of_Multimodal_Large_Language_Models_CVPR_2026_paper.html) | — | F2 context | 2026-09-02 |
| SAVEMem | Semantic-Aware Adaptive Visual Memory for Streaming Video Understanding | 2026-05 | arXiv v1 · 2026-05-08 | preprint | [arXiv:2605.07897](https://arxiv.org/abs/2605.07897) | [Code](https://github.com/wuhang03/savemem) | F3 thematic | 2026-09-02 |
| CoRDS | CoRDS: Coreset-based Representative and Diverse Selection for Streaming Video Understanding | 2026-05 | arXiv v1 · 2026-05-14 | preprint | [arXiv:2605.14310](https://arxiv.org/abs/2605.14310) | [Partial code](https://github.com/ailarmhz/CoRDS) | F3 thematic | 2026-09-02 |
| MuKV | MuKV: Multi-Grained KV Cache Compression for Long Streaming Video Question-Answering | 2026-05 | arXiv v1 · 2026-05-21 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xiao_MuKV_Multi-Grained_KV_Cache_Compression_for_Long_Streaming_Video_Question-Answering_CVPR_2026_paper.html) | [Code](https://github.com/IMBALDY/MuKV) | existing / F2 / F3 | 2026-09-02 |
| SelectStream | What Should a Streaming Video Model Remember? | 2026-06 | arXiv v1 · 2026-06-15 | preprint | [arXiv:2606.16353](https://arxiv.org/abs/2606.16353) | — | F4 thematic | 2026-09-02 |
| CausalMem | Towards a Dynamic and Fixed-budget Memory Bank for Efficient Streaming Video Understanding | 2026-06 | arXiv v1 · 2026-06-24 | preprint | [arXiv:2606.25658](https://arxiv.org/abs/2606.25658) | — | F2 context | 2026-09-02 |
| ProtoKV | ProtoKV: Streaming Video Understanding under Delayed Query with Summary-State Memory | 2026-06 | arXiv v1 · 2026-06-25 | ICML 2026 · accepted | [arXiv:2606.26762](https://arxiv.org/abs/2606.26762) · [author-lab status](https://ina.kaist.ac.kr/publications/) | [Code placeholder](https://github.com/kaist-ina/ProtoKV) | F2 thematic | 2026-09-02 |
| NovaCov | Think in Sets for Streaming Video Token Compression | 2026-08 | arXiv v1 · 2026-08-02 | preprint | [arXiv:2608.01169](https://arxiv.org/abs/2608.01169) | — | F3 thematic | 2026-09-02 |
| StreamFlow | StreamFlow: Dynamic Memory Flows for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-11 | frontier-preprint | [arXiv:2608.10949](https://arxiv.org/abs/2608.10949) | — | watchlist | 2026-09-02 |
| StreamTTT | StreamTTT: Reconciling Real-Time Perception and Long-Term Memory in Streaming VLMs | 2026-08 | arXiv v2 · 2026-08-16 | frontier-preprint | [arXiv:2608.13416](https://arxiv.org/abs/2608.13416) | — | watchlist | 2026-09-02 |

### C. Structured state and Video RAG

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AdaVideoRAG | AdaVideoRAG: Omni-Contextual Adaptive Retrieval-Augmented Efficient Long Video Understanding | 2025-06 | arXiv v3 · 2025-11-23 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/092359ce5cf60a80e882378944bf1be4-Abstract-Conference.html) | [Code](https://github.com/xzc-zju/AdaVideoRAG) | existing / F5 | 2026-09-02 |
| rLiVS | Recurrent Attention-based Token Selection for Efficient Streaming Video-LLMs | 2025-10 | arXiv v1 · 2025-10-20 | NeurIPS 2025 · published | [NeurIPS](https://proceedings.neurips.cc/paper_files/paper/2025/hash/d4857f724cc1af4c8f1e18032426aa2e-Abstract-Conference.html) | [Code](https://github.com/vdorovatas/rLiVS) | existing / F5 | 2026-09-02 |
| ViG-RAG | ViG-RAG: Video-aware Graph Retrieval-Augmented Generation via Temporal and Semantic Hybrid Reasoning | proceedings 2026 | proceedings · 2026-03-14 | AAAI 2026 · published | [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/36963) | [Code](https://github.com/AI-Researcher-Team/ViG-RAG) | existing / F5 | 2026-09-02 |
| OASIS | OASIS: On-Demand Hierarchical Event Memory for Streaming Video Reasoning | 2026-04 | arXiv v1 · 2026-04-18 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Liang_OASIS_On-Demand_Hierarchical_Event_Memory_for_Streaming_Video_Reasoning_CVPR_2026_paper.html) | [Code](https://github.com/Solus-sano/OASIS) | existing / F4 / F5 | 2026-09-02 |
| StreamRAG | StreamRAG: Enhancing Real-Time Video Understanding with Retrieval Augmentation | proceedings 2026 | proceedings · checked 2026-09-02 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Xie_StreamRAG_Enhancing_Real-Time_Video_Understanding_with_Retrieval_Augmentation_CVPR_2026_paper.html) | — | F1 hub / F5 | 2026-09-02 |
| CARVE / V-RAGBench | Rethinking RAG in Long Videos: What to Retrieve and How to Use It? | 2026-06 | arXiv v1 · 2026-06-11 | preprint | [arXiv:2606.13141](https://arxiv.org/abs/2606.13141) | — | F5 thematic | 2026-09-02 |
| FOLIO | FOLIO: Focused Semantic Memory for Streaming Video Understanding | 2026-07 | arXiv v1 · 2026-07-14 | preprint | [arXiv:2607.13298](https://arxiv.org/abs/2607.13298) | — | F4 thematic | 2026-09-02 |
| ObjectStream | ObjectStream: Latent Objects as Memory Anchors for Streaming Video Understanding | 2026-07 | arXiv v2 · 2026-08-01 | frontier-preprint | [arXiv:2607.28312](https://arxiv.org/abs/2607.28312) | [Code](https://github.com/DMK041218/ObjectStream) | F4 thematic / watchlist | 2026-09-02 |
| MERIT | Keep It Simple: Multi-Key Episodic Memory Retrieval for Ultra-Long Video Understanding | 2026-08 | arXiv v1 · 2026-08-07 | ECCV 2026 Oral · accepted | [arXiv:2608.07663](https://arxiv.org/abs/2608.07663) | [Project](https://choi-yeeun.github.io/MERIT/) | F5 thematic | 2026-09-02 |
| StreamEMS | StreamEMS: Streaming Video Understanding with Self-Evolving Memory Scheme for Vision-Language Models | 2026-08 | arXiv v1 · 2026-08-28 | frontier-preprint | [arXiv:2608.27881](https://arxiv.org/abs/2608.27881) | — | watchlist | 2026-09-02 |
| D-HSM | Dynamic Hub-and-Spoke Memory for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-31 | Findings of EMNLP 2026 · accepted | [arXiv:2608.30294](https://arxiv.org/abs/2608.30294) | — | F4 context / watchlist | 2026-09-02 |
| StreamScout | StreamScout: Learning When to Look Deeper for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-31 | frontier-preprint | [arXiv:2609.00291](https://arxiv.org/abs/2609.00291) | — | F5 context / watchlist | 2026-09-02 |

### D. Evaluation, system realism, and counterfactual controls

| Key / alias | Canonical title | First public | Checked record | Venue / maturity | Primary record | Official project or code | Route | Verified |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| StreamingBench | StreamingBench: Assessing the Gap for MLLMs to Achieve Streaming Video Understanding | 2024-11 | arXiv v1 · 2024-11-06 | ICASSP 2026 · published | [DOI](https://doi.org/10.1109/ICASSP55912.2026.11463959) · [arXiv:2411.03628](https://arxiv.org/abs/2411.03628) | [Code](https://github.com/THUNLP-MT/StreamingBench) | F1 hub / F6 index | 2026-09-02 |
| OVBench / VideoChat-Online | Online Video Understanding: OVBench and VideoChat-Online | 2024-12 | arXiv v2 · 2025-04-17 | CVPR 2025 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2025/html/Huang_Online_Video_Understanding_OVBench_and_VideoChat-Online_CVPR_2025_paper.html) | [Project](https://videochat-online.github.io/) | F1 hub / F6 index | 2026-09-02 |
| OVO-Bench | OVO-Bench: How Far is Your Video-LLMs from Real-World Online Video Understanding? | 2025-01 | arXiv v2 · 2025-03-27 | CVPR 2025 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2025/html/Niu_OVO-Bench_How_Far_is_Your_Video-LLMs_from_Real-World_Online_Video_CVPR_2025_paper.html) | [Project](https://joeleelyf.github.io/OVO-Bench/) · [Code](https://github.com/JoeLeelyf/OVO-Bench) | F1 hub / F6 index | 2026-09-02 |
| PhoStream | PhoStream: Benchmarking Real-World Streaming for Omnimodal Assistants in Mobile Scenarios | 2026-01 | arXiv v1 · 2026-01-30 | preprint; venue not verified here | [arXiv:2601.22575](https://arxiv.org/abs/2601.22575) | — | F6 index | 2026-09-02 |
| RIVER | RIVER: A Real-Time Interaction Benchmark for Video LLMs | 2026-03 | arXiv v1 · 2026-03-04 | preprint | [arXiv:2603.03985](https://arxiv.org/abs/2603.03985) | [Code/data](https://github.com/OpenGVLab/RIVER) | F6 index | 2026-09-02 |
| StreamReady | StreamReady: Learning What to Answer and When in Long Streaming Videos | 2026-03 | arXiv v1 · 2026-03-09 | CVPR 2026 · published | [CVPR](https://openaccess.thecvf.com/content/CVPR2026/html/Azad_StreamReady_Learning_What_to_Answer_and_When_in_Long_Streaming_Videos_CVPR_2026_paper.html) | — | F1 hub / F6 index | 2026-09-02 |
| VST | Video Streaming Thinking: VideoLLMs Can Watch and Think Simultaneously | 2026-03 | arXiv v2 · 2026-07-17 | ECCV 2026 · accepted | [arXiv:2603.12262](https://arxiv.org/abs/2603.12262) | [Project](https://1ranguan.github.io/VST/) | F1 hub | 2026-09-02 |
| ThinkStream | Thinking in Streaming Video | 2026-03 | arXiv v1 · 2026-03-13 | preprint; venue not verified here | [arXiv:2603.12938](https://arxiv.org/abs/2603.12938) | — | F1 hub | 2026-09-02 |
| StreamingEval | StreamingEval: A Unified Evaluation Framework towards Realistic Streaming Video Understanding | 2026-03 | arXiv v1 · 2026-03-23 | Findings of ACL 2026 · published | [ACL Anthology](https://aclanthology.org/2026.findings-acl.295/) | — | F6 index | 2026-09-02 |
| SimpleStream | A Simple Baseline for Streaming Video Understanding | 2026-04 | arXiv v1 · 2026-04-02 | preprint | [arXiv:2604.02317](https://arxiv.org/abs/2604.02317) | [Project](https://simple-stream.github.io/) · [Code](https://github.com/EvolvingLMMs-Lab/SimpleStream) | existing / F7 control | 2026-09-02 |
| VSAS-Bench | VSAS-Bench: Real-Time Evaluation of Visual Streaming Assistant Models | 2026-04 | arXiv v2 · 2026-05-05 | CVPR Findings 2026 · published | [CVPR Findings](https://openaccess.thecvf.com/content/CVPR2026F/html/Vasu_VSAS-Bench_Real-Time_Evaluation_of_Visual_Streaming_Assistant_Models_CVPRF_2026_paper.html) | — | F6 index | 2026-09-02 |
| SPOT-Bench | Don't Pause! Every prediction matters in a streaming video | 2026-04 | arXiv v1 · 2026-04-27 | preprint | [arXiv:2604.24317](https://arxiv.org/abs/2604.24317) | [Project](https://dibschat.github.io/SPOT-Bench/) · [Code/data](https://github.com/dibschat/SPOT-Bench) | F6 index | 2026-09-02 |
| Memento / MementoBench | Memento: Toward an All-Day Proactive Assistant for Ultra-Long Streaming Video | proceedings 2026 | proceedings · checked 2026-09-02 | ICLR 2026 · published | [ICLR](https://proceedings.iclr.cc/paper_files/paper/2026/hash/3b5f4587a0bdb81ecc6ce9d82320a5c2-Abstract-Conference.html) | [OpenReview](https://openreview.net/forum?id=FtdbdoGbk3) | existing / F1 hub / F6 index | 2026-09-02 |
| Streaming-Eval harness | Harnessing Streaming Video in the Wild | 2026-06 | arXiv v1 · 2026-06-07 | preprint | [arXiv:2606.08615](https://arxiv.org/abs/2606.08615) | — | F6 index | 2026-09-02 |
| LyraV | Don't Pause: Streaming Video-Language Synchrony for Online Video Understanding | 2026-06 | arXiv v1 · 2026-06-05 | preprint | [arXiv:2606.06991](https://arxiv.org/abs/2606.06991) | — | F1 hub | 2026-09-02 |
| StreamArena / StreamMind system | StreamArena: Toward Continuous, Interactive, and Long-Horizon Agentic Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-06 | frontier-preprint | [arXiv:2608.05703](https://arxiv.org/abs/2608.05703) | [Code/data](https://github.com/JIA-Lab-research/StreamArena) | F6 index | 2026-09-02 |
| StreamOPD | StreamOPD: A Post-Training Recipe with Spatio-Temporal Cue Gating for Streaming Video Understanding | 2026-08 | arXiv v1 · 2026-08-17 | frontier-preprint | [arXiv:2608.16320](https://arxiv.org/abs/2608.16320) | [Project](https://unix-ai-lab.github.io/StreamOPD/) · [Code](https://github.com/UniX-AI-Lab/StreamOPD) | F7 control | 2026-09-02 |
| StreamSoccer | StreamSoccer: Event-Driven Memory for Streaming Soccer Commentary | 2026-08 | arXiv v1 · 2026-08-20 | frontier-preprint | [arXiv:2608.19723](https://arxiv.org/abs/2608.19723) | — | watchlist | 2026-09-02 |
| Qwen3-VL | Qwen3-VL Technical Report | 2025-11 | arXiv v2 · 2025-11-27 | technical-report | [arXiv:2511.21631](https://arxiv.org/abs/2511.21631) | [Code](https://github.com/QwenLM/Qwen3-VL) | existing / F7 control | 2026-09-02 |

## Records Intentionally Not Yet Promoted

These entries may be added when they materially affect the active articles:

- Inf-MLLM (`arXiv:2409.09086`) and V-Rex (`arXiv:2512.12284`) for a dedicated
  systems-acceleration branch;
- MovieChat+ and query-known methods beyond their role as oracle comparisons;
- offline long-video benchmarks that do not establish a streaming protocol;
- domain-specific event-memory work beyond StreamSoccer;
- secondary surveys and community-maintained paper lists.
