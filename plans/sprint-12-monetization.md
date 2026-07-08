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
- [ ] Clerk Dashboard: Billing enabled, Stripe connected
- [ ] Plan: `free` — default for all users, $0
- [ ] Plan: `pro` — $6.99/mo or $59/yr (exact price finalized here)
- [ ] Features defined in Clerk:
  - `unlimited_leagues` — Pro only
  - `large_leagues` — Pro only (>10 members)
  - `beta_sports` — Pro only
  - `no_ads` — Pro only
- [ ] Clerk `<PricingTable />` or custom pricing page component
- [ ] Webhook: `subscription.created`, `subscription.updated`, `subscription.deleted` → log/update user tier in DB (optional cache)

---

### S12-02: Pro feature gating (API)

**As a** system  
**I want** API endpoints to enforce Pro limits  
**So that** free users can't bypass restrictions

**Acceptance criteria:**
- [ ] Helper: `getUserPlan(userId)` — checks Clerk `has({ plan: 'pro' })` or cached DB value
- [ ] Create league: free users limited to 2 active leagues (already in Sprint 04; now also check Pro for unlimited)
- [ ] Create league: `maxMembers` capped at 10 for free; up to 50 for Pro
- [ ] Create league: beta classifications rejected for free users (403 + upgrade message)
- [ ] Join league: no restriction (joining is always free)
- [ ] All 403 responses include `{ code: "UPGRADE_REQUIRED", message: "...", upgradeUrl: "/settings/billing" }`

---

### S12-03: Upgrade prompts (UI)

**As a** free user  
**I want** to see upgrade prompts when I hit limits  
**So that** I know how to unlock more features

**Acceptance criteria:**
- [ ] Create league wizard: if at 2-league limit → upgrade CTA instead of form
- [ ] Max members slider: capped at 10 for free; "Upgrade to Pro for up to 50" label
- [ ] Beta sports in sport selector: greyed out with "Pro" badge
- [ ] Subtle upgrade banner on dashboard for free users (dismissible)
- [ ] No third-party ad network — only self-promotion for Pro

---

### S12-04: Billing settings page

**As a** user  
**I want** a billing page to manage my subscription  
**So that** I can upgrade, downgrade, or cancel

**Acceptance criteria:**
- [ ] `/settings/billing` route
- [ ] Shows current plan: Free or Pro
- [ ] Pro users: manage subscription via Clerk `<SubscriptionDetailsButton />`
- [ ] Free users: pricing table with upgrade CTA
- [ ] After upgrade: immediate feature unlock (no page reload needed — Clerk session refresh)
- [ ] Annual vs monthly toggle on pricing table

---

### S12-05: League boosts schema (Option B — schema only)

**As a** developer  
**I want** the database ready for per-league boosts  
**So that** we can add Option B billing later without a migration

**Acceptance criteria:**
- [ ] `league_boosts` table populated in Sprint 01 schema:
  ```
  league_boosts (id, league_id, type, purchased_at, expires_at)
  type: 'member_cap' | 'beta_sport'
  ```
- [ ] No API or UI for boosts in this sprint
- [ ] Comment in schema: "Reserved for Option B per-league billing"

---

### S12-06: Pro badge & status

**As a** Pro user  
**I want** a visual indicator that I'm a Pro subscriber  
**So that** I feel valued

**Acceptance criteria:**
- [ ] Pro badge on user avatar in header (small crown or "Pro" pill)
- [ ] Pro badge on league cards for leagues created by Pro users (optional)
- [ ] Settings page shows "Pro member since {date}"

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

- [ ] Clerk Billing configured with Free and Pro plans
- [ ] Free tier limits enforced on API (2 leagues, 10 members, core sports only)
- [ ] Pro users can create unlimited leagues with up to 50 members
- [ ] Upgrade prompts shown at limit points
- [ ] Billing settings page functional
- [ ] `league_boosts` table exists (schema only)
- [ ] All stories checked off
