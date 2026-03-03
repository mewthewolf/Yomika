# Security

## Content and copyright boundaries

- Do not copy official JLPT exam items or protected listening materials.
- Use self-authored or properly licensed content for all exercises.

## Data minimization

- Store only required learning state and event metrics.
- Prefer derived writing/speaking metrics over raw long-term artifact retention.

## Auth and access control

- Use Supabase Auth as identity boundary.
- Enforce row-level security for user-owned tables (`profiles`, `user_item_state`, `study_events`, `user_settings`).

## Secrets handling

- Do not commit `.env` files with real keys.
- Keep only templates such as `apps/mobile/.env.example` in version control.

## Mobile permissions

- Gate microphone and speech features by explicit user consent.
- Document permission prompts and fallback behavior.
