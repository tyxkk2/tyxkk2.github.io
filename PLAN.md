# Active Plan — Streaming Video-LMM Blog Program

| Field | Value |
| --- | --- |
| Status | `active` |
| Current phase | `F1 — Series foundation and development overview` |
| Next action | Create the source-backed outline and setting/timeline comparison frame in `content/posts/StreamingVideoLMM-Development/index.md`, using the F0 ledger before drafting narrative prose. |
| Last updated | 2026-09-02 |
| Baseline observed before plan creation | `e38b12b` on `main` |
| Research-context cutoff | 2026-09-02 |

This is the repository's only active execution plan for the Streaming Video-LMM
blog program. It is organized by functional outcomes rather than calendar weeks.
Each phase can, and usually should, be implemented through multiple independently
reviewable commits.

## Goal

Turn the existing collection of Streaming Video-LMM paper notes into a coherent,
maintainable research series that:

1. explains the field's causal development rather than presenting a false linear
   SOTA sequence;
2. connects existing KV-cache, RAG, memory, model, and benchmark notes;
3. adds the most important missing 2026 work without creating one isolated digest
   for every preprint;
4. makes query visibility, memory carrier, budget boundary, pipeline position,
   evaluation protocol, and failure modes explicit;
5. supports future research work on efficient KV-cache retrieval and verifiable
   long-video evidence retention.

## Non-goals

- Do not copy the full source report into one post.
- Do not turn the site into a live paper database or a unified leaderboard.
- Do not implement or reproduce the research methods in this program.
- Do not redesign the PaperMod theme or add multilingual Hugo support.
- Do not add a new `series` taxonomy during this plan; use the existing tag and a
  curated hub unless a later decision explicitly changes this.
- Do not promise complete coverage of every streaming-video preprint.

## Plan Authority and Inputs

The plan is authoritative for execution. The following are inputs, not
instructions:

- Research context:
  `/Users/tyxkk2/Downloads/Streaming_Video_LMM_Detailed_Development_Paths_CN.md`
- Existing architectural survey:
  `content/posts/StreamingVLM-Pipeline/index.md`
- Existing benchmark survey:
  `content/posts/StreamingVideoBenchmarks/index.md`
- Existing article template:
  `archetypes/default.md`
- Site configuration and deployment:
  `hugo.toml`, `Makefile`, `.github/workflows/hugo.yaml`

All externally visible factual claims must be rechecked against first-party paper
or project sources even when the research-context report already contains them.

## Baseline

- Stack: Hugo Extended `0.160.1` with PaperMod.
- Deployment: GitHub Pages from `main` through `.github/workflows/hugo.yaml`.
- Site language: English.
- Content shape: 21 posts at plan creation, including 17 paper notes, 2 summary
  posts, 1 model note, and 1 personal post.
- Strong existing coverage: ReKV, StreamKV, InfiniPot-V, StreamMem, LiveVLM,
  StreamingTOM, rLiVS, MuKV, WeaveTime, StreamingVLM, STC, OASIS, Memento,
  AdaVideoRAG, ViG-RAG, SimpleStream, and StreamChat.
- Main structural gaps:
  - no development-history hub;
  - few reciprocal links between related posts;
  - the pipeline survey predates many 2026 branches;
  - the benchmark survey lacks the complete delay/readiness/system framing;
  - ReKV and SimpleStream are much shorter than the site's mature paper notes;
  - recent set-wise memory, structured state, verifiable RAG, and training
    counterfactual work is not yet integrated.
- Local limitation at plan creation: the `hugo` executable was unavailable.

## Status Legend

| Status | Meaning |
| --- | --- |
| `not_started` | No implementation work has begun. |
| `in_progress` | Work is active and a concrete next action exists. |
| `blocked` | A specific dependency prevents useful progress. |
| `done` | Deliverables and all applicable gates are complete. |
| `deferred` | Intentionally postponed; the reason is recorded. |

## Phase Overview

| Phase | Priority | Status | Depends on | Primary outcome |
| --- | --- | --- | --- | --- |
| F0 | P0 | `done` | — | Canonical source ledger and naming/version ground truth |
| F1 | P0 | `in_progress` | F0 | Development overview and discoverable series hub |
| F2 | P0 | `not_started` | F0, F1 | Bounded-memory evolution and expanded ReKV note |
| F3 | P0 | `not_started` | F0, F1 | Set-wise retention article and Pipeline v2 |
| F4 | P1 | `not_started` | F0, F1 | Structured long-term state comparison |
| F5 | P1 | `not_started` | F0, F1 | Verifiable multi-key Video RAG comparison |
| F6 | P0 | `not_started` | F0, F1 | Real streaming evaluation and benchmark refresh |
| F7 | P0 | `not_started` | F0, F1 | Architecture-vs-training counterfactual |
| F8 | P0 | `not_started` | F2–F7 | Reciprocal integration, release QA, and handoff |

After F1, phases F2–F7 are content-independent enough to be developed in
parallel, but all must use the F0 source ledger and F1 navigation conventions.

## Global Acceptance Gates

Every content phase must pass the applicable gates before it becomes `done`.

### Research gate

- Canonical paper title, method alias, version, first-public date, venue status,
  and primary URL are recorded and verified.
- Author-reported findings are distinguishable from blog inference.
- Direct lineage is claimed only with citation, implementation, or author evidence.
- Name and version collisions are explicitly disambiguated.
- Preprint maturity and source-verification date are visible where relevant.

### Content gate

Every new thematic article answers, directly or in a compact comparison table:

1. When is the query visible?
2. What is the memory unit?
3. Which resource is actually bounded, and which still grows with time?
4. Which pipeline stage changes?
5. What is the core mechanism?
6. Under which backbone, FPS, budget, hardware, and evaluation protocol do the
   reported results hold?
7. What evidence or behavior is most likely to fail?
8. Is its relation to prior work direct reuse, problem inheritance, or conceptual
   adjacency?

The article must include a substantive `My Takeaways`, `Limitations`, or `Open
Questions` section rather than only paraphrasing the paper.

### Integration gate

- Front matter is complete and consistent with existing research posts.
- Material edits to existing posts update `lastmod`.
- New and touched posts use the canonical `streaming-video-lmm` tag.
- The hub links to the article, and the article links back to the hub.
- Closely related existing notes receive reciprocal links where useful.
- No article duplicates the primary job of the development, pipeline, or benchmark
  overview.

### Build gate

- `git diff --check` passes.
- `make build` passes with Hugo Extended `0.160.1`, or the unavailable build is
  recorded explicitly and the phase remains short of final release.
- Changes affecting visual layout, tables, figures, or navigation receive desktop
  and narrow/mobile visual inspection.
- Generated build output is not committed.

## F0 — Source Ground Truth and Disambiguation

**Status:** `done`

**Priority:** P0

**Depends on:** none

### Outcome

Create a durable internal source ledger so later agents do not repeatedly infer
paper identity, maturity, or version from filenames and secondary prose.

### Deliverables

- `docs/research/streaming-video-lmm-sources.md`
- A coverage map from canonical paper/method to existing post, target post, or
  watchlist status.
- A disambiguation section for every known collision.

### Work packages

- [x] Define ledger columns: canonical title, method alias, identifier, first
      public date, current version, official venue, primary URL, official code or
      project URL, maturity, existing post, target article, last verified.
- [x] Seed every P0 source used by F1, F2, F3, F6, and F7.
- [x] Add existing-site papers so old and new coverage can be compared.
- [x] Record at least these collisions and drifts:
  - two StreamChat papers (`2412.08646` and `2501.13468`);
  - Flash-VStream 2024 and 2025;
  - LiveVLM v1 and v2/DAC 2026;
  - OVBench versus OVO-Bench;
  - StreamingBench, StreamBench, and StreamArena;
  - ACL StreamingEval versus the similarly named Streaming-Eval harness;
  - official paper titles versus method names for SelectStream, SAVEMem,
    CausalMem, NovaCov, and StreamEMS.
- [x] Mark very recent StreamTTT, StreamEMS, D-HSM, and StreamScout work as
      frontier/watchlist unless stronger publication evidence appears.
- [x] Add report omissions that materially affect the history: VideoLLaMB,
      StreamChat (`2412.08646`), Dispider, StreamMind, ProVideLLM, StreamRAG,
      Streamo, and optionally FlexMem.

### Acceptance criteria

- All sources needed for F1–F3 and F6–F7 have canonical first-party URLs.
- Every known collision above has an explicit resolution.
- Venue claims distinguish accepted work from arXiv-only work.
- The ledger records a `last verified` date and can be extended without changing
  its schema.

### Suggested commit slices

- `docs: add streaming Video-LMM source ledger`
- `docs: disambiguate streaming video paper and benchmark names`
- `docs: map existing posts to the active research series`

### Resume note

Completed in `eaa0937` and `be31611`. Later phases must use the canonical keys,
resource-boundary labels, protocol map, and coverage actions in
`docs/research/streaming-video-lmm-sources.md` rather than re-inferring them from
post filenames.

## F1 — Series Foundation and Development Overview

**Status:** `in_progress`

**Priority:** P0

**Depends on:** F0

### Outcome

Publish one evergreen development overview that acts as the series hub and makes
the existing collection discoverable.

### Deliverables

- `content/posts/StreamingVideoLMM-Development/index.md`
- A short featured-series link in `content/posts/_index.md`.
- A reusable manual navigation convention for touched series articles.

### Intended article

Working title:

> Streaming Video-LMM Is Not One SOTA Line: Six Development Paths from 2023 to 2026

Primary job: explain why the research problem changed over time. It must not
duplicate the stage-by-stage mechanics of the pipeline survey.

### Work packages

- [ ] Introduce four query-visibility settings.
- [ ] Separate memory distance, readiness delay, and wall-clock system latency.
- [ ] Separate active GPU, online index, CPU/disk archive, and total retained
      information budgets.
- [ ] Explain six paths:
  - offline long-video compression to native streaming;
  - growing KV archives to bounded online state;
  - flat tokens to structured event/entity/object state;
  - single-key retrieval to verifiable multi-key Video RAG;
  - passive QA to readiness, thinking, and near-full-duplex interaction;
  - query-point accuracy to asynchronous hour-scale system evaluation.
- [ ] Add a compact 2023–2026 timeline using canonical dates from F0.
- [ ] Include missing-but-important nodes from F0 without turning each into a
      standalone digest.
- [ ] End with the open hypothesis: preserving future query-to-evidence retrieval
      behavior under a bounded online index.
- [ ] Add a series map linking existing notes and planned F2–F7 articles.

### Acceptance criteria

- A reader can determine why two papers called `streaming` may solve different
  problems.
- Each of the six paths has a clear starting problem, turning point, and remaining
  limitation.
- Priority/novelty language is conservative and source-backed.
- The post index exposes the hub without changing global navigation or taxonomy.

### Suggested commit slices

- `blog: add streaming Video-LMM development overview`
- `blog: add source-backed timeline and comparison framework`
- `chore: feature the streaming Video-LMM series on the blog index`

### Resume note

F0 is complete. Start with the hub's setting card, six-path outline, and compact
timeline; defer polished narrative and index promotion until those claims trace
cleanly to the ledger.

## F2 — Bounded Memory Evolution

**Status:** `not_started`  
**Priority:** P0  
**Depends on:** F0, F1

### Outcome

Explain the path from ReKV's reusable but growing archive to fixed online state
and retrieval-behavior-oriented retention, while upgrading the site's thin ReKV
note.

### Deliverables

- `content/posts/StreamingMemory-Retention/index.md`
- Expanded `content/posts/ReKV/index.md`
- Reciprocal links from relevant InfiniPot-V, StreamMem, LiveVLM, MuKV, and
  WeaveTime notes.

### Intended article

Working title:

> From ReKV to Retrieval-Behavior Preservation: What Should a Streaming VLM Remember?

Core comparison:

- ReKV: online KV production plus query-time retrieval; bounded active read, O(T)
  archive.
- InfiniPot-V, StreamMem, and LiveVLM: different query-agnostic retention priors.
- HERMES: layer-wise hierarchical KV with no query-time retrieval.
- ProtoKV: recent exact state plus fixed summary prototypes for delayed queries.
- Research gap: future-query retrieval ranking/recall behavior rather than feature
  coverage alone.

### Work packages

- [ ] Expand ReKV with a precise setting card, storage accounting, position
      reconstruction caveat, and relation to later work.
- [ ] Distinguish write policy, read policy, and archive policy.
- [ ] Compare bounded active memory with bounded total state.
- [ ] Explain why current perception and distant retrieval compete for attention.
- [ ] State retrieval-behavior preservation as a falsifiable proposal, not a field
      consensus.

### Acceptance criteria

- The ReKV post no longer implies that offloading makes total memory bounded.
- The thematic article includes an explicit resource-accounting table.
- HERMES and ProtoKV are compared under their actual delayed-query/read settings.
- All performance figures carry protocol and model context.

### Suggested commit slices

- `blog: expand ReKV with memory-boundary analysis`
- `blog: add bounded streaming memory evolution survey`
- `chore: link streaming memory notes into the active series`

### Resume note

Preserve the existing ReKV URL. Improve the current article in place rather than
creating a second ReKV summary.

## F3 — Set-wise Retention and Pipeline v2

**Status:** `not_started`  
**Priority:** P0  
**Depends on:** F0, F1

### Outcome

Document the shift from independent token scores to semantic priors, coresets,
and marginal set contribution, and bring the architectural pipeline survey up to
the 2026 state of the field.

### Deliverables

- `content/posts/SetWise-Streaming-Memory/index.md`
- Updated `content/posts/StreamingVLM-Pipeline/index.md`

### Intended article

Working title:

> From Token Scores to Set Selection: SAVEMem, CoRDS, and NovaCov

Primary distinctions:

- SAVEMem: pseudo-question semantic prior and adaptive query-time scope.
- CoRDS: representative/diverse selection in joint K/V geometry.
- NovaCov: streaming set-wise marginal coverage with a bounded historical
  reference bank.

### Pipeline v2 scope

Use this stable stage sequence:

```text
sample / segment
  -> pre-LLM visual reduction
  -> causal encoding
  -> memory write
  -> online retention
  -> query-facing index
  -> read / retrieval policy
  -> evidence or KV rehydration
  -> answer / trigger / scheduler
```

### Work packages

- [ ] Explain why independent salience can retain redundant items.
- [ ] Compare semantic prior, coreset coverage, diversity, and submodular marginal
      value without claiming they optimize the same objective.
- [ ] State the assumptions behind any approximation guarantee.
- [ ] Add MuKV, StreamingVLM, WeaveTime, STC, OASIS, Memento, HERMES, ProtoKV,
      SAVEMem, CoRDS, NovaCov, and relevant RAG/read-policy work to Pipeline v2.
- [ ] Remove repeated prose from Pipeline v2 when an existing focused note can be
      linked.
- [ ] Ensure every method appears at its actual optimization stage.

### Acceptance criteria

- The set-wise article distinguishes coverage of representation from preservation
  of future retrieval behavior.
- Pipeline v2 covers compute, write, retain, read, rehydrate, and scheduler paths.
- The development overview and pipeline overview have visibly different jobs.
- Pipeline v2 does not describe every method as bounded total memory.

### Suggested commit slices

- `blog: compare semantic and set-wise streaming memory selection`
- `blog: expand the streaming Video-LMM pipeline for 2026 methods`
- `chore: replace duplicated pipeline prose with focused article links`

### Resume note

The current pipeline post is valuable and should be updated in place. Preserve its
URL and its input-operation-output style.

## F4 — Structured Long-term State

**Status:** `not_started`  
**Priority:** P1  
**Depends on:** F0, F1

### Outcome

Explain the move from flat token/KV pools to event, entity, object, state, graph,
and prototype memories.

### Deliverables

- `content/posts/Structured-Streaming-Memory/index.md`
- Focused reciprocal updates to `content/posts/OASIS/index.md` and other related
  notes.

### Intended article

Working title:

> From Event Trees to Entity State Chains: Structured Memory for Streaming Video

Core path:

- StreamForest: persistent event boundaries.
- OASIS: hierarchical event address plus on-demand descent.
- FOLIO: entity/action/state records with visual-evidence backlinks.
- ObjectStream: latent object/change/recent state.
- D-HSM and StreamEMS: frontier approaches, clearly labeled by maturity.

### Work packages

- [ ] Compare what each memory unit can recover and what it makes irreversible.
- [ ] Contrast interpretable external semantic memory with bounded but opaque
      latent state.
- [ ] Audit raw-evidence backlinks and external-store growth.
- [ ] Cover entity identity drift, event-boundary errors, merge errors, OCR, and
      rare-event failure modes.
- [ ] Link the existing OASIS note as the detailed method reference.

### Acceptance criteria

- The article contains a carrier-versus-recoverability comparison.
- External semantic memory is not mislabeled as fixed total storage.
- Frontier preprints are not used as the sole support for mature conclusions.
- Existing OASIS content is reused through links instead of copied.

### Suggested commit slices

- `blog: add structured memory survey for streaming video`
- `chore: connect OASIS and structured-memory series links`

### Resume note

This is P1. It may proceed after F1 even if F2/F3 are incomplete, provided F0 has
canonical sources for every included method.

## F5 — Verifiable Multi-key Video RAG

**Status:** `not_started`  
**Priority:** P1  
**Depends on:** F0, F1

### Outcome

Explain why single captions and fixed top-k retrieval systematically miss visual
and temporal evidence, and how recent systems make retrieval itself testable.

### Deliverables

- `content/posts/Verifiable-Video-RAG/index.md`
- Reciprocal link updates to rLiVS, AdaVideoRAG, ViG-RAG, and OASIS.

### Intended article

Working title:

> Why One Caption Is Not Enough: Multi-key and Verifiable Video RAG

Core path:

- rLiVS/Goldfish: cheap caption-based long-term retrieval and its information
  bottleneck.
- AdaVideoRAG/ViG-RAG: adaptive routing and temporal-semantic graph retrieval.
- StreamRAG/OASIS: online event memory and on-demand evidence access.
- MERIT: multi-key episodic representation and temporal-neighbor expansion.
- CARVE/V-RAGBench: modality-by-granularity retrieval with decoupled evidence
  evaluation.
- StreamScout: frontier stop-or-escalate read depth.

### Work packages

- [ ] Use OCR, small objects, exact counts, state changes, event order, and
      multi-evidence queries as concrete failure categories.
- [ ] Separate memory construction, index keys, retrieval, context expansion,
      source recovery, and answer generation.
- [ ] Explain request-bounded retrieval versus O(T) source/index storage.
- [ ] Distinguish evidence recall/ranking metrics from final answer accuracy.
- [ ] Reuse detailed existing AdaVideoRAG, ViG-RAG, rLiVS, and OASIS notes through
      reciprocal links.

### Acceptance criteria

- The article makes retrieval independently falsifiable.
- Multi-key retrieval is not described as fixed total memory.
- At least one comparison table covers key type, source backlink, expansion, read
  budget, and principal failure mode.
- Existing RAG articles link back to this thematic map.

### Suggested commit slices

- `blog: add verifiable multi-key Video RAG survey`
- `chore: connect existing Video RAG notes to the active series`

### Resume note

Keep this article retrieval-centric. General structured-memory history belongs in
F4, while system-wide stages belong in Pipeline v2.

## F6 — Real Streaming Evaluation

**Status:** `not_started`  
**Priority:** P0  
**Depends on:** F0, F1

### Outcome

Make the benchmark page a reliable protocol index and publish a focused StreamArena
note that shows why recent-frame shortcuts and query-point accuracy are
insufficient.

### Deliverables

- Updated `content/posts/StreamingVideoBenchmarks/index.md`
- `content/posts/StreamArena/index.md`
- Optional focused updates to Memento or other benchmark-owning posts when they
  materially improve cross-linking.

### Work packages

- [ ] Organize benchmarks by what they measure, not only by publication date:
  causal query point, retrospective memory, readiness/proactive response,
  continuous output, asynchronous systems, and hour-scale open interaction.
- [ ] Add RIVER, StreamingEval, VSAS-Bench, SPOT-Bench, StreamArena, and
      MementoBench where primary evidence is available.
- [ ] Explicitly distinguish:
  - memory distance `Delta_mem`;
  - evidence-ready delay `Delta_ready`;
  - wall-clock response latency `Delta_sys`.
- [ ] Add storage accounting, queue/backlog, frame age, p50/p95/p99 latency, and
      input-rate-versus-processing-rate considerations.
- [ ] Preserve the existing warning against a unified heterogeneous leaderboard.
- [ ] Write StreamArena as a benchmark/system note, including why recent-only,
      text-only history, and repeatedly compressed visual memory fail differently.

### Acceptance criteria

- A reader can choose a benchmark based on the claim being tested.
- Video-time timeliness is not conflated with wall-clock latency.
- Recent-frame, blind, query-frame, and matched-backbone controls are documented.
- The StreamArena note clearly labels author-reported dataset/system results.

### Suggested commit slices

- `blog: add StreamArena benchmark and system notes`
- `blog: refresh streaming video benchmark taxonomy`
- `chore: disambiguate streaming benchmark names and protocols`

### Resume note

Update the existing benchmark article in place. It is already the site's natural
protocol index and should retain its URL.

## F7 — Architecture versus Training Counterfactual

**Status:** `not_started`  
**Priority:** P0  
**Depends on:** F0, F1

### Outcome

Establish a fair control framework for deciding whether gains come from memory
architecture, recent perception, backbone quality, or streaming-specific
post-training.

### Deliverables

- `content/posts/StreamOPD/index.md`
- Expanded `content/posts/SimpleStream/index.md`
- Reciprocal links from relevant memory and benchmark surveys.

### Intended framing

Working comparative question:

> Architecture or Training? The SimpleStream and StreamOPD Counterfactual

Use a 2x2 analysis:

| | No streaming post-training | Matched streaming post-training |
| --- | --- | --- |
| Recent-only / no long-term memory | SimpleStream-style control | StreamOPD-style control |
| Long-term memory architecture | Existing memory baseline | Required fair comparison |

### Work packages

- [ ] Expand SimpleStream beyond its current short summary and explain the
      recent-frame benchmark shortcut.
- [ ] Write a full StreamOPD note with training objective, inference setting,
      author-reported results, and limitations.
- [ ] Separate no-memory inference simplicity from the cost of post-training and
      teacher privilege.
- [ ] Define the matched controls future memory papers should report.
- [ ] Link the counterfactual from Pipeline v2 and the benchmark survey.

### Acceptance criteria

- The article does not claim that recent-only windows solve long-term memory.
- Post-training gains are not attributed to architecture.
- The 2x2 control is concrete enough to guide an experiment table.
- SimpleStream and StreamOPD pages link to each other and the series hub.

### Suggested commit slices

- `blog: expand SimpleStream as a recent-window control`
- `blog: add StreamOPD post-training paper notes`
- `chore: link architecture and training controls across the series`

### Resume note

Keep the existing SimpleStream URL. The new StreamOPD bundle should follow the
site's mature paper-note structure.

## F8 — Integration, Release QA, and Handoff

**Status:** `not_started`  
**Priority:** P0  
**Depends on:** F2, F3, F4, F5, F6, F7

### Outcome

Make the series coherent as a site feature, resolve remaining metadata and naming
issues, and leave a tested maintenance path.

### Deliverables

- Complete hub-to-article and article-to-related-note navigation.
- Canonical tag and front-matter cleanup across every touched post.
- Explicit StreamChat and other collision notes where they affect published pages.
- Successful final build and sampled visual QA.
- Updated plan work log, decisions, and maintenance next action.

### Work packages

- [ ] Add reciprocal links without creating circular duplicate prose.
- [ ] Apply `streaming-video-lmm` to all touched series posts.
- [ ] Add `lastmod` to every materially changed existing post.
- [ ] Audit titles, descriptions, venue labels, math flags, and local assets.
- [ ] Clarify the existing StreamChat post as arXiv `2501.13468` and link or note
      the distinct `2412.08646` paper when relevant.
- [ ] Search for unresolved collisions, stale version descriptions, and unsupported
      `O(1)`/`real-time` claims.
- [ ] Run all build and visual gates.
- [ ] Update the work log with commit SHAs and validation results.
- [ ] Set the maintenance cadence and first watchlist review target.

### Acceptance criteria

- Every new article is reachable from the hub and has useful reciprocal links.
- No touched article confuses known name/version collisions.
- Build and visual gates pass with the configured Hugo version.
- The plan records all completed commits and leaves one explicit maintenance next
  action.

### Suggested commit slices

- `chore: add reciprocal streaming Video-LMM series links`
- `chore: normalize streaming video post metadata`
- `chore: resolve streaming paper naming and version notes`
- `chore: complete streaming Video-LMM release QA`

### Resume note

Do not use F8 as a dumping ground for unfinished article research. Each content
phase must pass its Research and Content gates before final integration.

## Maintenance After F8

Once the initial program is complete:

- Review the source ledger when a watched preprint changes version or venue.
- Promote a watchlist paper into a full article only if it changes the conceptual
  map, creates a strong counterexample, or becomes directly relevant to current
  research.
- Prefer updating the hub, pipeline, or benchmark index over publishing repetitive
  mini-digests.
- Recheck official venue and code status before each material `lastmod` update.
- Keep frontier papers separate from the stable reading path.

Initial watchlist:

- StreamTTT
- StreamEMS
- D-HSM
- StreamScout
- StreamFlow
- ObjectStream follow-up versions
- any matched-backbone/post-training evaluation of bounded-memory methods

## Decision Log

| Date | Decision | Reason | Downstream effect |
| --- | --- | --- | --- |
| 2026-09-02 | Use one root `PLAN.md` as the only active plan and keep stable rules in `AGENTS.md`. | Prevent multiple current plans from drifting while ensuring future agents discover the workflow. | All phases and work logs are maintained here. |
| 2026-09-02 | Organize work by functional phases rather than weekly deadlines. | Each phase may require many commits and research timing is uncertain. | Progress is dependency- and acceptance-driven. |
| 2026-09-02 | Keep public research content in English. | The site defaults to English and all current research notes are English. | No multilingual Hugo changes are in scope. |
| 2026-09-02 | Use a curated hub plus the existing taxonomy instead of adding a `series` taxonomy. | Lower implementation risk and consistent with the current PaperMod site. | Use the `streaming-video-lmm` tag and reciprocal manual navigation. |
| 2026-09-02 | Treat retrieval-behavior preservation as a falsifiable research hypothesis. | The source report's claim is a useful direction but not established field consensus. | F1–F3 must use cautious, testable language. |
| 2026-09-02 | Prefer thematic comparisons over one post per recent preprint. | Reduces duplication and makes conceptual development clearer. | Only high-value paper notes such as StreamArena and StreamOPD are standalone in the initial scope. |
| 2026-09-02 | Prefer the formal proceedings title while preserving arXiv title/version drift and stable collision keys. | StreamChat, Flash-VStream, LiveVLM, StreamingEval, WeaveTime, and related names cannot be safely resolved from short names alone. | Every later draft starts from the F0 disambiguation registry. |
| 2026-09-02 | Keep bibliographic maturity separate from frontier routing. | A recent preprint is still a preprint; recency controls how strongly it is used, not what kind of publication it is. | StreamTTT, StreamEMS, D-HSM, StreamScout, and other emerging work remain on the watchlist until stronger evidence appears. |
| 2026-09-02 | Audit model state, active read state, archives, indexes, and raw evidence separately. | “Bounded memory” otherwise hides growing KV, caption, snapshot, keyframe, or source stores. | F1–F7 use the F0 resource classes and cannot infer whole-system `O(1)` storage from a capped prompt or GPU cache. |

## Work Log

Update this table when committed work lands. Use one row per reviewable commit or
small related commit group.

| Date | Phase | Commit(s) | Validation | Result / next step |
| --- | --- | --- | --- | --- |
| 2026-09-02 | Planning | `62b21d5` | `git diff --check`; no Hugo build required for internal planning text | Added the active plan and repository agent contract. |
| 2026-09-02 | F0 | `eaa0937` | First-party paper/venue verification; `git diff --check`; canonical table shape checked | Added the 72-source canonical register, maintenance contract, maturity vocabulary, and initial routing. |
| 2026-09-02 | F0 | `be31611` | `git diff --check`; all Markdown table rows structurally checked; all 20 local coverage links resolved | Added resource-boundary and benchmark protocol audits, stable collision keys, title/version drift rules, the existing-site coverage map, and fixed F1–F7 targets. |
| 2026-09-02 | F0 → F1 | this commit | F0 acceptance criteria audited; internal documentation only, so Hugo build and visual QA are not applicable | Marked F0 done and activated F1 with one concrete outline-first action. |
