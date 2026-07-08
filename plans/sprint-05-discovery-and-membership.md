# Sprint 05 — Discovery & Membership

**Goal:** Browse and join public leagues, waitlist for full leagues, and enforce membership lock rules when a season starts.

**Depends on:** Sprint 04  
**Blocks:** Sprint 07, 12

---

## Stories

### S05-01: Public league browse API

**As a** user  
**I want** to browse public leagues with filters  
**So that** I can find leagues to join

**Acceptance criteria:**
- [ ] `GET /api/leagues/public` — paginated, no auth required for list (auth required to join)
- [ ] Query params: `sportId`, `classificationId`, `sort` (`newest` | `members` | `name`), `page`, `limit`
- [ ] Returns only `isPublic: true` and `status: active | setup` leagues
- [ ] Private leagues never appear in results
- [ ] Response: `{ leagues: [...], total, page, limit }`
- [ ] Each league: id, name, sport, classification, memberCount, maxMembers, commissioner username, createdAt

---

### S05-02: Browse leagues page (UI)

**As a** user  
**I want** a browse page with filters and sorting  
**So that** I can discover public leagues

**Acceptance criteria:**
- [ ] `/leagues` route with league card grid
- [ ] Filter by sport (dropdown)
- [ ] Filter by classification (dropdown, dependent on sport)
- [ ] Sort by: newest, most members, name
- [ ] League card: name, sport badge, member count, "Join" button
- [ ] "Join" → join flow (or login redirect if not authenticated)
- [ ] "Full" badge if at capacity (with "Join waitlist" button)
- [ ] Pagination or infinite scroll
- [ ] Empty state: "No public leagues found"

---

### S05-03: Join public league API

**As a** user  
**I want** to join a public league directly  
**So that** I don't need an invite link

**Acceptance criteria:**
- [ ] `POST /api/leagues/:id/join` — auth required
- [ ] Validates: league is public, not full, user not already member, league not archived
- [ ] Creates `league_members` row
- [ ] Increments `member_count`
- [ ] Returns updated league

---

### S05-04: Waitlist API

**As a** user  
**I want** to join a waitlist when a league is full  
**So that** I can join if a spot opens

**Acceptance criteria:**
- [ ] `POST /api/leagues/:id/waitlist` — auth required
- [ ] Creates `league_waitlist` row with `position` (auto-incremented)
- [ ] Rejects if: not full (use join instead), already member, already on waitlist
- [ ] `GET /api/leagues/:id/waitlist` — commissioner only; returns ordered list
- [ ] `DELETE /api/leagues/:id/waitlist/me` — user removes self from waitlist

---

### S05-05: Waitlist advancement

**As a** system  
**I want** waitlist to advance when spots open pre-season  
**So that** users get a fair chance to join

**Acceptance criteria:**
- [ ] When member leaves **before season starts** → spot opens → top waitlist user notified
- [ ] Waitlist notification: Resend email with 48h accept link (join via invite flow)
- [ ] If not accepted in 48h → offer to next waitlist person
- [ ] When commissioner removes member → same advancement (any time)
- [ ] When commissioner increases `max_members` → waitlist invited in order
- [ ] When member leaves **after season starts** → spot does NOT open; waitlist does NOT advance

---

### S05-06: Season start & membership lock

**As a** commissioner  
**I want** the season to start when I set the first week's slate  
**So that** membership is locked and picks can begin

**Acceptance criteria:**
- [ ] League `status` transitions: `setup` → `active` when first slate is published (Sprint 07)
- [ ] Season `status` transitions: `upcoming` → `active` at same time
- [ ] Once active: voluntary member leave does not free spot
- [ ] Once active: `max_members` cannot be decreased
- [ ] UI indicator on league page: "Season active — membership locked"
- [ ] Pre-season: league page shows "Season hasn't started yet"

---

### S05-07: Leave league

**As a** member  
**I want** to leave a league  
**So that** I'm not stuck in leagues I don't want

**Acceptance criteria:**
- [ ] `DELETE /api/leagues/:id/members/me` — auth required
- [ ] Pre-season: removes member, decrements count, advances waitlist
- [ ] Mid-season: removes member, does NOT decrement count, does NOT advance waitlist
- [ ] Commissioner cannot leave (must transfer first — Sprint 11)
- [ ] Confirmation dialog in UI before leaving

---

### S05-08: Remove member (commissioner)

**As a** commissioner  
**I want** to remove a member from my league  
**So that** I can manage my league roster

**Acceptance criteria:**
- [ ] `DELETE /api/leagues/:id/members/:userId` — commissioner only
- [ ] Cannot remove self (commissioner)
- [ ] Removes member, decrements count
- [ ] Advances waitlist (pre-season and mid-season)
- [ ] UI: remove button on member list with confirmation dialog

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leagues/public` | Public | Browse public leagues |
| POST | `/api/leagues/:id/join` | Clerk JWT | Join public league |
| POST | `/api/leagues/:id/waitlist` | Clerk JWT | Join waitlist |
| GET | `/api/leagues/:id/waitlist` | Commissioner | View waitlist |
| DELETE | `/api/leagues/:id/waitlist/me` | Clerk JWT | Leave waitlist |
| DELETE | `/api/leagues/:id/members/me` | Member | Leave league |
| DELETE | `/api/leagues/:id/members/:userId` | Commissioner | Remove member |

---

## Sprint definition of done

- [ ] Public leagues browsable with sport/classification filters
- [ ] Users can join public leagues
- [ ] Full leagues show waitlist option
- [ ] Waitlist advances correctly pre-season
- [ ] Mid-season leave does not open spots
- [ ] Commissioner can remove members
- [ ] All stories checked off
