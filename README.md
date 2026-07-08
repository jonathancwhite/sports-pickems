# Callsheet

Sports pick'em platform — create leagues, invite friends, compete to predict game winners.

> **v0.2.0** is a greenfield rebuild. The legacy PowerPicks codebase is preserved on the `feb-2024-refactor` branch.

## Documentation

| Doc | Description |
|-----|-------------|
| [Architecture & Decisions](docs/DECISIONS.md) | All product and technical decisions |
| [Sprint Plans](plans/README.md) | Build roadmap — 13 sprints with stories |

## Status

**Pre-implementation.** Sprint plans are complete. Implementation begins with Sprint 01.

## Stack (v0.2.0)

- **Web:** React 19, TypeScript, Vite, TanStack Router, TanStack Query, shadcn/ui (Base UI)
- **API:** Express, TypeScript, Clerk auth
- **Worker:** absurd-sdk (Postgres-native background jobs)
- **Database:** Supabase Postgres, Drizzle ORM
- **Email:** Resend
- **Deploy:** Netlify (web) + Fly.io (API/worker) + GitHub Actions (cron)

## Legacy

The `client/` and `server/` directories will be removed during Sprint 01. See `feb-2024-refactor` branch for the original MERN prototype.
