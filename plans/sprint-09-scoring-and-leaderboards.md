# Sprint 09 — Scoring & Leaderboards

**Goal:** Score picks when games finish, display weekly and season leaderboards.

**Depends on:** Sprint 08  
**Blocks:** Sprint 10, Sprint 11

---

## Stories

### S09-01: Score picks task

**As a** system  
**I want** picks scored when games go final  
**So that** leaderboards stay current

**Acceptance criteria:**
- [x] `score-picks` Absurd task (or cron endpoint `POST /api/cron/score-picks`)
- [x] Finds games with `status: final` and unscored picks
- [x] Sets `picks.is_correct` based on:
  - `picked_team` matches `games.winner` → `true`
  - `picked_team` does not match → `false`
  - `games.winner` is `tie` → apply league `tie_policy`:
    - `no_points`: `is_correct = false`
    - `count_as_correct`: `is_correct = true`
    - `half_point`: `is_correct = true` (score computed as 0.5 in leaderboard query)
- [x] Idempotent — re-scoring doesn't duplicate
- [x] Triggered by game sync (Sprint 06) after status update

---

### S09-02: Weekly leaderboard API

**As a** member  
**I want** to see the weekly leaderboard  
**So that** I know who won this week

**Acceptance criteria:**
- [x] `GET /api/leagues/:id/leaderboard/:week` — member only
- [x] Returns ranked list: `{ rank, userId, username, correct, total, points }`
- [x] `correct` = count of `is_correct: true` picks for that week
- [x] `total` = count of picks made (not total games — missed picks excluded)
- [x] `points` = correct count (or with half_point logic)
- [x] Ties in rank handled (same rank, skip next)
- [x] Only includes members who were in the league that week

---

### S09-03: Season leaderboard API

**As a** member  
**I want** to see the season cumulative leaderboard  
**So that** I know who's winning overall

**Acceptance criteria:**
- [x] `GET /api/leagues/:id/leaderboard` — member only
- [x] Cumulative across all weeks in current season
- [x] Same shape as weekly: `{ rank, userId, username, correct, total, points }`
- [x] Season winner = rank 1 at season end

---

### S09-04: Leaderboard page (UI)

**As a** member  
**I want** a leaderboard view on the league page  
**So that** I can see standings

**Acceptance criteria:**
- [x] Leaderboard tab on `/leagues/:id`
- [x] Toggle: Weekly / Season
- [x] Week selector for weekly view
- [x] Table: rank, username, correct/total, points
- [x] Current user row highlighted
- [x] Trophy or medal icon for top 3
- [x] Empty state: "No picks scored yet"

---

### S09-05: Game results on slate view

**As a** member  
**I want** to see game results alongside my picks  
**So that** I can see how I did

**Acceptance criteria:**
- [x] On picks page and league page: final games show score (e.g., "Georgia 31 – 17 Alabama")
- [x] Correct picks: green check icon
- [x] Incorrect picks: red X icon
- [x] Unpicked games: grey dash (no penalty indicator)
- [x] In-progress games: live score if available from sync

---

### S09-06: Weekly winner highlight

**As a** member  
**I want** the weekly winner highlighted  
**So that** we can celebrate weekly champions

**Acceptance criteria:**
- [x] Weekly leaderboard: rank 1 user gets "Week Winner" badge
- [x] Shown on league overview for the most recently completed week
- [x] If tie for first: all tied users get badge

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/score-picks` | CRON_SECRET | Score final games |
| GET | `/api/leagues/:id/leaderboard` | Member | Season standings |
| GET | `/api/leagues/:id/leaderboard/:week` | Member | Weekly standings |

---

## Sprint definition of done

- [x] Picks scored correctly when games go final
- [x] Tie policy applied per league settings
- [x] Weekly leaderboard displays with correct ranks
- [x] Season leaderboard displays cumulative standings
- [x] Game results and pick correctness shown in UI
- [x] All stories checked off
