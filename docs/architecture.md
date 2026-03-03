# Architecture

## System overview

Yomika uses a client-first architecture:
- Mobile client: Expo React Native (`apps/mobile`)
- Backend and persistence: Supabase/Postgres (`supabase`)
- Planning and process control: `development-planner.md`

## Core design decisions

- Offline-first bias for learner interactions.
- Backend responsibility focused on auth, sync, content delivery, analytics capture.
- Read-heavy content model separated from mutable per-user scheduling state.

## Data model boundaries

From `supabase/migrations/20260303183402_init_core_schema.sql`:
- Canonical content entities: `kanji`, `vocab`, `grammar_points`, `sentences`, `audio_assets`
- Curriculum taxonomy: `jlpt_levels`, `content_versions`, `exercises`, `exercise_templates`
- Mutable learner state: `user_item_state`, `study_events`, `user_settings`, `profiles`

## Learning engine path

- Initial scheduler strategy: SM-2 style state transitions.
- Future optimization path: FSRS migration after sufficient event history volume.

## Reader and furigana direction

- Reading mode is a first-class MVP component.
- Furigana modes target three states: `full`, `partial`, `off`.
