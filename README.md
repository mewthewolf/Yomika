# Yomika

JLPT-aligned and Joyo-kanji-complete Japanese learning app focused on a reading-first workflow with spaced repetition, then speaking and writing extensions.

Current implementation baseline:
- Expo React Native mobile client in `apps/mobile`.
- Supabase backend configuration and schema in `supabase`.
- Planning system in `development-planner.md`.

## Documentation

- [Quickstart](docs/quickstart.md)
- [Configuration](docs/configuration.md)
- [Architecture](docs/architecture.md)
- [Interfaces](docs/interfaces.md)
- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Security](docs/security.md)
- [Setup Status](docs/setup.md)
- [Sprint 01 Plan](docs/sprint-01.md)

## Planning

- Primary backlog and execution order: `development-planner.md`
- Source report: `Japanese Learning App Report.pdf`

## Docs update tag

Docs last updated: `docs-2026-03-03`

Docs audited through commit: `b89aede`

This tag marks the last commit where `README.md` + `docs/` were audited/updated.
- View changes since docs were last updated: `git log docs-2026-03-03..HEAD --oneline`
- Diff docs vs current: `git diff docs-2026-03-03..HEAD -- README.md docs/`

Update procedure:
1. Pick a new tag name like `docs-YYYY-MM-DD`.
2. Before making docs changes, set `Docs audited through commit` to the current code commit you are auditing: `git rev-parse --short HEAD`.
3. Update the `Docs last updated` line above in the same commit as your docs changes.
4. Commit with: `docs: sync docs (docs-YYYY-MM-DD)`.
5. Create the annotated tag: `git tag -a docs-YYYY-MM-DD -m "docs: sync docs"`.
6. Push the tag: `git push origin docs-YYYY-MM-DD`.
