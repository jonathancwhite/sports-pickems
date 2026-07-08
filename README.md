# Callsheet

Sports pick'em platform — create leagues, invite friends, compete to predict game winners.

> **v0.2.0** greenfield rebuild. Legacy PowerPicks code is on `feb-2024-refactor`.

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture & Decisions](docs/DECISIONS.md) | Product and technical decisions |
| [Sprint Plans](plans/README.md) | Build roadmap (13 sprints) |
| [Smoke Test Checklist](docs/SMOKE_TEST.md) | Pre-launch verification steps |

## Stack

- **Web:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, Tailwind CSS
- **API:** Express, TypeScript, Clerk (auth + billing)
- **Worker:** absurd-sdk (`apps/worker` — pick reminders, slate change notifications)
- **Database:** PostgreSQL (Supabase in prod), Prisma ORM
- **Email:** Resend (`packages/email` — pick reminders, slate change, waitlist invites)
- **Deploy:** Netlify (web), Fly.io (API + worker)

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

Edit `.env` with your Clerk keys and database URL. For local Postgres via Docker:

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

For production catalog-only seed (no test games):

```bash
pnpm --filter @callsheet/db db:seed:catalog
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
  tasks/     → Shared background task logic
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + api in dev mode |
| `pnpm build` | Build all packages |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm test` | Run unit tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed sports, classifications, and sample games |

## Deployment

### Web (Netlify)

The repo includes `netlify.toml` with build settings. Connect the repo in Netlify and set environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Production API URL (e.g. `https://callsheet-api.fly.dev`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `VITE_APP_URL` | Production web URL |
| `VITE_APP_NAME` | `Callsheet` |

### API (Fly.io)

```bash
fly apps create callsheet-api
fly secrets set DATABASE_URL=... CLERK_SECRET_KEY=... CLERK_WEBHOOK_SECRET=... CRON_SECRET=... WEB_URL=... RESEND_API_KEY=... EMAIL_FROM=...
fly deploy --config fly.api.toml
```

Migrations run automatically via the `release_command` in `fly.api.toml`.

Use the Supabase **pooler** URL (port 6543) for `DATABASE_URL` in production.

### Worker (Fly.io)

```bash
fly apps create callsheet-worker
fly secrets set DATABASE_URL=... RESEND_API_KEY=... EMAIL_FROM=... WEB_URL=...
fly deploy --config fly.worker.toml
```

### Database rollback

Prisma does not auto-generate down migrations. To roll back:

1. Restore a database snapshot (recommended for production)
2. Or manually write a reverse migration and apply with `prisma migrate deploy`

Never edit applied migration files in place.

## GitHub Actions secrets

| Secret | Used by | Description |
|--------|---------|-------------|
| `API_URL` | Cron workflows | Production API base URL |
| `CRON_SECRET` | Cron workflows + API | Shared secret for `POST /api/cron/*` |

Cron workflows: `sync-games.yml`, `pick-reminders.yml`, `season-archive.yml`, `waitlist-expiry.yml`

## Clerk Billing setup

Enable Billing in the [Clerk Dashboard](https://dashboard.clerk.com) and create User plans:

| Plan | Slug | Features |
|------|------|----------|
| Free | `free` | Default for all users |
| Pro | `pro` | `unlimited_leagues`, `large_leagues`, `beta_sports`, `no_ads` |

Configure the `subscription.*` webhook events to point at `/api/webhooks/clerk`.

## Status

**Sprints 12–13 complete** — Clerk Billing monetization, Pro gating, Netlify + Fly.io deploy configs, CI pipeline.
