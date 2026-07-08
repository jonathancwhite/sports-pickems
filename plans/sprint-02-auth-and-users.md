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
- [ ] `@clerk/clerk-react` installed in `apps/web`
- [ ] `ClerkProvider` wraps app in root layout
- [ ] `/sign-in` route renders Clerk `<SignIn />` component
- [ ] `/sign-up` route renders Clerk `<SignUp />` component
- [ ] Username required (configured in Clerk Dashboard + enforced in sign-up)
- [ ] After sign-up/sign-in, redirect to `/dashboard`
- [ ] `<UserButton />` in app header for signed-in users
- [ ] Sign-out clears session and redirects to `/`

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
- [ ] `@clerk/express` middleware on all `/api/*` routes except public allowlist
- [ ] Public allowlist: `/api/health`, `/api/webhooks/*`, `/api/cron/*`, `GET /api/leagues/invite/:code`
- [ ] Authenticated requests attach `req.auth.userId` (Clerk ID)
- [ ] Unauthenticated requests to protected routes return 401
- [ ] `CLERK_SECRET_KEY` in api env

---

### S02-03: Clerk webhook — user sync

**As a** system  
**I want** Clerk user events synced to Postgres  
**So that** leagues and picks reference stable internal user IDs

**Acceptance criteria:**
- [ ] `POST /api/webhooks/clerk` endpoint with signature verification
- [ ] Handles `user.created` → insert into `users` table
- [ ] Handles `user.updated` → update `users` row
- [ ] Handles `user.deleted` → soft-delete or mark inactive
- [ ] Maps: `clerk_id`, `email`, `username`, `avatar_url`, `email_verified_at`
- [ ] Creates `user_preferences` row on user creation (default theme: `system`)
- [ ] Idempotent — duplicate webhook deliveries don't create duplicate rows
- [ ] `CLERK_WEBHOOK_SECRET` in api env

---

### S02-04: Protected routes (frontend)

**As a** user  
**I want** dashboard and league pages to require authentication  
**So that** only signed-in users access the app

**Acceptance criteria:**
- [ ] TanStack Router `beforeLoad` on protected route layout checks Clerk session
- [ ] Unauthenticated users redirected to `/sign-in?redirect_url=...`
- [ ] After sign-in, user returned to intended page
- [ ] Protected layout: `/dashboard`, `/leagues/*`, `/settings`
- [ ] Public layout: `/`, `/sign-in`, `/sign-up`, `/invite/:code`

---

### S02-05: Current user API

**As a** frontend app  
**I want** an endpoint to fetch the current user's profile  
**So that** I can display username, avatar, and preferences

**Acceptance criteria:**
- [ ] `GET /api/users/me` returns user profile from Postgres (not Clerk API)
- [ ] Response: `{ id, username, email, avatarUrl, preferences: { theme } }`
- [ ] Returns 404 if webhook hasn't synced yet (with retry guidance)
- [ ] TanStack Query hook `useCurrentUser()` in web app

---

### S02-06: Theme preference

**As a** user  
**I want** to toggle between light, dark, and system theme  
**So that** the app matches my preference

**Acceptance criteria:**
- [ ] `PUT /api/users/me/preferences` accepts `{ theme: "light" | "dark" | "system" }`
- [ ] Persists to `user_preferences` table
- [ ] Theme toggle component in settings or header dropdown
- [ ] Theme applied via `class="dark"` on `<html>` (shadcn pattern)
- [ ] Optimistic update via TanStack Query mutation
- [ ] Falls back to `localStorage` while loading

---

### S02-07: Dashboard placeholder

**As a** signed-in user  
**I want** a dashboard page that confirms I'm authenticated  
**So that** I have a landing point after sign-in

**Acceptance criteria:**
- [ ] `/dashboard` renders authenticated layout with sidebar placeholder
- [ ] Displays "Welcome, {username}"
- [ ] Shows empty state: "No leagues yet — create or join one"
- [ ] Links to `/leagues/new` and `/leagues` (browse)

---

## API endpoints (this sprint)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/webhooks/clerk` | Signature | Sync users |
| GET | `/api/users/me` | Clerk JWT | Current user profile |
| PUT | `/api/users/me/preferences` | Clerk JWT | Update preferences |

---

## Sprint definition of done

- [ ] Sign up with username → user row in Postgres
- [ ] Sign in → dashboard accessible
- [ ] Sign out → redirected to landing
- [ ] Unauthenticated access to `/dashboard` → redirect to sign-in
- [ ] Theme toggle persists across sessions
- [ ] All stories checked off
