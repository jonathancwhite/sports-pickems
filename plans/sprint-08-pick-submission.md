# Sprint 08 — Pick Submission

**Goal:** Members submit and edit winner picks for the weekly slate, with server-enforced lock at kickoff.

**Depends on:** Sprint 07  
**Blocks:** Sprint 09, Sprint 10

---

## Stories

### S08-01: Submit picks API

**As a** member  
**I want** to submit my picks for a week's games  
**So that** I'm competing in the pick'em

**Acceptance criteria:**
- [ ] `PUT /api/leagues/:id/picks/:week` — member only
- [ ] Body: `{ picks: [{ gameId, pickedTeam: "home" | "away" }] }`
- [ ] Validates: all gameIds are in the week's slate, pickedTeam is valid
- [ ] Rejects if week's slate is locked (first kickoff passed)
- [ ] Rejects if individual game has started (`start_time <= now()` or status `in_progress`/`final`)
- [ ] Upserts into `picks` table (one pick per user per game per league)
- [ ] Partial picks allowed (not all games required)
- [ ] Returns updated picks array

---

### S08-02: Get picks API

**As a** member  
**I want** to see my picks and other members' picks (after lock)  
**So that** I can track selections

**Acceptance criteria:**
- [ ] `GET /api/leagues/:id/picks/:week` — member only
- [ ] Query param: `userId` (optional; defaults to current user)
- [ ] Before slate lock: user can only see their own picks (others hidden)
- [ ] After slate lock: all members' picks visible
- [ ] Returns: `[{ gameId, pickedTeam, userId, username }]`
- [ ] `GET /api/leagues/:id/picks/:week/summary` — pick count per member (for commissioner overview)

---

### S08-03: Picks page (UI)

**As a** member  
**I want** a page to make my picks for the week  
**So that** I can select winners for each game

**Acceptance criteria:**
- [ ] `/leagues/:id/picks` route with week selector
- [ ] Game cards from slate: away @ home, kickoff time
- [ ] Tap/click team to select winner (highlighted selection)
- [ ] Selected picks persist visually before save
- [ ] "Save picks" button → `PUT /api/leagues/:id/picks/:week`
- [ ] Auto-save on selection change (debounced) or explicit save button
- [ ] Locked games: selections disabled, show current pick as read-only
- [ ] Progress indicator: "3 of 5 games picked"
- [ ] Unpicked games visually distinct (no penalty, but clear)

---

### S08-04: Pick visibility rules (UI)

**As a** member  
**I want** to see other members' picks only after the slate locks  
**So that** there's no copy-picking before kickoff

**Acceptance criteria:**
- [ ] Before lock: picks page shows only current user's selections
- [ ] After lock: toggle or tab to view all members' picks per game
- [ ] Other members' picks shown as team name badges on game cards
- [ ] Commissioner can always see pick count summary (who hasn't picked)

---

### S08-05: Pick lock enforcement (server)

**As a** system  
**I want** picks to lock at kickoff  
**So that** no picks can be changed after games start

**Acceptance criteria:**
- [ ] `PUT` rejects picks for games where `start_time <= now()`
- [ ] `PUT` rejects all picks if slate `locked_at` is set
- [ ] Individual game lock independent of slate lock (game can start before slate lock if commissioner added late game — edge case handled)
- [ ] `picks.locked_at` set on each pick when locked

---

### S08-06: Commissioner pick overview

**As a** commissioner  
**I want** to see who has and hasn't submitted picks  
**So that** I know which members need reminders

**Acceptance criteria:**
- [ ] On league page or schedule page: member pick status list
- [ ] Shows: username, picks made / total games in slate
- [ ] "Not started" / "Partial" / "Complete" status badges
- [ ] Only visible to commissioner before lock; visible to all after lock

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leagues/:id/picks/:week` | Member | Get picks for week |
| PUT | `/api/leagues/:id/picks/:week` | Member | Submit/update picks |
| GET | `/api/leagues/:id/picks/:week/summary` | Commissioner | Pick completion summary |

---

## Sprint definition of done

- [ ] Member can select winners and save picks
- [ ] Picks locked at kickoff (server-enforced)
- [ ] Other members' picks hidden until slate locks
- [ ] Partial picks allowed (unpicked games excluded from scoring)
- [ ] Commissioner can see pick completion status
- [ ] All stories checked off
