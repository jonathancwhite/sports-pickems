# Sprint 13 — Deploy & Launch

**Goal:** Production deployment (Netlify + Fly.io), CI pipeline, final polish, and launch readiness.

**Depends on:** All previous sprints  
**Blocks:** Nothing — this is the launch sprint

---

## Stories

### S13-01: Production environment configuration

**As a** developer  
**I want** all environment variables configured for production  
**So that** the app runs correctly in prod

**Acceptance criteria:**
- [ ] Supabase production project created (Pro tier if needed)
- [ ] Clerk production instance configured (custom domain if available)
- [ ] Resend domain verified (`callsheet.app` or staging domain)
- [ ] All secrets documented in `.env.example` with descriptions
- [ ] Production env vars set in Netlify and Fly.io dashboards
- [ ] `CRON_SECRET` set in GitHub Actions secrets
- [ ] CORS configured: production web URL allowed on API

---

### S13-02: Netlify deployment (web)

**As a** developer  
**I want** the web app deployed to Netlify  
**So that** users can access the frontend

**Acceptance criteria:**
- [ ] `netlify.toml` in repo root or `apps/web/`:
  - Build command: `turbo build --filter=web`
  - Publish directory: `apps/web/dist`
  - SPA redirect: `/* → /index.html` (200)
- [ ] Environment variables set in Netlify dashboard
- [ ] Deploy previews on PR branches
- [ ] Production deploy on push to `v0.2.0` (or `main` when merged)
- [ ] Custom domain configured (or Netlify subdomain for staging)

---

### S13-03: Fly.io deployment (API + worker)

**As a** developer  
**I want** the API and worker deployed to Fly.io  
**So that** backend services run in production

**Acceptance criteria:**
- [ ] `fly.toml` for API app
- [ ] `fly.toml` for worker app (or same app, different process group)
- [ ] Dockerfile builds both from monorepo root
- [ ] Health check: `GET /api/health`
- [ ] Auto-deploy on push (GitHub Actions or Fly GitHub integration)
- [ ] Supabase connection via pooler URL (port 6543)
- [ ] Minimum 1 machine (scale to 0 on free tier if acceptable)

---

### S13-04: CI pipeline (GitHub Actions)

**As a** developer  
**I want** CI to run on every PR  
**So that** broken code doesn't merge

**Acceptance criteria:**
- [ ] `.github/workflows/ci.yml`:
  - Trigger: push to `v0.2.0`, PRs
  - Steps: install, lint, typecheck, test, build
  - Uses pnpm + turbo cache
- [ ] `.github/workflows/sync-games.yml` — from Sprint 06 (production URL)
- [ ] `.github/workflows/pick-reminders.yml` — from Sprint 10 (production URL)
- [ ] All cron workflows use production `API_URL` and `CRON_SECRET` from secrets
- [ ] CI badge in README (optional)

---

### S13-05: Database migrations in production

**As a** developer  
**I want** migrations to run safely in production  
**So that** schema changes deploy without data loss

**Acceptance criteria:**
- [ ] Migration script: `pnpm --filter db migrate` (Drizzle)
- [ ] Run migrations as part of API deploy (Fly release command) or manual step documented
- [ ] Seed script for production: sports + classifications only (no test data)
- [ ] Rollback strategy documented in README

---

### S13-06: Error monitoring & logging

**As a** developer  
**I want** error tracking in production  
**So that** I can diagnose issues quickly

**Acceptance criteria:**
- [ ] Structured JSON logging in API (pino or similar)
- [ ] Error tracking: Sentry (free tier) or similar — optional but recommended
- [ ] Frontend error boundary reports to same service
- [ ] No sensitive data (tokens, passwords) in logs

---

### S13-07: Performance & polish

**As a** user  
**I want** a fast, polished app  
**So that** the experience feels production-ready

**Acceptance criteria:**
- [ ] Lighthouse score: Performance > 80, Accessibility > 90
- [ ] Loading states on all data-fetching pages
- [ ] Empty states on all list pages
- [ ] Mobile responsive on all pages (test 375px width)
- [ ] Favicon and app meta tags (title, description, OG image)
- [ ] `robots.txt` and `sitemap.xml` for landing page SEO
- [ ] 404 page styled consistently

---

### S13-08: README & documentation

**As a** developer  
**I want** complete setup and deployment documentation  
**So that** the project is maintainable

**Acceptance criteria:**
- [ ] README.md:
  - Project overview
  - Tech stack summary
  - Local development setup (step by step)
  - Environment variables reference
  - Deployment instructions (Netlify + Fly.io)
  - Link to `docs/DECISIONS.md` and `plans/`
- [ ] `docs/DECISIONS.md` up to date
- [ ] API endpoint summary (can be in README or separate doc)

---

### S13-09: End-to-end smoke test

**As a** developer  
**I want** a manual smoke test checklist  
**So that** I can verify the full flow works in production

**Acceptance criteria:**
- [ ] Smoke test checklist in `docs/SMOKE_TEST.md`:
  1. Sign up with username
  2. Create league (FBS CFB)
  3. Copy invite link
  4. Sign up as second user from invite link
  5. Second user joins league
  6. Commissioner sets Week 1 slate (4+ games)
  7. Both users submit picks
  8. Verify picks lock after kickoff (or manual lock for testing)
  9. Score picks after game goes final
  10. Verify leaderboard
  11. Verify pick reminder email (manual cron trigger)
  12. Upgrade to Pro (Stripe test mode)
  13. Verify Pro limits lifted
- [ ] All steps pass in staging/production

---

### S13-10: Security review

**As a** developer  
**I want** basic security checks before launch  
**So that** the app isn't vulnerable to obvious attacks

**Acceptance criteria:**
- [ ] All API routes have appropriate auth (no unprotected mutations)
- [ ] `CRON_SECRET` is strong and not in code
- [ ] Clerk webhook signature verified
- [ ] SQL injection prevented (Drizzle parameterized queries)
- [ ] Rate limiting on auth-sensitive endpoints (Clerk handles sign-up; add on league create/join)
- [ ] CORS restricted to production domain
- [ ] No secrets in client bundle (only `VITE_*` public keys)
- [ ] HTTPS enforced (Netlify + Fly default)

---

## Sprint definition of done

- [ ] Web deployed to Netlify and accessible
- [ ] API + worker deployed to Fly.io and healthy
- [ ] CI pipeline green on all checks
- [ ] Cron workflows running against production
- [ ] Smoke test checklist passes
- [ ] README complete
- [ ] Security review complete
- [ ] All stories checked off

---

## Launch checklist

- [ ] Domain configured (or staging URL documented)
- [ ] Clerk production instance live
- [ ] Stripe live mode enabled (or test mode for beta launch)
- [ ] Resend domain verified
- [ ] Supabase production DB migrated and seeded
- [ ] GitHub Actions secrets set
- [ ] Error monitoring active
- [ ] Smoke test passes
- [ ] `docs/DECISIONS.md` reflects any last-minute changes
