# Sprint 01 — Foundation & Infrastructure

**Goal:** Stand up the monorepo skeleton, database schema, local dev environment, and remove legacy code. No user-facing features.

**Depends on:** Nothing  
**Blocks:** All other sprints

> **Note:** ORM tooling was originally Drizzle (S01-04). [Infra 01](infra-01-orm-migration-prisma.md) migrates `packages/db` to Prisma; treat that plan as the source of truth for schema and migration commands.

---

## Stories

### S01-01: Initialize monorepo

**As a** developer  
**I want** a pnpm + Turborepo monorepo with `apps/` and `packages/`  
**So that** all services share tooling and types

**Acceptance criteria:**
- [ ] Root `package.json`, `pnpm-workspace.yaml`, `turbo.json` created
- [ ] `apps/web` — Vite + React 19 + TypeScript scaffolded
- [ ] `apps/api` — Express + TypeScript scaffolded
- [ ] `apps/worker` — TypeScript entry point (Absurd worker stub)
- [ ] `packages/db` — Drizzle ORM package
- [ ] `packages/shared` — shared types and Zod schemas package
- [ ] `packages/email` — empty package with Resend dep
- [ ] `turbo dev` starts web + api concurrently
- [ ] `turbo build` builds all packages
- [ ] `turbo lint` and `turbo typecheck` scripts work

**Technical notes:**
- Use `"type": "module"` throughout
- Path aliases: `@callsheet/db`, `@callsheet/shared`, `@callsheet/email`
- Node 20+ required

---

### S01-02: Configure shared tooling

**As a** developer  
**I want** consistent ESLint, Prettier, and TypeScript configs  
**So that** code style is uniform across packages

**Acceptance criteria:**
- [ ] Root `tsconfig.json` with project references
- [ ] Per-package `tsconfig.json` extending root
- [ ] ESLint flat config at root
- [ ] Prettier config at root
- [ ] `.gitignore` updated for monorepo (node_modules, dist, .env, .turbo)

---

### S01-03: Docker & local Postgres

**As a** developer  
**I want** docker-compose for local Postgres  
**So that** I can develop without a cloud Supabase connection

**Acceptance criteria:**
- [ ] `docker-compose.yml` with Postgres 16 service
- [ ] `Dockerfile` for api/worker (multi-stage build)
- [ ] `.env.example` with all required variables documented
- [ ] Local dev connects to `postgresql://localhost:5432/callsheet`
- [ ] README section: "Local development setup"

**.env.example variables:**
```
# Database
DATABASE_URL=
DATABASE_URL_DIRECT=        # direct connection for migrations

# Clerk
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_WEBHOOK_SECRET=

# API
PORT=3001
CRON_SECRET=
NODE_ENV=development

# Resend
RESEND_API_KEY=
EMAIL_FROM=

# App
VITE_API_URL=
VITE_CLERK_PUBLISHABLE_KEY=
VITE_APP_NAME=Callsheet
```

---

### S01-04: Database schema (Drizzle)

**As a** developer  
**I want** the full Postgres schema defined in Drizzle  
**So that** all sprints build on a stable data model

**Acceptance criteria:**
- [ ] All tables from DECISIONS.md defined in `packages/db/src/schema/`
- [ ] Enums: `member_role`, `league_status`, `season_status`, `game_status`, `tie_policy`, `sport_tier`, `notification_type`, `theme`
- [ ] Foreign keys and indexes on frequently queried columns
- [ ] `drizzle-kit generate` produces migration SQL
- [ ] `drizzle-kit migrate` applies migrations cleanly on empty DB
- [ ] Seed script inserts launch sport + classification (Football / NCAA FBS)

**Tables:**
```
sports
classifications
seasons
games
users
user_preferences
leagues
league_members
league_waitlist
league_week_slates
league_week_slate_games
picks
notification_log
league_boosts          # reserved for Option B billing (empty usage)
```

**Key schema decisions:**
- `leagues.invite_code` — nanoid, unique, stable across seasons
- `leagues.tie_policy` — enum, default `no_points`
- `leagues.status` — `setup` | `active` | `archived`
- `seasons.status` — `upcoming` | `active` | `completed`
- `games.external_id` — ESPN game ID, unique per season
- `picks` — unique constraint on `(league_id, user_id, game_id)`
- `league_members` — unique on `(league_id, user_id)`
- `notification_log` — unique on `(user_id, league_id, type, reference_id)` for dedup

---

### S01-05: API health & DB connection

**As a** developer  
**I want** a health endpoint and verified DB connection  
**So that** deployment and monitoring have a baseline

**Acceptance criteria:**
- [ ] `GET /api/health` returns `{ status: "ok", db: "connected" }`
- [ ] Returns 503 if DB unreachable
- [ ] Drizzle client exported from `@callsheet/db`
- [ ] Connection pool configured for transaction pooler URL

---

### S01-06: Web app shell (minimal)

**As a** developer  
**I want** Vite app with TanStack Router and shadcn/ui initialized  
**So that** Sprint 02+ can add pages immediately

**Acceptance criteria:**
- [ ] TanStack Router file-based routing configured
- [ ] TanStack Query provider configured
- [ ] shadcn/ui initialized with Base UI (`npx shadcn@latest init`)
- [ ] Royal blue CSS variables in `globals.css`
- [ ] Tailwind configured
- [ ] Placeholder route at `/` renders "Callsheet"
- [ ] API proxy to `localhost:3001` in Vite dev config

---

### S01-07: Delete legacy code

**As a** developer  
**I want** old `client/` and `server/` removed  
**So that** the repo only contains the new architecture

**Acceptance criteria:**
- [ ] `client/` directory deleted
- [ ] `server/` directory deleted
- [ ] Root `package.json` updated for monorepo scripts
- [ ] Old `README.md` replaced with Callsheet README (setup instructions)
- [ ] Git commit on `v0.2.0` with clear message

---

## Sprint definition of done

- [x] `docker compose up` starts Postgres
- [x] `pnpm install && turbo dev` runs web + api without errors
- [x] Migrations apply on fresh DB
- [x] Seed data present (Football / NCAA FBS)
- [x] Legacy code removed
- [x] `.env.example` complete
- [x] All stories checked off
