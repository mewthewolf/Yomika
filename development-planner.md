# Formatting practices (keep consistent)
- Use H1 for top-level sections, H2 for subgroups, H3 for task headers.
- Keep bullets concise; prefer past-tense summaries in Completed, imperative in Current.
- Include file paths in backticks; avoid line breaks inside bullets unless needed.
- When priorities are empty, note `None` under Current priorities.
- Add new sessions at the top of Completed with date-stamped headers.

# Current priorities

## P0 (foundation + environment readiness)
### P0-01 — Lock MVP contract and scope guardrails
- Define a written MVP contract in `docs/sprint-01.md` for SRS + reading + basic speaking/writing.
- Document deferred features (pronunciation scoring, score-equivalency claims, broad OCR) in `docs/sprint-01.md`.
- Verify: Confirm scope text matches constraints from `Japanese Learning App Report.pdf`.

### P0-02 — Formalize compliance and content policy
- Document JLPT copyright boundaries and original-content requirement in `docs/security.md`.
- Define a `license_code` attribution policy for imported datasets in `docs/configuration.md`.
- Verify: Confirm all content ingestion docs prohibit copying official JLPT items.

### P0-03 — Finalize architecture and stack decision record
- Write the locked stack rationale (Expo + Supabase + Postgres) in `docs/architecture.md`.
- Record client-first/offline-first sync model and backend responsibilities in `docs/architecture.md`.
- Verify: Confirm architecture doc aligns with `supabase/config.toml` and `apps/mobile` structure.

### P0-04 — Complete local and cloud Supabase readiness
- Link hosted project workflow and migration push steps in `docs/deployment.md`.
- Define local prerequisites (`Docker`, `supabase` CLI, `npm`) in `docs/quickstart.md`.
- Verify: Confirm commands match scripts in `package.json` and paths in `supabase/`.

### P0-05 — Stabilize baseline data model ownership
- Document source-of-truth tables and ownership boundaries in `docs/interfaces.md`.
- Map mutable user-state vs versioned content-state concepts in `docs/architecture.md`.
- Verify: Confirm documented entities match `supabase/migrations/20260303183402_init_core_schema.sql`.

### P0-06 — Define dataset intake and licensing ledger
- Document approved dataset categories and licensing checks in `docs/security.md`.
- Add ingestion governance checklist and attribution capture requirements in `docs/development.md`.
- Verify: Confirm every dataset path requires `license_code` and provenance notes.

### P0-07 — Establish environment variable contract
- Define required mobile env keys and handling guidance in `docs/configuration.md`.
- Document `.env` creation flow using `apps/mobile/.env.example` in `docs/quickstart.md`.
- Verify: Confirm env docs match `apps/mobile/src/config/env.ts`.

### P0-08 — Confirm pre-build readiness gates
- Define done-before-build gates in `docs/sprint-01.md` for auth, migrations, env, and data policy.
- Add verification checklist to `docs/development.md` for typecheck and planner lint.
- Verify: Confirm gates are actionable and map to sprint Day 1–Day 2 tasks.

## P1 (MVP core build: SRS + reading-first)
- None

## P2 (skills add-ons: handwriting + speaking-lite)
### P2-01 — Add handwriting trace mode baseline
- Implement guided trace UX for kana/kanji writing drills in `apps/mobile/src/`.
- Store derived correctness metrics and avoid raw-trace cloud retention by default.
- Verify: Confirm trace sessions record completion and score summaries.

### P2-02 — Add freehand writing mode and feedback cycle
- Implement freehand input mode and answer reveal workflow in `apps/mobile/src/`.
- Connect writing attempts to `study_events` using skill-specific metadata.
- Verify: Confirm writing attempts can be retried and scored consistently.

### P2-03 — Integrate digital-ink recognition provider
- Add provider adapter boundary for digital-ink recognition in `apps/mobile/src/`.
- Implement fallback behavior when recognition is unavailable.
- Verify: Confirm recognition errors degrade gracefully to guided tracing.

### P2-04 — Build speaking shadowing-lite flow
- Implement prompt-audio, user-record, transcript-compare workflow in `apps/mobile/src/`.
- Store transcript mismatch and self-rating outputs in `study_events`.
- Verify: Confirm speaking attempts produce transcript and confidence artifacts.

### P2-05 — Integrate STT provider abstraction
- Implement a provider abstraction for STT requests and response normalization in `apps/mobile/src/`.
- Capture provider latency and failure mode metrics for later tuning.
- Verify: Confirm STT adapter supports at least one provider with fallback path.

### P2-06 — Expand listening drill pipeline
- Add sentence-audio playback exercises backed by `public.audio_assets` metadata.
- Implement basic dictation/comprehension prompt templates in the review layer.
- Verify: Confirm playback and listening responses are logged correctly.

### P2-07 — Consolidate skill-level scheduling strategy
- Apply per-item per-skill scheduling policies across reading, writing, and speaking item types.
- Validate mixed-skill queue behavior for balance and overdue protection.
- Verify: Confirm one content item can maintain independent schedules per skill.

## P3 (quality, analytics, security, beta loop)
### P3-01 — Define analytics dashboard query set
- Create baseline analytics query definitions for review volume, overdue rate, and retention in `docs/interfaces.md`.
- Document interpretation thresholds and action triggers in `docs/development.md`.
- Verify: Confirm every metric maps to fields in `public.study_events` or `public.user_item_state`.

### P3-02 — Enforce security and privacy baseline
- Implement and document data minimization and retention controls for sensitive artifacts in `docs/security.md`.
- Define mobile permission gating for microphone and recognition features in `docs/security.md`.
- Verify: Confirm policies align with planned speaking/writing telemetry collection.

### P3-03 — Harden RLS and auth boundary tests
- Add RLS coverage scenarios for user-owned tables in `supabase/` SQL or test scripts.
- Document privilege expectations for anon vs authenticated access in `docs/interfaces.md`.
- Verify: Confirm cross-user data isolation is enforced for state and events.

### P3-04 — Build QA and release verification checklist
- Document regression checklist for mobile + backend interactions in `docs/development.md`.
- Define release-go/no-go criteria and smoke test protocol in `docs/deployment.md`.
- Verify: Confirm checklist covers auth, review loop, reading mode, and telemetry.

### P3-05 — Run closed beta feedback cycle
- Define beta cohort workflow and issue triage structure in `docs/deployment.md`.
- Add structured feedback capture template in `docs/troubleshooting.md`.
- Verify: Confirm beta issues are categorized by severity and subsystem.

### P3-06 — Optimize deployment and ops readiness
- Document single-region deployment baseline and scaling triggers in `docs/deployment.md`.
- Add incident response and rollback guidance for migrations and auth failures.
- Verify: Confirm runbook includes backup, restore, and rollback checkpoints.

## P4 (post-MVP expansion + optimization)
### P4-01 — Plan FSRS migration path
- Define prerequisites and data volume threshold for FSRS adoption in `docs/architecture.md`.
- Document migration strategy from SM-2 state to FSRS-compatible state fields.
- Verify: Confirm migration plan preserves user history and due-state continuity.

### P4-02 — Add advanced pronunciation assessment evaluation
- Document provider evaluation criteria for pronunciation scoring in `docs/interfaces.md`.
- Define feature-gating and fallback strategy if scoring quality is insufficient.
- Verify: Confirm advanced speaking remains optional and non-blocking to core loop.

### P4-03 — Expand content pipeline automation
- Design automated content import, validation, and attribution pipeline in `docs/development.md`.
- Define content version publish workflow using `public.content_versions`.
- Verify: Confirm pipeline supports rollback to prior content version.

### P4-04 — Add broader OCR and world-reading capabilities
- Plan camera OCR lookup and kanji extraction workflow in `docs/architecture.md`.
- Define privacy-safe handling for captured images and extracted text in `docs/security.md`.
- Verify: Confirm OCR expansion does not violate retention and permission policy.

### P4-05 — Introduce adaptive personalization and experimentation
- Define experimentation framework for retention-target tuning in `docs/interfaces.md`.
- Document A/B guardrails and success metrics in `docs/development.md`.
- Verify: Confirm experimentation framework respects user privacy and statistical validity.

# Completed Action Items
## Session 2026-03-04 (sprint 1 kickoff implementation)
- Implemented authentication bootstrap and session lifecycle UI in `apps/mobile/App.tsx` using Supabase auth flows.
- Added SM-2 scheduling engine in `apps/mobile/src/features/review/sm2.ts` and wired grade submission updates through `apps/mobile/src/features/review/reviewService.ts`.
- Built review queue loading, seed-item bootstrap, and persisted review-event instrumentation with `apps/mobile/src/features/review/reviewService.ts` and `apps/mobile/src/features/analytics/studyEvents.ts`.
- Built reader shell with furigana modes (`full`, `partial`, `off`) and persistence in `apps/mobile/src/features/reader/readerService.ts` and `apps/mobile/App.tsx`.
- Added exercise-template prompt mapping path in `apps/mobile/src/features/review/reviewPromptService.ts` and connected it to review rendering in `apps/mobile/App.tsx`.
- Added deterministic SM-2 simulation harness in `apps/mobile/src/features/review/sm2Simulation.ts` and surfaced pass/fail status in review UI.
- Completed Sprint 1 scope items `P1-01` through `P1-08` and cleared the `## P1` current-priority bucket.
- Verified: Ran `npm run mobile:typecheck` and `npm run planner:lint` successfully from repo root.

## Session 2026-03-03 (planning + docs standardization)
- Mapped `Japanese Learning App Report.pdf` into ordered execution epics across `P0` to `P4` in `development-planner.md`.
- Added explicit dependency-aware task IDs and verification bullets for every planned work item.

## Session 2026-03-03 (report analysis + stack bootstrap)
- Analyzed `Japanese Learning App Report.pdf` and extracted MVP direction: Expo + Supabase with reading-first and SM-2 baseline.
- Scaffolded mobile app in `apps/mobile` using Expo TypeScript and installed Supabase client dependencies in `apps/mobile/package.json`.
- Initialized Supabase project in `supabase/` and added initial data model migration at `supabase/migrations/20260303183402_init_core_schema.sql`.
- Added mobile Supabase environment and client bootstrap files at `apps/mobile/.env.example`, `apps/mobile/src/config/env.ts`, and `apps/mobile/src/lib/supabase.ts`.
- Added setup documentation in `Readme.md` and `docs/setup.md` and created planner tracking in `development-planner.md`.
- Verified planner structure with `python3 "$HOME/.codex/skills/development-planner-maintainer/scripts/planner.py" lint development-planner.md` and mobile type safety with `npx tsc --noEmit` in `apps/mobile`.
