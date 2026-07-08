# Callsheet

Sports pick'em platform — create leagues, invite friends, compete to predict game winners.

> **v0.2.0** greenfield rebuild. Legacy PowerPicks code is on `feb-2024-refactor`.

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture & Decisions](docs/DECISIONS.md) | Product and technical decisions |
| [Sprint Plans](plans/README.md) | Build roadmap (13 sprints) |

## Stack

- **Web:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, shadcn/ui (Base UI)
- **API:** Express, TypeScript, Clerk (Sprint 02)
- **Worker:** absurd-sdk (Sprint 10)
- **Database:** PostgreSQL (Supabase in prod), Prisma ORM
- **Email:** Resend (Sprint 10)

## Local development setup

### Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (recommended) or local PostgreSQL 16

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` as needed. For local Postgres via Docker:

```
DATABASE_URL=postgresql://callsheet:callsheet@localhost:5432/callsheet
DATABASE_URL_DIRECT=postgresql://callsheet:callsheet@localhost:5432/callsheet
```

### 3. Start Postgres

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start dev servers

```bash
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Health: http://localhost:3001/api/health

## Monorepo structure

```
apps/
  web/       → React SPA (Netlify)
  api/       → Express REST API (Fly.io)
  worker/    → Background jobs (Fly.io)
packages/
  db/        → Prisma schema & migrations
  shared/    → Zod schemas & constants
  email/     → Resend templates
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + api in dev mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed sports, classifications, and games |
| `pnpm test` | Run unit tests |

## Status

**Sprint 06 complete** — ESPN game data pipeline, sync cron, games API.

## GitHub Actions secrets

For scheduled game sync (`.github/workflows/sync-games.yml`):

| Secret | Description |
|--------|-------------|
| `API_URL` | Production API base URL (e.g. `https://api.callsheet.app`) |
| `CRON_SECRET` | Shared secret for `POST /api/cron/*` endpoints (must match API env) |
