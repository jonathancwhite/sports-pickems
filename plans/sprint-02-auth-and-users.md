# Sprint 02 — Auth & Users

**Goal:** Clerk authentication end-to-end, user sync to Postgres, username requirement, and theme preferences.

**Depends on:** Sprint 01  
**Blocks:** Sprint 03+

---

## Stories

### S02-01: Clerk frontend integration

**As a** user  
**I want** to sign up and sign in with Clerk  
**So that** I have a secure account with a required username

**Acceptance criteria:**
- [x] `@clerk/clerk-react` installed in `apps/web`
- [x] `ClerkProvider` wraps app in root layout
- [x] `/sign-in` route renders Clerk `<SignIn />` component
- [x] `/sign-up` route renders Clerk `<SignUp />` component
- [x] Username required (configured in Clerk Dashboard + enforced in sign-up)
- [x] After sign-up/sign-in, redirect to `/dashboard`
- [x] `<UserButton />` in app header for signed-in users
- [x] Sign-out clears session and redirects to `/`

**Technical notes:**
- Clerk Dashboard: enable username, set as required field
- `VITE_CLERK_PUBLISHABLE_KEY` in web env
- Customize Clerk appearance: royal blue primary color

---

### S02-02: Clerk API middleware

**As a** developer  
**I want** Express to verify Clerk JWTs on protected routes  
**So that** API endpoints are secured

**Acceptance criteria:**
- [x] `@clerk/express` middleware on all `/api/*` routes except public allowlist
- [x] Public allowlist: `/api/health`, `/api/webhooks/*`, `/api/cron/*`, `GET /api/leagues/invite/:code`
- [x] Authenticated requests attach `req.auth.userId` (Clerk ID)
- [x] Unauthenticated requests to protected routes return 401
- [x] `CLERK_SECRET_KEY` in api env

---

### S02-03: Clerk webhook — user sync

**As a** system  
**I want** Clerk user events synced to Postgres  
**So that** leagues and picks reference stable internal user IDs

**Acceptance criteria:**
- [x] `POST /api/webhooks/clerk` endpoint with signature verification
- [x] Handles `user.created` → insert into `users` table
- [x] Handles `user.updated` → update `users` row
- [x] Handles `user.deleted` → soft-delete or mark inactive
- [x] Maps: `clerk_id`, `email`, `username`, `avatar_url`, `email_verified_at`
- [x] Creates `user_preferences` row on user creation (default theme: `system`)
- [x] Idempotent — duplicate webhook deliveries don't create duplicate rows
- [x] `CLERK_WEBHOOK_SECRET` in api env

---

### S02-04: Protected routes (frontend)

**As a** user  
**I want** dashboard and league pages to require authentication  
**So that** only signed-in users access the app

**Acceptance criteria:**
- [x] TanStack Router `beforeLoad` on protected route layout checks Clerk session
- [x] Unauthenticated users redirected to `/sign-in?redirect_url=...`
- [x] After sign-in, user returned to intended page
- [x] Protected layout: `/dashboard`, `/leagues/*`, `/settings`
- [x] Public layout: `/`, `/sign-in`, `/sign-up`, `/invite/:code`

---

### S02-05: Current user API

**As a** frontend app  
**I want** an endpoint to fetch the current user's profile  
**So that** I can display username, avatar, and preferences

**Acceptance criteria:**
- [x] `GET /api/users/me` returns user profile from Postgres (not Clerk API)
- [x] Response: `{ id, username, email, avatarUrl, preferences: { theme } }`
- [x] Returns 404 if webhook hasn't synced yet (with retry guidance)
- [x] TanStack Query hook `useCurrentUser()` in web app

---

### S02-06: Theme preference

**As a** user  
**I want** to toggle between light, dark, and system theme  
**So that** the app matches my preference

**Acceptance criteria:**
- [x] `PUT /api/users/me/preferences` accepts `{ theme: "light" | "dark" | "system" }`
- [x] Persists to `user_preferences` table
- [x] Theme toggle component in settings or header dropdown
- [x] Theme applied via `class="dark"` on `<html>` (shadcn pattern)
- [x] Optimistic update via TanStack Query mutation
- [x] Falls back to `localStorage` while loading

---

### S02-07: Dashboard placeholder

**As a** signed-in user  
**I want** a dashboard page that confirms I'm authenticated  
**So that** I have a landing point after sign-in

**Acceptance criteria:**
- [x] `/dashboard` renders authenticated layout with sidebar placeholder
- [x] Displays "Welcome, {username}"
- [x] Shows empty state: "No leagues yet — create or join one"
- [x] Links to `/leagues/new` and `/leagues` (browse)

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/clerk` | Signature | Sync users |
| GET | `/api/users/me` | Clerk JWT | Current user profile |
| PUT | `/api/users/me/preferences` | Clerk JWT | Update preferences |

---

## Sprint definition of done

- [x] Sign up with username → user row in Postgres
- [x] Sign in → dashboard accessible
- [x] Sign out → redirected to landing
- [x] Unauthenticated access to `/dashboard` → redirect to sign-in
- [x] Theme toggle persists across sessions
- [x] All stories checked off
