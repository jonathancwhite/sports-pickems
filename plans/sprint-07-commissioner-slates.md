# Sprint 07 — Commissioner Slates

**Goal:** Commissioners select which games are pickable each week (min 4), with server-enforced lock when the week's first game kicks off.

**Depends on:** Sprint 05, Sprint 06  
**Blocks:** Sprint 08

---

## Stories

### S07-01: Set weekly slate API

**As a** commissioner  
**I want** to select games for a week's pick'em slate  
**So that** members know which games to pick

**Acceptance criteria:**
- [ ] `PUT /api/leagues/:id/slates/:week` — commissioner only
- [ ] Body: `{ gameIds: string[] }` (array of game UUIDs)
- [ ] Validates: min 4 games, all games belong to league's season/classification, week matches
- [ ] Rejects if week's first game has already kicked off (slate locked)
- [ ] Creates/updates `league_week_slates` row
- [ ] Replaces `league_week_slate_games` join rows
- [ ] If games removed from existing slate → delete affected picks + spawn `notify-slate-change` (Sprint 10)
- [ ] First slate published → league status `setup` → `active`, season `upcoming` → `active`
- [ ] Returns updated slate with game details

---

### S07-02: Get weekly slate API

**As a** league member  
**I want** to see the current week's slate  
**So that** I know which games to pick

**Acceptance criteria:**
- [ ] `GET /api/leagues/:id/slates/:week` — member only
- [ ] Returns: slate metadata (week, locked, lockedAt) + games array
- [ ] `locked: true` if first game in slate has kicked off
- [ ] `GET /api/leagues/:id/slates` — returns all slates for league's season (list of weeks)

---

### S07-03: Commissioner schedule page (UI)

**As a** commissioner  
**I want** a UI to select games for each week  
**So that** I can curate the pick'em slate

**Acceptance criteria:**
- [ ] `/leagues/:id/schedule` route (commissioner only)
- [ ] Week selector (tabs or dropdown) — ESPN week numbers
- [ ] Game list for selected week: checkbox, teams, kickoff time, TV network (if available)
- [ ] Selected count indicator: "4 of 4 minimum selected" (red if < 4)
- [ ] Save button → `PUT /api/leagues/:id/slates/:week`
- [ ] Locked weeks: checkboxes disabled, "Locked" badge shown
- [ ] Future weeks: editable
- [ ] Past weeks: read-only view
- [ ] Success toast on save

---

### S07-04: Slate lock enforcement (server)

**As a** system  
**I want** slates to lock automatically at first kickoff  
**So that** commissioners can't change games mid-week

**Acceptance criteria:**
- [ ] On `GET` or `PUT` slate: check if any game in slate has `start_time <= now()`
- [ ] If so: set `league_week_slates.locked_at = now()`, reject PUT with 403
- [ ] Cron or game sync can also set `locked_at` when game status → `in_progress`
- [ ] Locked slates return `locked: true` in API response

---

### S07-05: Slate display on league page

**As a** member  
**I want** to see the current week's games on the league page  
**So that** I have context before navigating to picks

**Acceptance criteria:**
- [ ] League overview (`/leagues/:id`) shows current week slate
- [ ] Game cards: away @ home, kickoff time, pick status (picked / not picked — wired in Sprint 08)
- [ ] "Make picks" CTA → `/leagues/:id/picks`
- [ ] If no slate set: "Commissioner hasn't set this week's games yet"
- [ ] If season not started: "Season starts when commissioner sets Week 1 slate"

---

### S07-06: Week navigation

**As a** member  
**I want** to view slates from different weeks  
**So that** I can review past weeks and prepare for future ones

**Acceptance criteria:**
- [ ] Week selector on league page and picks page
- [ ] Defaults to current ESPN week (or next upcoming week with a slate)
- [ ] Past weeks: show results if available (wired in Sprint 09)
- [ ] Future weeks: show slate if set, otherwise "Not yet scheduled"

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leagues/:id/slates` | Member | List all slates |
| GET | `/api/leagues/:id/slates/:week` | Member | Get slate for week |
| PUT | `/api/leagues/:id/slates/:week` | Commissioner | Set/update slate |

---

## Sprint definition of done

- [ ] Commissioner can select 4+ games for a week and save
- [ ] Slate locks when first game kicks off
- [ ] Future weeks editable; past weeks read-only
- [ ] First slate publish activates the season
- [ ] Members see current week slate on league page
- [ ] All stories checked off
