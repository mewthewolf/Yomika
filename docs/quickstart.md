# Quickstart

## Prerequisites

- Node.js and npm
- Supabase CLI
- Docker Desktop (required for `supabase start`)

## Install

```bash
cd /Users/mewthewolf/Documents/Yomika/apps/mobile
npm install
```

## Configure environment

```bash
cd /Users/mewthewolf/Documents/Yomika
cp apps/mobile/.env.example apps/mobile/.env
```

Set values in `apps/mobile/.env`:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## Run local services

```bash
cd /Users/mewthewolf/Documents/Yomika
npm run supabase:start
```

## Apply migrations/reset local DB

```bash
cd /Users/mewthewolf/Documents/Yomika
npm run supabase:reset
```

## Run app

```bash
cd /Users/mewthewolf/Documents/Yomika
npm run mobile:start
```

Optional launch shortcuts:
- `npm run mobile:ios`
- `npm run mobile:android`
- `npm run mobile:web`

## Validate baseline

```bash
cd /Users/mewthewolf/Documents/Yomika
npm run mobile:typecheck
npm run planner:lint
```
