# Sprint 01 (2 weeks): Vertical Slice — Auth + SRS + Reading Skeleton

## Sprint goal

Deliver the first end-to-end usable learning loop with persisted state: user auth, SM-2 review loop, and a reading screen skeleton with furigana-mode scaffolding.

## Timebox

- Day 1 to Day 10 (relative timeline)

## Completion status

- Status: Completed (implementation baseline finished on 2026-03-04).
- Implemented outcomes:
  - Auth bootstrap with sign-in/sign-up/sign-out and session restore.
  - SM-2 scheduler with deterministic simulation harness checks.
  - Review queue + grading persistence to `user_item_state` and `study_events`.
  - Reading shell with furigana modes persisted in `user_settings`.
  - Review prompt mapping layer that reads `exercises` and `exercise_templates` with fallback rendering.
- Validation run:
  - `npm run mobile:typecheck`
  - `npm run planner:lint`

## In scope

- Auth bootstrap (sign-in/session restore/logout flow)
- SM-2 state transitions for review scheduling
- Review queue and grading UI loop
- Reader shell with sentence rendering
- Furigana mode scaffolding (`full`, `partial`, `off`)
- Baseline instrumentation for core loop events

## Out of scope

- OCR and camera-based kanji lookup
- Pronunciation scoring APIs
- Full-scale content import breadth
- FSRS optimizer rollout
- Advanced gamification systems

## Hard dependencies

- Supabase schema from `supabase/migrations/20260303183402_init_core_schema.sql` applied.
- Mobile environment configured via `apps/mobile/.env`.
- Core tables available: `profiles`, `user_settings`, `user_item_state`, `study_events`, `sentences`, `sentence_tokens`.

## Day-by-day plan

### Day 1

- Confirm local runtime (`supabase start`, Expo boot, env wired).
- Validate schema access from mobile client.

### Day 2

- Implement auth bootstrap and persistent session handling.
- Add auth error and loading states.

### Day 3

- Implement SM-2 state transition module.
- Add unit-like simulation harness for interval/lapse checks.

### Day 4

- Implement due-item queue retrieval and review state orchestration.
- Wire queue updates to `user_item_state`.

### Day 5

- Build review UI with grading controls and completion flow.
- Persist review events to `study_events`.

### Day 6

- Build reading screen shell and sentence load/render path.
- Integrate with `sentences` and `sentence_tokens` queries.

### Day 7

- Add furigana mode state and render toggles.
- Persist mode in `user_settings`.

### Day 8

- Add baseline instrumentation and telemetry event fields.
- Validate analytics queryability for core flow.

### Day 9

- Run regression pass across auth, review, and reading loops.
- Fix high-severity defects and tighten error handling.

### Day 10

- Final acceptance checks and sprint demo rehearsal.
- Prepare backlog carry-over and Sprint 02 inputs.

## Acceptance criteria

- User can sign in, restart app, and keep session.
- User can complete a review and see next due state persisted.
- Review results are logged in `study_events`.
- Reader screen loads sentence content and supports furigana mode toggles.
- Core flow passes typecheck and manual smoke checks.

## Demo script (end of sprint)

1. Launch app with configured Supabase env.
2. Sign in and show session persistence by app reload.
3. Complete one review item and show updated due state.
4. Query/inspect recorded study event.
5. Open reader, switch furigana modes, and show persisted preference.

## Risks and mitigation

- Risk: Auth setup delays downstream feature work.
- Mitigation: Finish auth by Day 2 with strict cutoff.

- Risk: Scheduling logic errors corrupt due dates.
- Mitigation: Add deterministic simulation checks before UI integration.

- Risk: Reader token data quality is inconsistent.
- Mitigation: Start with stable test fixtures and strict null handling.

- Risk: Local infra instability from Docker/Supabase startup.
- Mitigation: Keep hosted fallback path documented for integration tests.

## Rollback notes

- Keep schema changes isolated per migration and reversible where possible.
- Feature-flag incomplete UI paths behind development toggles.
- Revert to last known stable migration/app commit if review loop breaks.
