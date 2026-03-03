# Setup Status

## Already set up

- Expo React Native TypeScript app scaffolded in `apps/mobile`.
- Supabase CLI project initialized in `supabase`.
- Initial schema migration created at `supabase/migrations/20260303183402_init_core_schema.sql`.
- Supabase client bootstrap wired in:
  - `apps/mobile/src/config/env.ts`
  - `apps/mobile/src/lib/supabase.ts`

## Still required before active feature development

1. Start Docker Desktop so local Supabase services can run.
2. Link hosted Supabase project: `supabase link --project-ref <your-project-ref>`.
3. Push schema to hosted DB: `supabase db push`.
4. Configure `apps/mobile/.env` with hosted URL and anon key.
5. Configure Supabase Auth redirect URLs for Expo development.
6. Finalize dataset licensing and attribution process before imports.
7. Prepare Expo/EAS signing and release credentials.
