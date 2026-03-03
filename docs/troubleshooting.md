# Troubleshooting

## `supabase start` fails

Symptom:
- CLI error indicates Docker daemon is unavailable.

Fix:
- Start Docker Desktop.
- Re-run `npm run supabase:start`.

## Mobile app shows missing Supabase env

Symptom:
- Status text indicates missing `EXPO_PUBLIC_SUPABASE_URL` or anon key.

Fix:
- Create `apps/mobile/.env` from `apps/mobile/.env.example`.
- Populate both required keys.
- Restart Expo bundler.

## Typecheck fails

Fix:
- Run `npm run mobile:typecheck` and address the reported file-level errors.
- Confirm dependencies are installed in `apps/mobile/node_modules`.

## Planner lint fails

Fix:
- Run `npm run planner:lint`.
- Ensure planner keeps required section headings and task header format.
