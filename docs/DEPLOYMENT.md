# Deployment runbook

End-to-end steps to take Callsheet from this repo to a live production
deployment. Web runs on **Netlify**, API + worker on **Fly.io**, database on
**Supabase Postgres**, auth/billing on **Clerk**, email on **Resend**, and cron
on **GitHub Actions**.

> After deploying, run [`docs/SMOKE_TEST.md`](./SMOKE_TEST.md) against the live
> environment. It is the single most important validation step — the full
> integrated flow (Clerk + ESPN + Resend + Stripe) has to be exercised once
> before real users arrive.

---

## Environment variables

Every variable, where it's consumed, and where to set it. Local values live in
`.env` (copy from `.env.example`); production values live in the host
dashboards below.

| Variable | Used by | Set in | Notes |
|----------|---------|--------|-------|
| `DATABASE_URL` | API, worker | Fly secrets | Supabase **pooler** URL (port 6543) in prod |
| `DATABASE_URL_DIRECT` | Migrations | Fly secrets | Supabase **direct** URL (port 5432) |
| `CLERK_SECRET_KEY` | API | Fly secrets | Clerk production secret key |
| `CLERK_PUBLISHABLE_KEY` | API | Fly secrets | Clerk production publishable key |
| `CLERK_WEBHOOK_SECRET` | API | Fly secrets | From Clerk → Webhooks endpoint |
| `CRON_SECRET` | API, GitHub Actions | Fly secrets + GH secrets | Strong random string, identical in both places |
| `RESEND_API_KEY` | API, worker | Fly secrets | Resend API key |
| `EMAIL_FROM` | API, worker | Fly secrets | Verified Resend sender (e.g. `noreply@callsheet.app`) |
| `WEB_URL` | API (CORS) | Fly secrets | The production Netlify URL — CORS rejects everything else |
| `PORT` | API | `fly.api.toml` | Already set to `3001` |
| `NODE_ENV` | All | Fly config | Already set to `production` |
| `VITE_API_URL` | Web | Netlify env | Fly API base URL |
| `VITE_CLERK_PUBLISHABLE_KEY` | Web | Netlify env | Clerk production publishable key |
| `VITE_APP_NAME` | Web | Netlify env | `Callsheet` |
| `VITE_APP_URL` | Web | Netlify env | The production Netlify URL |
| `API_URL` | GitHub Actions cron | GH secrets | Fly API base URL |

Only `VITE_*` variables are exposed to the browser. Never put a secret behind a
`VITE_` prefix.

---

## Phase 1 — Provision external services (parallelizable)

### Supabase (database)
1. Create a production project.
2. Copy the **transaction pooler** connection string (port 6543) → `DATABASE_URL`.
3. Copy the **direct** connection string (port 5432) → `DATABASE_URL_DIRECT`.

### Clerk (auth + billing)
1. Create a **production** instance (development keys do not work on a real domain).
2. Set **username = required** at sign-up.
3. Enable **Billing** and create two plans:
   - `free` — default for all users.
   - `pro` — features `unlimited_leagues`, `large_leagues`, `beta_sports`, `no_ads`.
4. Choose Stripe **test** vs **live** mode (test mode is fine for a beta launch).
5. Copy `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and the publishable key again
   for `VITE_CLERK_PUBLISHABLE_KEY`.
6. Create a webhook (finalize the URL in Phase 4) → subscribe to `user.*` and
   `subscription.*` → copy `CLERK_WEBHOOK_SECRET`.

### Resend (email)
1. Verify a sender domain (adds DNS records — allow time to propagate).
2. Copy `RESEND_API_KEY` and set `EMAIL_FROM`.

### Secrets
1. Generate `CRON_SECRET`: `openssl rand -hex 32`.

---

## Phase 2 — Deploy backend (Fly.io)

Config lives in `fly.api.toml`, `fly.worker.toml`, and the multi-stage
`Dockerfile` (targets `api` and `worker`).

```bash
fly apps create callsheet-api
fly apps create callsheet-worker

# Set on BOTH apps
fly secrets set -a callsheet-api \
  DATABASE_URL=... DATABASE_URL_DIRECT=... \
  CLERK_SECRET_KEY=... CLERK_PUBLISHABLE_KEY=... CLERK_WEBHOOK_SECRET=... \
  CRON_SECRET=... RESEND_API_KEY=... EMAIL_FROM=... WEB_URL=...
fly secrets set -a callsheet-worker \
  DATABASE_URL=... DATABASE_URL_DIRECT=... \
  RESEND_API_KEY=... EMAIL_FROM=...

fly deploy --config fly.api.toml      # release_command runs `pnpm db:migrate`
fly deploy --config fly.worker.toml
```

Then seed the production catalog (sports + classifications only, no test games):

```bash
pnpm --filter @callsheet/db db:seed:catalog
```

Verify: `GET https://callsheet-api.fly.dev/api/health` returns `200`.

---

## Phase 3 — Deploy frontend (Netlify)

Build config lives in `netlify.toml` (SPA redirect + security headers included).

1. Create a Netlify site from the repo.
2. Set env vars: `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`,
   `VITE_APP_NAME=Callsheet`, `VITE_APP_URL`.
3. Deploy and confirm the app loads.

---

## Phase 4 — Wire the services together

1. Point the Clerk webhook at the live API: `https://<api>/api/webhooks/clerk`.
2. Set Fly's `WEB_URL` secret to the real Netlify URL and redeploy the API so
   CORS matches.
3. Set GitHub Actions repository secrets: `API_URL` (Fly API) and `CRON_SECRET`
   (same value as Fly).

Cron workflows (`sync-games`, `pick-reminders`, `season-archive`,
`waitlist-expiry`) are scheduled and will begin running automatically once the
secrets above are present. They can also be triggered manually via
**Actions → Run workflow**.

---

## Phase 5 — Validate & launch

1. Run `docs/SMOKE_TEST.md` end-to-end against production.
2. Manually trigger each cron workflow once and confirm a 2xx response.
3. (Optional) Configure a custom domain in Netlify, Clerk, and Resend.

---

## Local webhook development (cloudflared)

Clerk pushes webhooks over the public internet, so `localhost:3001` is
unreachable and Clerk ships no CLI forwarder (there is no `clerk listen`
equivalent to `stripe listen`). Use a Cloudflare quick tunnel — free, no
account, no request cap.

See [`clerk-webhooks-local.html`](./clerk-webhooks-local.html) for the
click-by-click walkthrough. Short version:

```bash
# Install once (Windows, no admin required)
curl -L -o "$LOCALAPPDATA/cloudflared/cloudflared.exe" \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe
# macOS: brew install cloudflared

# Run alongside `pnpm dev`
cloudflared tunnel --url http://localhost:3001
```

The command prints a `https://<random>.trycloudflare.com` URL. In your Clerk
**development** instance → **Webhooks** → **Add Endpoint**:

1. URL = `https://<random>.trycloudflare.com/api/webhooks/clerk`
2. Subscribe to exactly the events the handler processes
   (`apps/api/src/routes/webhooks/clerk.ts`): `user.created`, `user.updated`,
   `user.deleted`, `subscription.created`, `subscription.updated`,
   `subscription.active`, `subscription.pastDue`, `subscriptionItem.canceled`,
   `subscriptionItem.ended`.
3. Copy that endpoint's signing secret (`whsec_…`) into `CLERK_WEBHOOK_SECRET`
   in your local `.env` and restart the API.

The quick-tunnel hostname is regenerated on every restart, so step 1 has to be
repeated each session. A named tunnel on a domain you own gives a stable URL if
that churn gets old.

> The webhook route is mounted with `express.raw()` **before** `express.json()`
> and before `clerkMiddleware()` (`apps/api/src/index.ts`). Signature
> verification needs the unparsed body — do not move it below the JSON parser.

---

## Database migrations

- Migrations run automatically on API deploy via the Fly `release_command`
  (`pnpm db:migrate`, which runs `prisma migrate deploy`).
- To run manually: `pnpm --filter @callsheet/db db:migrate`.
- **Rollback:** Prisma does not generate down migrations. Restore a Supabase
  snapshot, or write and apply a reverse migration with `prisma migrate deploy`.
  Never edit an already-applied migration file in place.

---

## Not yet configured (recommended before real users)

- **Error monitoring (Sentry).** Not wired up (`S13-06`). Requires a Sentry
  project + DSN, then API and frontend instrumentation.
- **DB-backed integration tests.** The current suite covers pure logic (scoring,
  ESPN parsing, cron auth, billing gating). The service layer (pick locking,
  waitlist advancement, slate rules, scoring orchestration) is only exercised by
  the manual smoke test; a CI Postgres service would let those run automatically.
- **Lighthouse targets** (`S13-07`, performance > 80 / accessibility > 90) not
  yet measured.
