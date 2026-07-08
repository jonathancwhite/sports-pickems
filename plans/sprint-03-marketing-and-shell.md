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
- [ ] `/` renders full marketing page (public, no auth required)
- [ ] Sections: Hero, How it works (3 steps), Features, CTA
- [ ] Hero headline + subheadline communicate pick'em league concept
- [ ] Primary CTA: "Get started" → `/sign-up`
- [ ] Secondary CTA: "Sign in" → `/sign-in`
- [ ] Royal blue accent on CTAs and highlights
- [ ] Responsive: mobile, tablet, desktop
- [ ] Dark and light mode both look good
- [ ] No authenticated app chrome (sidebar) on landing page

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
- [ ] Public layout component: header (logo + sign in/up), footer
- [ ] Callsheet logo/wordmark in header (text logo acceptable for now)
- [ ] Used by: `/`, `/sign-in`, `/sign-up`, `/invite/:code`
- [ ] Footer: copyright, links placeholder (Terms, Privacy — stub URLs ok)

---

### S03-03: Authenticated app shell

**As a** signed-in user  
**I want** a consistent app layout with sidebar navigation  
**So that** I can navigate between dashboard, leagues, and settings

**Acceptance criteria:**
- [ ] App layout component: sidebar + main content area + header
- [ ] Sidebar nav items: Dashboard, My Leagues, Browse Leagues, Settings
- [ ] Header: user avatar (Clerk UserButton), theme toggle
- [ ] Sidebar shows user's joined leagues (placeholder — populated in Sprint 04)
- [ ] Active route highlighted in sidebar
- [ ] Collapsible sidebar on mobile (hamburger menu)
- [ ] Used by all protected routes

---

### S03-04: Settings page shell

**As a** user  
**I want** a settings page for account and preferences  
**So that** I can manage my profile and theme

**Acceptance criteria:**
- [ ] `/settings` route with tabbed or sectioned layout
- [ ] Account section: displays username, email (read-only from Clerk)
- [ ] Preferences section: theme toggle (from Sprint 02)
- [ ] Billing section: placeholder "Coming soon" (populated in Sprint 12)
- [ ] Link to Clerk account management for password/email changes

---

### S03-05: 404 and error pages

**As a** user  
**I want** friendly error pages  
**So that** broken links don't show a blank screen

**Acceptance criteria:**
- [ ] 404 page with "Page not found" message and link to dashboard/home
- [ ] Error boundary on app layout catches render errors
- [ ] API error toast pattern established (shadcn Sonner or toast)

---

### S03-06: Loading and empty states

**As a** user  
**I want** consistent loading spinners and empty state patterns  
**So that** the app feels polished during data fetches

**Acceptance criteria:**
- [ ] Reusable `<LoadingSpinner />` component
- [ ] Reusable `<EmptyState />` component (icon, title, description, CTA)
- [ ] TanStack Query `isLoading` / `isPending` patterns used consistently
- [ ] Skeleton loaders for list items (leagues list placeholder)

---

## Sprint definition of done

- [ ] Landing page live at `/` with royal blue branding
- [ ] Public and authenticated layouts working
- [ ] Sidebar navigation functional
- [ ] Settings page with theme toggle
- [ ] 404 page works
- [ ] Responsive on mobile
- [ ] All stories checked off
