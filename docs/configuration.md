# Configuration

## Mobile environment variables

File: `apps/mobile/.env`

- `EXPO_PUBLIC_SUPABASE_URL`: Supabase API URL used by the mobile client.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key used by the mobile client.

Reference template: `apps/mobile/.env.example`

## Supabase project configuration

Primary config: `supabase/config.toml`

Key local defaults:
- API port: `54321`
- DB port: `54322`
- Studio port: `54323`
- Inbucket port: `54324`
- Seed path: `supabase/seed.sql`

## Migration source of truth

- SQL migrations in `supabase/migrations/` are the schema source of truth.
- Current baseline migration: `supabase/migrations/20260303183402_init_core_schema.sql`.

## Content licensing metadata

All imported content must include provenance and a `license_code` strategy compatible with project policy.

Minimum ingestion requirements:
- Source URL or dataset identifier
- License type and attribution terms
- Internal `license_code` mapping used in DB records
