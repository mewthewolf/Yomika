# Development

## Workflow baseline

1. Sync latest branch state.
2. Install dependencies in `apps/mobile`.
3. Start local Supabase services.
4. Run app and iterate feature code.
5. Run checks before commit.

## Required checks

```bash
cd /Users/mewthewolf/Documents/Yomika
npm run mobile:typecheck
npm run planner:lint
```

## Planner maintenance rules

- Keep pending work in `# Current priorities` with `P*-NN` IDs.
- Move completed work into `# Completed Action Items` sessions.
- Keep completed sessions newest to oldest.

## Content ingestion governance

Before importing content:
- Validate license compatibility.
- Record attribution metadata.
- Assign stable internal `license_code` values.

## Analytics baseline for learning outcomes

Track at minimum:
- Daily review count
- Overdue percentage
- Retention trend by skill
- Reading session completion rate
