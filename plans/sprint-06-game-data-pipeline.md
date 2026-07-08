# Sprint 06 — Game Data Pipeline

**Goal:** ESPN game data synced into Postgres, abstraction layer for future provider swaps, and GitHub Actions cron for scheduled sync.

**Depends on:** Sprint 01  
**Blocks:** Sprint 07, 09

> **Note:** This sprint can run in parallel with Sprints 02–05 if staffed accordingly.

---

## Stories

### S06-01: ESPN adapter (shared package)

**As a** developer  
**I want** an abstraction layer over ESPN's API  
**So that** we can swap data providers later without rewriting business logic

**Acceptance criteria:**
- [ ] `packages/shared/src/sports/espn/types.ts` — `EspnGame`, `EspnScoreboard` types
- [ ] `packages/shared/src/sports/espn/client.ts` — fetch wrapper with error handling and rate limiting
- [ ] `packages/shared/src/sports/espn/cfb-fbs.ts` — FBS-specific: fetch scoreboard by week, map to internal `Game` shape
- [ ] Maps ESPN fields: `id`, `homeTeam`, `awayTeam`, `startTime`, `week`, `status`, `homeScore`, `awayScore`
- [ ] Unit tests for mapping logic (mock ESPN responses)
- [ ] No hardcoded year — accepts `season` and `week` params

---

### S06-02: Sync games API endpoint

**As a** system  
**I want** an API endpoint to trigger game sync  
**So that** cron jobs and manual syncs can populate the games table

**Acceptance criteria:**
- [ ] `POST /api/cron/sync-games` — protected by `CRON_SECRET` header
- [ ] Accepts optional body: `{ seasonYear, week, classificationId }`
- [ ] Defaults: current season year, all weeks with scheduled games, FBS classification
- [ ] Fetches ESPN scoreboard for each week
- [ ] Upserts into `games` table by `external_id` (idempotent)
- [ ] Updates existing games: status, scores, winner
- [ ] Sets `winner` field when status is `final`
- [ ] Returns: `{ synced: number, updated: number, errors: [] }`
- [ ] Logs sync results

---

### S06-03: Games query API

**As a** frontend app  
**I want** to query games by season and week  
**So that** the commissioner can select games for slates

**Acceptance criteria:**
- [ ] `GET /api/games` — auth required
- [ ] Query params: `seasonId`, `week`, `classificationId`
- [ ] Returns games sorted by `start_time`
- [ ] Each game: id, homeTeam, awayTeam, startTime, week, status, homeScore, awayScore
- [ ] Filter out completed games older than 7 days (optional cleanup)

---

### S06-04: GitHub Actions cron workflow

**As a** system  
**I want** scheduled game syncs via GitHub Actions  
**So that** game data stays current without manual intervention

**Acceptance criteria:**
- [ ] `.github/workflows/sync-games.yml` created
- [ ] Schedule: daily at 6 AM UTC (off-season); every 15 min on Saturdays (gameday — use cron or conditional)
- [ ] Calls `POST /api/cron/sync-games` with `CRON_SECRET`
- [ ] Logs response status
- [ ] Manual `workflow_dispatch` trigger for testing
- [ ] Documented in README: required GitHub secrets (`CRON_SECRET`, `API_URL`)

---

### S06-05: Initial season & game seed

**As a** developer  
**I want** the current CFB FBS season seeded with games  
**So that** development and testing have real data

**Acceptance criteria:**
- [ ] Seed script or manual sync populates 2026 FBS season
- [ ] At least weeks 1–3 have games in DB after seed
- [ ] `seasons` row: year 2026, classification FBS, status `upcoming`
- [ ] Games have correct team names, kickoff times, ESPN week numbers

---

### S06-06: Game status lifecycle

**As a** system  
**I want** game statuses to transition correctly  
**So that** picks lock and scoring triggers at the right time

**Acceptance criteria:**
- [ ] Game statuses: `scheduled` → `in_progress` → `final`
- [ ] `winner` computed on `final`: home, away, or `tie`
- [ ] Sync updates status from ESPN data
- [ ] Documented: when `in_progress`, picks for that game are locked regardless of week-level lock

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/sync-games` | CRON_SECRET | Sync games from ESPN |
| GET | `/api/games` | Clerk JWT | Query games by season/week |

---

## Sprint definition of done

- [ ] ESPN adapter fetches and maps FBS games
- [ ] Games table populated with 2026 season data
- [ ] Cron workflow runs sync successfully
- [ ] Games queryable by season and week via API
- [ ] Game status transitions work
- [ ] All stories checked off
