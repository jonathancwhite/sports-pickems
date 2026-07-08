# Production smoke test checklist

Run against staging or production after each deploy. Use Stripe test mode for billing steps until live launch.

## Prerequisites

- [ ] API health check returns `200` at `/api/health`
- [ ] Web app loads at the deployment URL
- [ ] Clerk production (or staging) instance configured with Billing enabled
- [ ] GitHub Actions secrets `API_URL` and `CRON_SECRET` set

## Core flow

1. [ ] **Sign up** with a new username
2. [ ] **Create league** (FBS CFB, public, 4–10 members)
3. [ ] **Copy invite link** from league invite page
4. [ ] **Sign up as second user** via invite link (incognito / separate browser)
5. [ ] **Second user joins** league successfully
6. [ ] **Commissioner sets Week 1 slate** with at least 4 games
7. [ ] **Both users submit picks** for Week 1
8. [ ] **Picks lock** after kickoff (or manual lock for testing)
9. [ ] **Score picks** after a game goes final (cron sync or manual trigger)
10. [ ] **Verify leaderboard** shows correct standings
11. [ ] **Pick reminder email** sends (trigger `pick-reminders` workflow manually)

## Billing (Sprint 12)

12. [ ] **Upgrade to Pro** via `/settings/billing` (Stripe test card in test mode)
13. [ ] **Verify Pro limits lifted** — create a 3rd league, set max members above 10

## Regression checks

- [ ] Free user sees upgrade banner on dashboard (dismissible)
- [ ] Free user blocked at 2-league limit with `UPGRADE_REQUIRED` response
- [ ] Beta sports greyed out with Pro badge for free users
- [ ] Pro badge visible in header after upgrade
- [ ] `/settings/billing` shows subscription management for Pro users

## Cron workflows

Trigger manually via GitHub Actions → Run workflow:

- [ ] `sync-games.yml`
- [ ] `pick-reminders.yml`
- [ ] `season-archive.yml`
- [ ] `waitlist-expiry.yml`

All should return HTTP 2xx against production `API_URL`.
