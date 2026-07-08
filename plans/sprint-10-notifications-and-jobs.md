# Sprint 10 — Notifications & Background Jobs

**Goal:** Absurd SDK worker running durable tasks, Resend email templates, and pick reminder cron jobs.

**Depends on:** Sprint 08, Sprint 09  
**Blocks:** Sprint 11

---

## Stories

### S10-01: Absurd SDK worker setup

**As a** developer  
**I want** the Absurd worker running as a separate process  
**So that** background tasks execute durably

**Acceptance criteria:**
- [ ] `apps/worker` entry point with `absurd-sdk` initialized
- [ ] Connects to same Postgres as API (via `DATABASE_URL`)
- [ ] Absurd schema initialized in Postgres (migrations)
- [ ] Worker starts with `pnpm --filter worker dev` or `turbo dev`
- [ ] Docker image: same as API, `CMD` runs worker instead of API
- [ ] Health check: worker logs "ready" on startup
- [ ] API can `app.spawn()` tasks that worker picks up

---

### S10-02: Resend email package

**As a** developer  
**I want** email templates and send helpers in a shared package  
**So that** all emails are consistent and testable

**Acceptance criteria:**
- [ ] `packages/email` with Resend client
- [ ] `sendEmail({ to, subject, template, data })` helper
- [ ] Templates (React Email or HTML strings):
  - `pick-reminder-48h` — "You have unpicked games this week"
  - `pick-reminder-6h` — "Last chance — games start in 6 hours"
  - `slate-change` — "Games removed from this week's slate — please re-pick"
  - `waitlist-invite` — "A spot opened in {league} — join within 48 hours"
  - `commissioner-transfer` — "You've been asked to become commissioner of {league}"
  - `season-invite` — "A new season of {league} is starting — rejoin now"
- [ ] All emails use Callsheet branding (royal blue header, logo text)
- [ ] `EMAIL_FROM` env var (e.g., `noreply@callsheet.app`)
- [ ] `RESEND_API_KEY` in env

---

### S10-03: Pick reminder task

**As a** member  
**I want** email reminders when I haven't made picks  
**So that** I don't miss the deadline

**Acceptance criteria:**
- [ ] `pick-reminders` Absurd task (or cron endpoint triggers it)
- [ ] GitHub Actions cron: hourly (`POST /api/cron/pick-reminders`)
- [ ] Logic:
  1. Find all active leagues with slates for current/upcoming week
  2. For each member with unpicked games in slate:
     - If first unpicked game's kickoff is within 48h (±30min window) → send 48h reminder
     - If within 6h (±15min window) → send 6h reminder
  3. Check `notification_log` to prevent duplicate sends
  4. Log each send in `notification_log`
- [ ] Reminder includes: league name, week, count of unpicked games, link to picks page
- [ ] Does not send if all games in slate are picked

---

### S10-04: Slate change notification

**As a** member  
**I want** to be notified when games are removed from the slate  
**So that** I know to update my picks

**Acceptance criteria:**
- [ ] When commissioner removes games from slate (Sprint 07 PUT):
  - Delete affected picks
  - Spawn `notify-slate-change` Absurd task
- [ ] Task: email all members who had picks on removed games
- [ ] Email: list of removed games, link to picks page to re-pick
- [ ] In-app notification badge (optional — email is minimum)

---

### S10-05: Waitlist invite email

**As a** user on a waitlist  
**I want** an email when a spot opens  
**So that** I can join the league

**Acceptance criteria:**
- [ ] When waitlist advances (Sprint 05):
  - Send `waitlist-invite` email to next person
  - Email includes: league name, invite link with 48h expiry token
  - If not accepted in 48h → offer to next person (spawn follow-up task)
- [ ] `league_waitlist.invited_at` and `league_waitlist.expires_at` tracked

---

### S10-06: Notification log & dedup

**As a** system  
**I want** to track sent notifications  
**So that** users don't receive duplicate emails

**Acceptance criteria:**
- [ ] `notification_log` table: `user_id`, `league_id`, `type`, `reference_id`, `sent_at`
- [ ] Unique constraint prevents duplicate: `(user_id, league_id, type, reference_id)`
- [ ] `type` enum: `pick_reminder_48h`, `pick_reminder_6h`, `slate_change`, `waitlist_invite`, `commissioner_transfer`, `season_invite`
- [ ] `reference_id`: week number for reminders, game ID for slate changes, etc.

---

### S10-07: GitHub Actions cron workflows

**As a** system  
**I want** all cron jobs configured in GitHub Actions  
**So that** scheduled tasks run reliably

**Acceptance criteria:**
- [ ] `.github/workflows/pick-reminders.yml` — hourly cron
- [ ] `.github/workflows/sync-games.yml` — from Sprint 06 (verify still works)
- [ ] All workflows: `workflow_dispatch` for manual trigger
- [ ] All call API with `CRON_SECRET` header
- [ ] Failed runs logged; optional Slack/email alert on failure (nice to have)

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/cron/pick-reminders` | CRON_SECRET | Trigger pick reminders |
| POST | `/api/cron/score-picks` | CRON_SECRET | From Sprint 09 |

---

## Sprint definition of done

- [ ] Absurd worker runs and processes tasks
- [ ] 48h and 6h pick reminders sent correctly
- [ ] Slate change emails sent when games removed
- [ ] Waitlist invite emails sent when spots open
- [ ] No duplicate emails (dedup via notification_log)
- [ ] GitHub Actions cron workflows configured
- [ ] All stories checked off
