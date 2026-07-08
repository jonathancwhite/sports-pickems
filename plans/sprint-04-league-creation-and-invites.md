# Sprint 04 — League Creation & Invites

**Goal:** Users can create leagues and share Discord-style invite links that work for new and existing users.

**Depends on:** Sprint 03  
**Blocks:** Sprint 05, 07

---

## Stories

### S04-01: Create league API

**As a** user  
**I want** to create a pick'em league via API  
**So that** I have a league to invite friends to

**Acceptance criteria:**
- [ ] `POST /api/leagues` accepts:
  ```json
  {
    "name": "string",
    "sportId": "uuid",
    "classificationId": "uuid",
    "isPublic": boolean,
    "password": "string | null",
    "maxMembers": number,
    "tiePolicy": "no_points | count_as_correct | half_point"
  }
  ```
- [ ] Validates: name required (3–50 chars), maxMembers 2–10 (free tier; Pro check in Sprint 12)
- [ ] Creates `leagues` row with unique `invite_code` (nanoid, 8 chars)
- [ ] Creates `league_members` row: creator as `commissioner`
- [ ] Creates `seasons` row: current year, status `upcoming`, linked to classification
- [ ] Links league to season
- [ ] Enforces free tier: max 2 active created leagues (return 403 with upgrade message if exceeded)
- [ ] Private league: optional `password` hashed with bcrypt
- [ ] Returns full league object including `inviteCode`

---

### S04-02: Create league wizard (UI)

**As a** user  
**I want** a multi-step form to create a league  
**So that** I can configure my league easily

**Acceptance criteria:**
- [ ] `/leagues/new` route with multi-step wizard
- [ ] Step 1: Sport + Classification (only FBS CFB available at launch; others greyed "Coming soon")
- [ ] Step 2: League name
- [ ] Step 3: Public / Private toggle; password field if private
- [ ] Step 4: Max members (slider or input, 2–10 for free)
- [ ] Step 5: Tie policy selection with explanations
- [ ] Step 6: Review + confirm
- [ ] On success → redirect to `/leagues/:id/invite`
- [ ] Form validation with Zod + React Hook Form
- [ ] Loading state on submit; error toast on failure
- [ ] Disable if user at 2 active league limit (show upgrade CTA)

---

### S04-03: Invite link page (commissioner)

**As a** commissioner  
**I want** to see and copy my league's invite link  
**So that** I can share it with friends

**Acceptance criteria:**
- [ ] `/leagues/:id/invite` route (commissioner only)
- [ ] Displays invite URL: `https://callsheet.app/invite/{code}`
- [ ] Copy-to-clipboard button with success toast
- [ ] Shows league name, sport, member count / max
- [ ] QR code generation (optional — nice to have, not blocking)
- [ ] "Share" button using Web Share API on mobile

---

### S04-04: Invite preview page (public)

**As a** visitor  
**I want** to see league details when I open an invite link  
**So that** I know what I'm joining before signing up

**Acceptance criteria:**
- [ ] `GET /api/leagues/invite/:code` — public, no auth
- [ ] Returns: league name, sport, classification, member count, max members, commissioner username, isPublic
- [ ] Does NOT return: member list, picks, passwords
- [ ] `/invite/:code` route renders preview (public layout)
- [ ] Shows: league name, sport badge, "X of Y members", commissioner name
- [ ] If league full: "This league is full" message + waitlist CTA (Sprint 05)
- [ ] If private + password required: password input before join

---

### S04-05: Invite join flow (Discord-style)

**As a** user  
**I want** to join a league from an invite link  
**So that** I can compete with my friends

**Acceptance criteria:**
- [ ] If not signed in: "Join {league}" CTA → `/sign-up?redirect_url=/invite/:code`
- [ ] After auth, return to `/invite/:code` with join prompt
- [ ] If signed in: "Join league" button
- [ ] `POST /api/leagues/invite/:code/join` — accepts optional `{ password }`
- [ ] Creates `league_members` row with role `member`
- [ ] Increments `leagues.member_count`
- [ ] On success → redirect to `/leagues/:id`
- [ ] Error cases: already a member, league full (→ waitlist in Sprint 05), wrong password, league archived

---

### S04-06: League detail page (basic)

**As a** league member  
**I want** to view my league's overview page  
**So that** I can see league info and navigate to picks/settings

**Acceptance criteria:**
- [ ] `GET /api/leagues/:id` — member-only; returns league + season + members
- [ ] `/leagues/:id` route renders league home
- [ ] Shows: league name, sport, season year, member list with roles
- [ ] Commissioner badge on commissioner
- [ ] Navigation tabs: Overview, Picks, Schedule (commissioner), Settings (commissioner)
- [ ] Empty state if season hasn't started: "Waiting for commissioner to set the first week's games"
- [ ] Sidebar updated to show joined leagues

---

### S04-07: My leagues on dashboard

**As a** user  
**I want** to see all my leagues on the dashboard  
**So that** I can quickly navigate to them

**Acceptance criteria:**
- [ ] `GET /api/leagues/me` — returns all leagues user is a member of
- [ ] Dashboard shows league cards: name, sport, member count, season status
- [ ] Separated: "Commissioning" vs "Joined" sections
- [ ] Click card → `/leagues/:id`
- [ ] "Create league" and "Browse leagues" CTAs in empty state

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/leagues` | Clerk JWT | Create league |
| GET | `/api/leagues/me` | Clerk JWT | User's leagues |
| GET | `/api/leagues/:id` | Member | League detail |
| GET | `/api/leagues/invite/:code` | Public | Invite preview |
| POST | `/api/leagues/invite/:code/join` | Clerk JWT | Join via invite |

---

## Sprint definition of done

- [ ] User can create a league through the wizard
- [ ] Commissioner sees invite link and can copy it
- [ ] New user can sign up from invite link and join
- [ ] Existing user can join from invite link
- [ ] Dashboard shows created and joined leagues
- [ ] Free tier 2-league limit enforced on create
- [ ] All stories checked off
