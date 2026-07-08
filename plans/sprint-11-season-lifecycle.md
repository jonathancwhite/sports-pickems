# Sprint 11 — Season Lifecycle

**Goal:** Season archive, rollover to new season with member re-invite, and commissioner transfer with email verification.

**Depends on:** Sprint 09, Sprint 10  
**Blocks:** Sprint 12

---

## Stories

### S11-01: Season end detection

**As a** system  
**I want** to detect when a season is complete  
**So that** leagues can be archived

**Acceptance criteria:**
- [x] Cron or game sync checks: all games in season are `final`
- [x] When last game goes final → season `status: completed`
- [x] League `status: archived` (auto or after buffer period — 7 days)
- [x] Archived leagues: read-only (no picks, no slate edits)
- [x] Archived leagues no longer count toward free user's active league limit
- [x] Commissioner notified: "Your season has ended — start a new one?"

---

### S11-02: Season rollover API

**As a** commissioner  
**I want** to start a new season for my league  
**So that** we can compete again next year

**Acceptance criteria:**
- [x] `POST /api/leagues/:id/seasons` — commissioner only
- [x] Body: `{ year: number }` (e.g., 2027)
- [x] Validates: current season is `completed` or `archived`, league is `archived`
- [x] Creates new `seasons` row: status `upcoming`, linked to same classification
- [x] League `status` → `setup` (membership locked until new season starts)
- [x] Previous season data preserved (read-only)
- [x] Spawns `send-season-invites` Absurd task
- [x] Returns new season details

---

### S11-03: Season re-invite flow

**As a** previous member  
**I want** to receive an invite to rejoin for the new season  
**So that** I can continue competing

**Acceptance criteria:**
- [x] `send-season-invites` task: email all previous season members
- [x] Email: league name, new season year, "Rejoin" link
- [x] `POST /api/leagues/:id/seasons/join` — auth required
- [x] Creates `league_members` row (must explicitly accept — not auto-enrolled)
- [x] Members who don't accept are not in the new season
- [x] Commissioner auto-enrolled (no accept needed)
- [x] Invite code remains the same (stable URL)

---

### S11-04: Season history UI

**As a** member  
**I want** to view past season results  
**So that** I can see historical standings

**Acceptance criteria:**
- [x] League page: season selector dropdown (2026, 2025, etc.)
- [x] Selecting past season: read-only leaderboard + pick history
- [x] Current season is default selection
- [x] Archived seasons show "Season complete" banner with final standings

---

### S11-05: Commissioner transfer API

**As a** commissioner  
**I want** to transfer my commissioner role to another member  
**So that** someone else can manage the league

**Acceptance criteria:**
- [x] `POST /api/leagues/:id/transfer` — commissioner only
- [x] Body: `{ targetUserId: string }`
- [x] Validates: target is a current member, not self
- [x] Creates pending transfer record (not instant)
- [x] Sends `commissioner-transfer` email to target with accept link
- [x] `POST /api/leagues/:id/transfer/accept` — target user only
- [x] On accept: swap roles (old commissioner → member, target → commissioner)
- [x] On decline or 7-day expiry: transfer cancelled, commissioner unchanged
- [x] Audit: log role change with timestamp

---

### S11-06: Commissioner transfer UI

**As a** commissioner  
**I want** a UI to initiate commissioner transfer  
**So that** I can hand off league management

**Acceptance criteria:**
- [x] League settings page: "Transfer commissioner" section
- [x] Member picker (dropdown of current members)
- [x] Confirmation dialog: "This will send an email to {username} to accept"
- [x] Pending transfer state shown until accepted/declined/expired
- [x] Target user sees notification: "You've been asked to become commissioner"

---

### S11-07: Delete league

**As a** commissioner  
**I want** to delete my league  
**So that** I can clean up leagues I no longer want

**Acceptance criteria:**
- [x] `DELETE /api/leagues/:id` — commissioner only
- [x] If season active: league deleted but still counts toward active league limit (per DECISIONS.md)
- [x] If season archived: does not count toward limit
- [x] Soft delete: `leagues.deleted_at` set (or hard delete with cascade)
- [x] Confirmation dialog: "This cannot be undone"
- [x] All members see league removed from their dashboard

---

### S11-08: League settings page

**As a** commissioner  
**I want** a settings page for my league  
**So that** I can manage name, max members, tie policy, and transfer

**Acceptance criteria:**
- [x] `/leagues/:id/settings` route (commissioner only)
- [x] Editable (pre-season): name, max members, tie policy
- [x] Editable (any time): transfer commissioner, delete league
- [x] Not editable after season starts: sport, classification, public/private
- [x] Save → `PATCH /api/leagues/:id`

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/leagues/:id/seasons` | Commissioner | Start new season |
| POST | `/api/leagues/:id/seasons/join` | Clerk JWT | Accept season re-invite |
| POST | `/api/leagues/:id/transfer` | Commissioner | Initiate transfer |
| POST | `/api/leagues/:id/transfer/accept` | Target user | Accept transfer |
| PATCH | `/api/leagues/:id` | Commissioner | Update settings |
| DELETE | `/api/leagues/:id` | Commissioner | Delete league |

---

## Sprint definition of done

- [x] Season auto-archives when all games final
- [x] Commissioner can start new season
- [x] Previous members receive re-invite emails and must accept
- [x] Season history viewable (read-only)
- [x] Commissioner transfer works with email verification
- [x] League deletion works with correct active-league counting
- [x] All stories checked off
