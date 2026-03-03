# Interfaces

## CLI interfaces

Root scripts (`package.json`):
- `npm run mobile:start`
- `npm run mobile:ios`
- `npm run mobile:android`
- `npm run mobile:web`
- `npm run mobile:typecheck`
- `npm run supabase:start`
- `npm run supabase:stop`
- `npm run supabase:reset`
- `npm run planner:lint`

Supabase CLI workflows:
- `supabase start`
- `supabase stop`
- `supabase db reset`
- `supabase link --project-ref <ref>`
- `supabase db push`

## Environment contract

Mobile client expects:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

Parsing and validation path:
- `apps/mobile/src/config/env.ts`
- `apps/mobile/src/lib/supabase.ts`

## Database interface surface

Current schema defined by:
- `supabase/migrations/20260303183402_init_core_schema.sql`

Primary table groups:
- Content and curriculum tables
- User profile/settings tables
- SRS and analytics event tables

RLS expectations:
- Content tables readable by anon/authenticated as configured.
- User state tables restricted by `auth.uid()` ownership policies.
