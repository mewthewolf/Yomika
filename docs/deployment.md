# Deployment

## Current deployment model

- Mobile app built with Expo tooling.
- Backend hosted on Supabase (cloud project to be linked).

## Cloud Supabase setup

```bash
cd /Users/mewthewolf/Documents/Yomika
supabase link --project-ref <your-project-ref>
supabase db push
```

## Release checklist

- Confirm migrations applied successfully in hosted project.
- Validate auth flows and RLS behavior in staging/preview testing.
- Confirm mobile environment values point to hosted Supabase.
- Run smoke checks for review loop and reading flow.

## Rollback posture

- Use migration rollback strategy compatible with Supabase migration history.
- Keep schema changes incremental and reversible where possible.
- Preserve backups/snapshots before major migration batches.
