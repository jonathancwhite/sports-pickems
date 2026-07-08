# Sprint 03 — Marketing & App Shell

**Goal:** Polished marketing landing page and authenticated app shell (sidebar, header, layouts).

**Depends on:** Sprint 02  
**Blocks:** Sprint 04

---

## Stories

### S03-01: Marketing landing page

**As a** visitor  
**I want** a compelling landing page explaining Callsheet  
**So that** I understand the product and want to sign up

**Acceptance criteria:**
- [x] `/` renders full marketing page (public, no auth required)
- [x] Sections: Hero, How it works (3 steps), Features, CTA
- [x] Hero headline + subheadline communicate pick'em league concept
- [x] Primary CTA: "Get started" → `/sign-up`
- [x] Secondary CTA: "Sign in" → `/sign-in`
- [x] Royal blue accent on CTAs and highlights
- [x] Responsive: mobile, tablet, desktop
- [x] Dark and light mode both look good
- [x] No authenticated app chrome (sidebar) on landing page

**Content guidance:**
- Hero: "Pick games. Beat your friends."
- How it works: ① Create a league → ② Set the slate → ③ Make your picks
- Features: Commissioner controls, Discord-style invites, weekly leaderboards

---

### S03-02: Public layout

**As a** visitor  
**I want** a clean public layout with header and footer  
**So that** marketing and auth pages feel cohesive

**Acceptance criteria:**
- [x] Public layout component: header (logo + sign in/up), footer
- [x] Callsheet logo/wordmark in header (text logo acceptable for now)
- [x] Used by: `/`, `/sign-in`, `/sign-up`, `/invite/:code`
- [x] Footer: copyright, links placeholder (Terms, Privacy — stub URLs ok)

---

### S03-03: Authenticated app shell

**As a** signed-in user  
**I want** a consistent app layout with sidebar navigation  
**So that** I can navigate between dashboard, leagues, and settings

**Acceptance criteria:**
- [x] App layout component: sidebar + main content area + header
- [x] Sidebar nav items: Dashboard, My Leagues, Browse Leagues, Settings
- [x] Header: user avatar (Clerk UserButton), theme toggle
- [x] Sidebar shows user's joined leagues (placeholder — populated in Sprint 04)
- [x] Active route highlighted in sidebar
- [x] Collapsible sidebar on mobile (hamburger menu)
- [x] Used by all protected routes

---

### S03-04: Settings page shell

**As a** user  
**I want** a settings page for account and preferences  
**So that** I can manage my profile and theme

**Acceptance criteria:**
- [x] `/settings` route with tabbed or sectioned layout
- [x] Account section: displays username, email (read-only from Clerk)
- [x] Preferences section: theme toggle (from Sprint 02)
- [x] Billing section: placeholder "Coming soon" (populated in Sprint 12)
- [x] Link to Clerk account management for password/email changes

---

### S03-05: 404 and error pages

**As a** user  
**I want** friendly error pages  
**So that** broken links don't show a blank screen

**Acceptance criteria:**
- [x] 404 page with "Page not found" message and link to dashboard/home
- [x] Error boundary on app layout catches render errors
- [x] API error toast pattern established (shadcn Sonner or toast)

---

### S03-06: Loading and empty states

**As a** user  
**I want** consistent loading spinners and empty state patterns  
**So that** the app feels polished during data fetches

**Acceptance criteria:**
- [x] Reusable `<LoadingSpinner />` component
- [x] Reusable `<EmptyState />` component (icon, title, description, CTA)
- [x] TanStack Query `isLoading` / `isPending` patterns used consistently
- [x] Skeleton loaders for list items (leagues list placeholder)

---

## Sprint definition of done

- [x] Landing page live at `/` with royal blue branding
- [x] Public and authenticated layouts working
- [x] Sidebar navigation functional
- [x] Settings page with theme toggle
- [x] 404 page works
- [x] Responsive on mobile
- [x] All stories checked off
