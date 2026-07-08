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
- [ ] `score-picks` Absurd task (or cron endpoint `POST /api/cron/score-picks`)
- [ ] Finds games with `status: final` and unscored picks
- [ ] Sets `picks.is_correct` based on:
  - `picked_team` matches `games.winner` → `true`
  - `picked_team` does not match → `false`
  - `games.winner` is `tie` → apply league `tie_policy`:
    - `no_points`: `is_correct = false`
    - `count_as_correct`: `is_correct = true`
    - `half_point`: `is_correct = true` (score computed as 0.5 in leaderboard query)
- [ ] Idempotent — re-scoring doesn't duplicate
- [ ] Triggered by game sync (Sprint 06) after status update

---

### S09-02: Weekly leaderboard API

**As a** member  
**I want** to see the weekly leaderboard  
**So that** I know who won this week

**Acceptance criteria:**
- [ ] `GET /api/leagues/:id/leaderboard/:week` — member only
- [ ] Returns ranked list: `{ rank, userId, username, correct, total, points }`
- [ ] `correct` = count of `is_correct: true` picks for that week
- [ ] `total` = count of picks made (not total games — missed picks excluded)
- [ ] `points` = correct count (or with half_point logic)
- [ ] Ties in rank handled (same rank, skip next)
- [ ] Only includes members who were in the league that week

---

### S09-03: Season leaderboard API

**As a** member  
**I want** to see the season cumulative leaderboard  
**So that** I know who's winning overall

**Acceptance criteria:**
- [ ] `GET /api/leagues/:id/leaderboard` — member only
- [ ] Cumulative across all weeks in current season
- [ ] Same shape as weekly: `{ rank, userId, username, correct, total, points }`
- [ ] Season winner = rank 1 at season end

---

### S09-04: Leaderboard page (UI)

**As a** member  
**I want** a leaderboard view on the league page  
**So that** I can see standings

**Acceptance criteria:**
- [ ] Leaderboard tab on `/leagues/:id`
- [ ] Toggle: Weekly / Season
- [ ] Week selector for weekly view
- [ ] Table: rank, username, correct/total, points
- [ ] Current user row highlighted
- [ ] Trophy or medal icon for top 3
- [ ] Empty state: "No picks scored yet"

---

### S09-05: Game results on slate view

**As a** member  
**I want** to see game results alongside my picks  
**So that** I can see how I did

**Acceptance criteria:**
- [ ] On picks page and league page: final games show score (e.g., "Georgia 31 – 17 Alabama")
- [ ] Correct picks: green check icon
- [ ] Incorrect picks: red X icon
- [ ] Unpicked games: grey dash (no penalty indicator)
- [ ] In-progress games: live score if available from sync

---

### S09-06: Weekly winner highlight

**As a** member  
**I want** the weekly winner highlighted  
**So that** we can celebrate weekly champions

**Acceptance criteria:**
- [ ] Weekly leaderboard: rank 1 user gets "Week Winner" badge
- [ ] Shown on league overview for the most recently completed week
- [ ] If tie for first: all tied users get badge

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/score-picks` | CRON_SECRET | Score final games |
| GET | `/api/leagues/:id/leaderboard` | Member | Season standings |
| GET | `/api/leagues/:id/leaderboard/:week` | Member | Weekly standings |

---

## Sprint definition of done

- [ ] Picks scored correctly when games go final
- [ ] Tie policy applied per league settings
- [ ] Weekly leaderboard displays with correct ranks
- [ ] Season leaderboard displays cumulative standings
- [ ] Game results and pick correctness shown in UI
- [ ] All stories checked off
