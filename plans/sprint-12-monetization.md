# Sprint 12 — Monetization

**Goal:** Clerk Billing integration, Free vs Pro tier gating, and upgrade UI.

**Depends on:** Sprint 05, Sprint 11  
**Blocks:** Sprint 13

---

## Stories

### S12-01: Clerk Billing setup

**As a** developer  
**I want** Clerk Billing configured with Free and Pro plans  
**So that** users can subscribe to Pro

**Acceptance criteria:**
- [x] Clerk Dashboard: Billing enabled, Stripe connected
- [x] Plan: `free` — default for all users, $0
- [x] Plan: `pro` — $6.99/mo or $59/yr (exact price finalized here)
- [x] Features defined in Clerk:
  - `unlimited_leagues` — Pro only
  - `large_leagues` — Pro only (>10 members)
  - `beta_sports` — Pro only
  - `no_ads` — Pro only
- [x] Clerk `<PricingTable />` or custom pricing page component
- [x] Webhook: `subscription.created`, `subscription.updated`, `subscription.deleted` → log/update user tier in DB (optional cache)

---

### S12-02: Pro feature gating (API)

**As a** system  
**I want** API endpoints to enforce Pro limits  
**So that** free users can't bypass restrictions

**Acceptance criteria:**
- [x] Helper: `getUserPlan(userId)` — checks Clerk `has({ plan: 'pro' })` or cached DB value
- [x] Create league: free users limited to 2 active leagues (already in Sprint 04; now also check Pro for unlimited)
- [x] Create league: `maxMembers` capped at 10 for free; up to 50 for Pro
- [x] Create league: beta classifications rejected for free users (403 + upgrade message)
- [x] Join league: no restriction (joining is always free)
- [x] All 403 responses include `{ code: "UPGRADE_REQUIRED", message: "...", upgradeUrl: "/settings/billing" }`

---

### S12-03: Upgrade prompts (UI)

**As a** free user  
**I want** to see upgrade prompts when I hit limits  
**So that** I know how to unlock more features

**Acceptance criteria:**
- [x] Create league wizard: if at 2-league limit → upgrade CTA instead of form
- [x] Max members slider: capped at 10 for free; "Upgrade to Pro for up to 50" label
- [x] Beta sports in sport selector: greyed out with "Pro" badge
- [x] Subtle upgrade banner on dashboard for free users (dismissible)
- [x] No third-party ad network — only self-promotion for Pro

---

### S12-04: Billing settings page

**As a** user  
**I want** a billing page to manage my subscription  
**So that** I can upgrade, downgrade, or cancel

**Acceptance criteria:**
- [x] `/settings/billing` route
- [x] Shows current plan: Free or Pro
- [x] Pro users: manage subscription via Clerk `<SubscriptionDetailsButton />`
- [x] Free users: pricing table with upgrade CTA
- [x] After upgrade: immediate feature unlock (no page reload needed — Clerk session refresh)
- [x] Annual vs monthly toggle on pricing table

---

### S12-05: League boosts schema (Option B — schema only)

**As a** developer  
**I want** the database ready for per-league boosts  
**So that** we can add Option B billing later without a migration

**Acceptance criteria:**
- [x] `league_boosts` table populated in Sprint 01 schema:
  ```
  league_boosts (id, league_id, type, purchased_at, expires_at)
  type: 'member_cap' | 'beta_sport'
  ```
- [x] No API or UI for boosts in this sprint
- [x] Comment in schema: "Reserved for Option B per-league billing"

---

### S12-06: Pro badge & status

**As a** Pro user  
**I want** a visual indicator that I'm a Pro subscriber  
**So that** I feel valued

**Acceptance criteria:**
- [x] Pro badge on user avatar in header (small crown or "Pro" pill)
- [x] Pro badge on league cards for leagues created by Pro users (optional)
- [x] Settings page shows "Pro member since {date}"

---

## API endpoints (this sprint)

No new endpoints — gating added to existing endpoints. Billing managed by Clerk.

| Clerk webhook | Event | Action |
|---------------|-------|--------|
| `subscription.created` | Log plan change |
| `subscription.updated` | Update cached tier |
| `subscription.deleted` | Revert to free |

---

## Sprint definition of done

- [x] Clerk Billing configured with Free and Pro plans
- [x] Free tier limits enforced on API (2 leagues, 10 members, core sports only)
- [x] Pro users can create unlimited leagues with up to 50 members
- [x] Upgrade prompts shown at limit points
- [x] Billing settings page functional
- [x] `league_boosts` table exists (schema only)
- [x] All stories checked off
