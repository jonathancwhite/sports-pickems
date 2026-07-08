# Callsheet — Architecture & Product Decisions

> **Version:** v0.2.0  
> **Last updated:** July 8, 2026  
> **Status:** Approved — pre-implementation reference

This document captures every major decision made for the Callsheet greenfield rebuild. It supersedes the legacy PowerPicks MERN/Mongo codebase on `feb-2024-refactor`.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Deployment & Infrastructure](#4-deployment--infrastructure)
5. [Authentication & Identity](#5-authentication--identity)
6. [Email](#6-email)
7. [Database & Data Layer](#7-database--data-layer)
8. [Background Jobs](#8-background-jobs)
9. [API Design](#9-api-design)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Sports Taxonomy & Data](#11-sports-taxonomy--data)
12. [League Rules & Membership](#12-league-rules--membership)
13. [Weekly Slates & Picks](#13-weekly-slates--picks)
14. [Scoring & Leaderboards](#14-scoring--leaderboards)
15. [Season Lifecycle](#15-season-lifecycle)
16. [Monetization](#16-monetization)
17. [Branding & UI](#17-branding--ui)
18. [Legacy Code](#18-legacy-code)
19. [Out of Scope (v0.2.0)](#19-out-of-scope-v020)

---

## 1. Product Overview

**Callsheet** (working title; formerly PowerPicks code name) is a sports pick'em platform where users create leagues, invite friends, and compete to predict game winners over a season.

### Core user flows

1. Land on marketing homepage → sign up → Clerk verifies email → enter app
2. Create a league **or** browse/join public leagues (filterable by sport & classification)
3. Commissioner shares Discord-style invite link; recipients sign up or log in, then join
4. Commissioner selects which games are pickable each week (min 4 games)
5. Members submit winner picks before the week's first kickoff
6. System scores picks, shows weekly and season leaderboards
7. Reminders sent at 48h and 6h before kickoff if picks are incomplete
8. Season ends → league archived → commissioner can roll over to a new season

### Launch scope

- **Sport:** NCAA College Football
- **Classification:** Division I FBS
- **Pick type:** Straight winner only (no spread, no over/under)

---

## 2. Repository Structure

**Decision:** pnpm workspaces + Turborepo monorepo with `apps/` and `packages/`.

```
callsheet/
├── apps/
│   ├── web/                 # React SPA → Netlify
│   ├── api/                 # Express REST API → Fly.io
│   └── worker/              # Absurd SDK worker → Fly.io (same image)
├── packages/
│   ├── db/                  # Prisma schema, migrations, DB client
│   ├── shared/              # Zod schemas, constants, ESPN adapter types
│   └── email/               # Resend templates + send helpers
├── supabase/
│   └── migrations/          # SQL migrations (or co-located in packages/db)
├── docs/
│   └── DECISIONS.md         # This file
├── plans/                   # Sprint plans
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

### Why `apps/` instead of `client/` + `server/`

Not a hard technical requirement. `apps/` groups all deployable artifacts (web, api, worker) separately from shared `packages/`. This scales cleanly when adding a worker, admin panel, or future services without uneven top-level naming.

---

## 3. Technology Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| **Frontend** | React 19 + TypeScript + Vite | SPA, not SSR |
| **Routing** | TanStack Router | File-based routes, typed params, route loaders |
| **Server state** | TanStack Query | API caching, mutations, optimistic updates |
| **UI components** | shadcn/ui with **Base UI** (not Radix) | `npx shadcn@latest init` defaults to Base UI |
| **Styling** | Tailwind CSS (shadcn default) + CSS variables | Royal blue accent |
| **Auth** | Clerk | Sign-up, sign-in, sessions, JWT verification |
| **Payments** | Clerk Billing + Stripe | User-level Pro subscription |
| **API** | Express + TypeScript | REST (not tRPC) |
| **Database** | Supabase Postgres | Postgres host only — no Supabase Auth/Realtime/Storage |
| **ORM** | Prisma | Type-safe schema, migrations, portable to RDS later |
| **Email** | Resend | Transactional only (not auth verification) |
| **Background jobs** | absurd-sdk | Postgres-native durable tasks; no Redis |
| **Validation** | Zod | Shared between API and web via `packages/shared` |
| **Package manager** | pnpm | Workspaces |
| **Build orchestration** | Turborepo | Dev, build, lint pipelines |

---

## 4. Deployment & Infrastructure

| Component | Host | Rationale |
|-----------|------|-----------|
| **Web** (`apps/web`) | **Netlify** | Static Vite build, CDN, preview deploys |
| **API** (`apps/api`) | **Fly.io** (container) | Persistent Express, connection pooling, webhooks |
| **Worker** (`apps/worker`) | **Fly.io** (same Docker image, different `CMD`) | Absurd worker process |
| **Database** | **Supabase Postgres** | Managed Postgres; free tier → Pro when needed |
| **Cron triggers** | **GitHub Actions** | Scheduled workflows hit protected API endpoints |

### Future migration path

- Web stays on Netlify
- API/worker containers move to AWS ECS Fargate or App Runner when scale demands
- Database moves to AWS RDS if Supabase limits are exceeded

### Local development

`docker-compose.yml` runs Postgres (and optionally all services). Vite dev server runs natively for fast HMR.

### Domain routing

**Single domain** — no subdomain split (`app.domain.com` removed). Public routes (`/`, `/invite/:code`) and protected routes (`/dashboard`, `/leagues/*`) on the same origin.

### Cost posture (launch)

| Service | Estimated cost |
|---------|----------------|
| Netlify | $0 (free tier) |
| Fly.io | $0–5/mo (free allowance or small VM) |
| Supabase | $0 (free tier) |
| Clerk | $0 (free tier, up to MAU limit) |
| Resend | $0 (free tier, 100 emails/day) |
| GitHub Actions | $0 (public repo or free minutes) |

---

## 5. Authentication & Identity

| Decision | Detail |
|----------|--------|
| **Provider** | Clerk |
| **Email verification** | Clerk handles verification on sign-up — no custom Resend verification flow |
| **Username** | **Required** at sign-up (configured in Clerk Dashboard) |
| **Session on API** | Verify Clerk JWT via `@clerk/express` or JWKS |
| **User sync** | Clerk webhook (`user.created`, `user.updated`) → upsert `users` table |
| **Internal user ID** | UUID in Postgres; `clerk_id` as external reference |
| **Profile images** | Clerk-managed avatars (no Supabase Storage) |

### Protected routes

- **Frontend:** TanStack Router `beforeLoad` checks Clerk session; redirect to `/sign-in`
- **Backend:** Clerk middleware on all `/api/*` routes except webhooks and public invite preview

---

## 6. Email

| Email type | Provider |
|------------|----------|
| Account verification | Clerk (built-in) |
| League invite (non-user) | Resend |
| Pick reminders (48h, 6h) | Resend |
| Slate change ("re-pick needed") | Resend |
| Commissioner transfer request | Resend |
| Season rollover invites | Resend |

Templates live in `packages/email/`. All sends logged in `notification_log` table to prevent duplicates.

---

## 7. Database & Data Layer

### Supabase usage

**Postgres only.** No Supabase Auth, Realtime, Edge Functions, or Storage.

### Connection strategy

| Context | Connection |
|---------|------------|
| API + Worker (runtime) | Supavisor **transaction pooler** (port 6543) |
| Migrations (Prisma) | Direct connection (port 5432) |

### ORM

Prisma ORM in `packages/db/`. Schema is portable to raw AWS RDS without vendor lock-in.

### Core entities

```
sports              — Football, Baseball, etc.
classifications     — NCAA FBS, NCAA D2, MLB, etc. (linked to sport)
seasons             — Year-bound competition window per classification
games               — Synced from ESPN; teams, kickoff, scores, status
users               — Synced from Clerk
leagues             — User-created pick'em group
league_members      — Membership with role (commissioner | member)
league_waitlist     — Queue when league is full (pre-season only)
league_week_slates  — Commissioner-curated games per week
league_week_slate_games — Join table: slate ↔ game
picks               — Member predictions per game
notification_log    — Deduplication for emails
user_preferences    — Theme (light | dark | system)
```

See sprint plans for full schema implementation details.

---

## 8. Background Jobs

**Decision:** absurd-sdk (Postgres-native durable task execution).

No Redis or separate queue service. Tasks stored in Postgres alongside app data.

### Registered tasks

| Task | Trigger | Purpose |
|------|---------|---------|
| `sync-games` | GitHub Actions cron (daily; every 15 min on gamedays) | Pull ESPN FBS schedule and results |
| `score-picks` | Spawned after game goes `final` | Mark `picks.is_correct` |
| `pick-reminders` | GitHub Actions cron (hourly) | 48h and 6h reminder emails |
| `notify-slate-change` | API spawns on commissioner edit | Email members when games removed from slate |
| `send-season-invites` | API spawns on season rollover | Bulk invite previous members |

### Process model

```
apps/api     → Express REST + app.spawn() for async tasks
apps/worker  → absurd-sdk startWorker() (same Docker image, CMD=worker)
```

Early development: API and worker can run in a single process. Production: separate Fly machines when needed.

---

## 9. API Design

**Decision:** REST with Zod validation.

### Conventions

- Base path: `/api`
- JSON request/response bodies
- Error format: `{ error: string, code: string, details?: unknown }`
- Auth: Clerk JWT in `Authorization: Bearer` header
- Public endpoints: invite preview, health check, webhook receivers
- Cron endpoints: protected by `CRON_SECRET` header (GitHub Actions)

### Endpoint groups

| Group | Prefix | Auth |
|-------|--------|------|
| Health | `/api/health` | Public |
| Webhooks | `/api/webhooks/clerk` | Clerk signature |
| Cron | `/api/cron/*` | `CRON_SECRET` |
| Leagues | `/api/leagues` | Clerk JWT |
| Games | `/api/games` | Clerk JWT |
| Users | `/api/users` | Clerk JWT |
| Picks | `/api/leagues/:id/picks` | Clerk JWT + member |
| Slates | `/api/leagues/:id/slates` | Clerk JWT + commissioner |
| Leaderboard | `/api/leagues/:id/leaderboard` | Clerk JWT + member |

Full endpoint list defined per sprint in `plans/`.

---

## 10. Frontend Architecture

### Routing (TanStack Router)

| Route | Access | Page |
|-------|--------|------|
| `/` | Public | Marketing landing |
| `/sign-in` | Public | Clerk sign-in |
| `/sign-up` | Public | Clerk sign-up |
| `/invite/:code` | Public | Invite preview + join |
| `/dashboard` | Auth | My leagues overview |
| `/leagues` | Auth | Browse public leagues |
| `/leagues/new` | Auth | Create league wizard |
| `/leagues/:id` | Member | League home + leaderboard |
| `/leagues/:id/picks` | Member | Submit picks |
| `/leagues/:id/schedule` | Commissioner | Set weekly slate |
| `/leagues/:id/invite` | Commissioner | Share invite link |
| `/leagues/:id/settings` | Commissioner | League settings |
| `/settings` | Auth | Account + billing (Clerk) |

### State management

| State type | Tool |
|------------|------|
| Server/API data | TanStack Query |
| Auth session | Clerk React SDK |
| UI theme | `user_preferences` table + localStorage |
| Form state | React Hook Form (with Zod resolver) |

---

## 11. Sports Taxonomy & Data

### Terminology

| Term | Meaning | Example |
|------|---------|---------|
| **Sport** | Broad sport category | Football |
| **Classification** | League/competition tier within a sport | NCAA FBS, NCAA D2, MLB |
| **League** (product) | User-created pick'em group | "Sunday Funday CFB" |

### Launch catalog

| Sport | Classification | Tier | Available to |
|-------|----------------|------|--------------|
| Football | NCAA FBS (D1) | `core` | All users |

Future beta classifications (D2 CFB, minor league baseball, etc.) tagged `tier: 'beta'` — Pro subscribers only.

### Game data source

**ESPN unofficial API** (free). Abstracted behind `packages/shared/src/sports/espn/` adapter for future provider swap.

### Sync cadence

| Period | Frequency |
|--------|-----------|
| Off-season | Daily |
| Gamedays | Every 15 minutes (scores) |
| Week transitions | On-demand + daily |

### Week numbering

ESPN-defined week integers. Stored on `games.week`.

### Game status lifecycle

| Status | Meaning | Pick locking |
|--------|---------|--------------|
| `scheduled` | Game not yet started | Picks allowed until week-level lock |
| `in_progress` | Game has kicked off | **Picks locked for this game** regardless of week-level lock |
| `final` | Game completed | Picks locked; `winner` set (`home`, `away`, or `tie`) |
| `postponed` | Game delayed | Picks remain open until rescheduled kickoff |
| `cancelled` | Game will not be played | Picks voided (handled in scoring sprint) |

Status transitions are driven by ESPN sync (`POST /api/cron/sync-games`). When a game reaches `final`, `winner` is computed from scores.

---

## 12. League Rules & Membership

### Roles

| Role | Permissions |
|------|-------------|
| **Commissioner** | Set slates, edit settings, remove members, transfer role, delete league, start new season |
| **Member** | Submit picks, view leaderboard, leave league |

Commissioner is the creator by default. **Transferable** via email-verified acceptance flow.

### Visibility

| Type | Browse list | Invite link |
|------|-------------|-------------|
| **Public** | Visible, filterable | Works |
| **Private** | Hidden | Required to join |

### Membership cap

| Tier | Max members per league |
|------|------------------------|
| Free | 10 |
| Pro | 50+ (exact cap TBD at billing sprint) |

### Waitlist

When a league is at capacity, new joiners are added to a waitlist.

| Event | Waitlist advances? |
|-------|-------------------|
| Member leaves **before season starts** | Yes — spot opens, top waitlist member invited (48h to accept) |
| Member leaves **after season starts** | No — membership locked for season; spot stays filled |
| Commissioner removes member | Yes — spot opens (any time) |
| Commissioner increases `max_members` | Yes — waitlist invited in order |
| Pro upgrade increases cap | Yes |

### Leaving & deleting

| Action | Rule |
|--------|------|
| Member leaves (pre-season) | Spot opens for waitlist |
| Member leaves (mid-season) | Allowed; spot does **not** open |
| Commissioner deletes league (active season) | Counts against their active league limit |
| Commissioner deletes league (archived season) | Does not count |
| Free user active league limit | 2 created leagues in active seasons |
| Joining others' leagues | Unlimited |

### Tie policy (per league)

Commissioner sets during league creation:

| Option | Behavior |
|--------|----------|
| `no_points` (default) | Tie game = no point awarded |
| `count_as_correct` | Tie game = correct for all who picked either team |
| `half_point` | Tie game = 0.5 points |

---

## 13. Weekly Slates & Picks

### Commissioner slate rules

| Rule | Value |
|------|-------|
| Minimum games per week | 4 |
| Who picks games | Commissioner only |
| Editable weeks | Future weeks only |
| Lock trigger | First kickoff of any game in that week |
| After lock | Slate immutable for that week |

### Slate changes (future weeks)

If commissioner removes a game after members have picked it:
1. Delete affected picks from DB
2. Spawn `notify-slate-change` task
3. Email + in-app notification: "Games removed — please re-pick"

### Member pick rules

| Rule | Value |
|------|-------|
| Pick type | Winner only (`home` or `away`) |
| Editable until | First kickoff in that week |
| Missed picks | Excluded from scoring (no penalty) |
| Lock | Server-enforced at kickoff time |

### Pick reminders

| Timing | Condition |
|--------|-----------|
| 48 hours before kickoff | User has unpicked games in that week |
| 6 hours before kickoff | Same condition, second reminder |

Deduplicated via `notification_log`. Cron runs hourly via GitHub Actions.

---

## 14. Scoring & Leaderboards

| Rule | Detail |
|------|--------|
| Points per correct pick | 1 |
| Incorrect pick | 0 |
| Missed pick | Excluded (not counted wrong) |
| Tie games | Per league `tie_policy` |
| Weekly leaderboard | Points earned that ESPN week |
| Season leaderboard | Cumulative points; season winner = highest total |

Scoring triggered by `score-picks` Absurd task when ESPN reports game `final`.

---

## 15. Season Lifecycle

### Season binding

Every league is bound to exactly one **active season** at a time.

### Season end

League status → `archived` when:
- All games in season are `final` + buffer period, **or**
- Commissioner manually ends season

### Rollover ("Start new season")

1. Commissioner clicks "Start new season" on archived league
2. New `season` row created (same `league` entity — invite code preserved)
3. Bulk Resend invite sent to all previous members
4. Members must **explicitly accept** to rejoin
5. Previous season data preserved as read-only history

### Active league counting

| State | Counts toward free user's 2-league limit? |
|-------|----------------------------------------|
| Active season | Yes |
| Archived season | No |

---

## 16. Monetization

### Model

**Option A: User-level Pro subscription** (implemented in v0.2.0).  
Schema designed to support **Option B: Per-league boost** (added later).

### Free tier — "Fan"

| Limit | Value |
|-------|-------|
| Active created leagues | 2 |
| Max members per league | 10 |
| Sports | Core catalog only (FBS CFB at launch) |
| Join as member | Unlimited |
| Ads | Upgrade prompts for Pro (no third-party ad network at launch) |

### Pro tier — "Commissioner"

| Benefit | Value |
|---------|-------|
| Active created leagues | Unlimited |
| Max members per league | 50+ |
| Beta sports | D2 CFB, minor league baseball, etc. |
| Ads | None |

**Target price:** ~$6–9/mo or ~$59/yr (set during billing sprint).

### Feature gating

Clerk Billing feature flags:

```
has({ feature: 'beta_sports' })
has({ feature: 'large_leagues' })       // >10 members
has({ feature: 'unlimited_leagues' })   // >2 active created
```

Gated at API level, not UI-only.

### Future: Per-league boost (Option B)

Schema reserves `league.tier` or `league_boosts` table for one-time/seasonal upgrades without a full subscription.

---

## 17. Branding & UI

| Decision | Value |
|----------|-------|
| **Product name** | Callsheet (working title) |
| **Accent color** | Royal blue (`#2563EB` primary; `#4169E1` alternative) |
| **Theme** | User preference: `light` \| `dark` \| `system` |
| **Typography** | Inter or Geist (shadcn default) |
| **Success/correct** | Muted green (not lime green from legacy app) |
| **Dark background** | `#0F172A` (slate-900) |
| **Light background** | `#F8FAFC` (slate-50) |

Theme stored in `user_preferences.theme`, synced to localStorage.

---

## 18. Legacy Code

The `client/` and `server/` directories from the PowerPicks MERN prototype will be **deleted** during Sprint 1. Git history on `feb-2024-refactor` preserves the old codebase.

---

## 19. Out of Scope (v0.2.0)

| Feature | Notes |
|---------|-------|
| Spread / over-under picks | Winner only for this version |
| MLB and other sports | After FBS CFB is stable |
| NCAA D2 / FCS / beta sports | Gated behind Pro; added post-launch |
| Per-league boost billing (Option B) | Schema only |
| Third-party ad network | Upgrade prompts only |
| Mobile native apps | Responsive web only |
| Real-time live scores | Polling on gamedays sufficient |
| Chat / messaging | Not planned |
| Supabase Realtime / Storage | Not used |
| Redis / BullMQ | Absurd SDK instead |

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-08 | Greenfield rebuild on v0.2.0 | Legacy codebase broken mid-refactor |
| 2026-07-08 | `apps/` monorepo structure | Three deployables (web, api, worker) + shared packages |
| 2026-07-08 | Supabase Postgres only | Cost-conscious; no vendor lock-in on auth |
| 2026-07-08 | absurd-sdk over Redis | Zero additional infra cost; Postgres already required |
| 2026-07-08 | Netlify + Fly.io split | Netlify can't run persistent Express |
| 2026-07-08 | GitHub Actions for cron | User preference; no extra service cost |
| 2026-07-08 | Single domain | Simpler than legacy subdomain split |
| 2026-07-08 | Callsheet brand name | User approved |
| 2026-07-08 | Membership locked at season start | Waitlist only advances pre-season on voluntary leave |
| 2026-07-08 | Option A billing with Option B schema | Simple launch; extensible later |
