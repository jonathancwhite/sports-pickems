# Infra 01 — Migrate ORM from Drizzle to Prisma

**Goal:** Replace Drizzle ORM with Prisma in `packages/db` to address security advisories and align with a maintained migration toolchain.

**Depends on:** Sprint 02 merged (auth + user queries)  
**Blocks:** Nothing critical — can run in parallel with Sprint 03+ if query surface stays small  
**Recommendation:** **Prisma** over Sequelize (see comparison below)

---

## Why a separate PR (not bundled with Sprint 02)

Sprint 02 adds Clerk auth and the first real query layer (`apps/api/src/services/users.ts`). An ORM swap at the same time would:

- Rewrite the entire `packages/db` package (15 tables, 12 Postgres enums, indexes, FKs)
- Replace the migration baseline and seed script
- Retest health checks, webhooks, and user API end-to-end
- Mix two unrelated concerns in one PR (auth feature + infrastructure pivot)

**Verdict:** Do this as **Infra 01**, merged after Sprint 02, before query-heavy sprints (leagues, picks, scoring).

---

## Vulnerability context

`pnpm audit` currently flags:

| Package | Severity | Issue | Fix |
|---------|----------|-------|-----|
| `drizzle-orm` <0.45.2 | High | SQL identifier escaping (GHSA-gpj5-g38j-94v9) | Upgrade to `>=0.45.2` **or** migrate off Drizzle |
| `drizzle-kit` → `esbuild` | Moderate | Dev-server request leak (GHSA-67mh-4wv8-2f99) | Resolved when Drizzle is removed |
| `@clerk/clerk-react` ≤5.61.5 | High | Auth bypass (GHSA-w24r-5266-9c3c) | Upgrade to `>=5.61.6` (unrelated to ORM) |

**Immediate mitigation (optional, tiny PR):** bump `drizzle-orm` to `^0.45.2` and `@clerk/clerk-react` to `^5.61.6` without changing ORMs. This buys time if Infra 01 is scheduled a sprint later.

---

## Prisma vs Sequelize

| Criterion | Prisma | Sequelize |
|-----------|--------|-----------|
| TypeScript ergonomics | Excellent generated client types | Weaker; decorators / manual typing |
| Postgres enums | Native `enum` in schema | Supported but clunkier |
| Migrations | `prisma migrate` + SQL review | `sequelize-cli` / Umzug |
| Monorepo fit | Common pattern (`packages/db` exports client) | Works, less common in greenfield TS |
| Learning curve for team | Moderate | Moderate–high (legacy patterns) |
| Raw SQL escape hatch | `$queryRaw` | `sequelize.query` |

**Decision:** Use **Prisma** — best match for this stack (TypeScript, Postgres enums, Turborepo, Zod at API boundary).

---

## Scope of changes

### `packages/db` (full rewrite)

| Current (Drizzle) | Target (Prisma) |
|-------------------|-----------------|
| `src/schema/tables.ts` + `enums.ts` | `prisma/schema.prisma` |
| `drizzle/` SQL migrations | `prisma/migrations/` |
| `drizzle.config.ts` | `prisma.config` / schema datasource block |
| `src/client.ts` (`getDb`, `drizzle()`) | `src/client.ts` (`PrismaClient` singleton) |
| `src/seed.ts` | `prisma/seed.ts` (registered in `package.json`) |
| `drizzle-orm`, `drizzle-kit`, `postgres` deps | `@prisma/client`, `prisma` devDep |

Keep the package name **`@callsheet/db`** so app imports stay stable at the package boundary (only internal implementation changes).

### `apps/api`

| File | Change |
|------|--------|
| `src/services/users.ts` | Rewrite Drizzle queries → Prisma (`findUnique`, `upsert`, `update`) |
| `package.json` | Remove direct `drizzle-orm` dependency |
| `src/routes/health.ts` | `checkDbConnection()` implementation swap |

### `apps/worker`

- No query code today — only update `@callsheet/db` import if exported helpers change.

### Docs & scripts

| File | Change |
|------|--------|
| `docs/DECISIONS.md` §3, §7 | ORM: Drizzle → Prisma |
| `package.json` (root) | `db:generate` → `db:migrate` / `prisma generate` scripts |
| `.env.example` | Add note: `DATABASE_URL_DIRECT` used for `prisma migrate` |
| `README.md` | Update DB setup commands |
| `plans/sprint-01-foundation.md` | Add footnote: superseded by Infra 01 for ORM tooling |

### Unchanged

- Postgres schema (tables, columns, enums, indexes) — same logical model
- Docker Compose / connection env vars
- API contracts (`GET /api/users/me`, webhooks, etc.)
- `@callsheet/shared` Zod schemas at the HTTP boundary

---

## Migration strategy

### 1. Baseline existing database

For environments that already ran Drizzle `0000_thin_exiles.sql`:

```bash
# After adding prisma/schema.prisma matching current DDL:
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/0_init/migration.sql

# Mark as applied without re-running DDL:
npx prisma migrate resolve --applied 0_init
```

For **fresh** databases: `prisma migrate deploy` applies the baseline normally.

### 2. Implement Prisma schema

Translate all models from `packages/db/src/schema/`:

- 15 tables: `sports`, `classifications`, `seasons`, `games`, `users`, `user_preferences`, `leagues`, `league_members`, `league_waitlist`, `league_week_slates`, `league_week_slate_games`, `picks`, `notification_log`, `league_boosts`
- 12 enums (map 1:1 to Postgres enums)
- All indexes and `@@unique` / `@@index` constraints
- `onDelete` cascade rules on relations

Use `@map` / `@@map` so Prisma field names stay camelCase while DB columns stay snake_case.

### 3. Replace client exports

```typescript
// packages/db/src/client.ts (target shape)
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function checkDbConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
```

Export `prisma` (or `getDb()` alias for minimal call-site churn during transition).

### 4. Rewrite query layer

**Example — current user lookup (Drizzle):**

```typescript
db.select(...).from(users).innerJoin(userPreferences, ...).where(and(eq(users.clerkId, clerkId), isNull(users.deletedAt)))
```

**Target (Prisma):**

```typescript
prisma.user.findFirst({
  where: { clerkId, deletedAt: null },
  include: { preferences: true },
});
```

**Example — webhook upsert:**

```typescript
prisma.user.upsert({
  where: { clerkId: data.id },
  create: { clerkId, email, username, preferences: { create: { theme: "system" } } },
  update: { email, username, avatarUrl, deletedAt: null },
});
```

### 5. Update Turborepo pipeline

```json
// packages/db/package.json scripts
"db:generate": "prisma generate",
"db:migrate": "prisma migrate deploy",
"db:migrate:dev": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts"
```

Add `prisma generate` to `build` (or `postinstall`) so `@prisma/client` is always generated in CI.

### 6. Delete Drizzle artifacts

- `packages/db/drizzle/`
- `packages/db/drizzle.config.ts`
- `packages/db/src/schema/` (replaced by Prisma schema)
- `drizzle-orm`, `drizzle-kit` from lockfile

---

## Verification checklist

- [ ] `pnpm install && pnpm build` — Prisma client generates, all packages compile
- [ ] `docker compose up -d` + `pnpm db:migrate` on empty DB
- [ ] `pnpm db:seed` — Football / NCAA FBS / current year season
- [ ] `GET /api/health` → `{ status: "ok", db: "connected" }`
- [ ] Clerk webhook `user.created` → row in `users` + `user_preferences`
- [ ] `GET /api/users/me` returns profile after sign-in
- [ ] `PUT /api/users/me/preferences` persists theme
- [ ] `pnpm audit` — no `drizzle-orm` / `drizzle-kit` paths
- [ ] Existing Drizzle-managed DBs: baseline migration resolves without DDL re-run

---

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Enum mapping mismatches | Generate migration SQL, diff against `0000_thin_exiles.sql` |
| `onConflictDoUpdate` semantics differ | Use Prisma `upsert` + explicit `update` blocks; test webhook idempotency |
| CI missing `prisma generate` | Add to `turbo.json` build dependsOn / postinstall |
| Supabase pooler vs direct URL | `DATABASE_URL` for runtime client; `DATABASE_URL_DIRECT` for migrations only (already documented) |
| Sprint 03+ adds Drizzle queries before Infra 01 lands | Rule: no new Drizzle query code after Sprint 02 merge; use Prisma in Infra 01 branch |

---

## Suggested branch & PR

```
Branch:  cursor/infra-01-prisma-migration-736a
Base:    master (after Sprint 02 PR #3 merges)
Title:   infra: migrate ORM from Drizzle to Prisma
```

### PR order

1. **Merge Sprint 02** (#3) — auth on Drizzle
2. **Optional quick patch** — bump `drizzle-orm@^0.45.2` + `@clerk/clerk-react@^5.61.6` if Infra 01 is delayed
3. **Infra 01** — full Prisma migration
4. **Sprint 03+** — continues on Prisma

---

## Effort estimate (technical, not calendar)

| Area | Touch surface |
|------|----------------|
| Prisma schema | ~330 lines (1:1 from Drizzle tables) |
| Client + seed | ~100 lines |
| API user service | ~140 lines rewrite |
| Docs / scripts / CI | ~10 files, small edits |
| Testing | Full auth + DB smoke path |

Low query surface today (one service file) makes this the **best time** to switch — before leagues, picks, and scoring add dozens of queries.

---

## Definition of done

- [ ] Drizzle fully removed from repo and lockfile
- [ ] Prisma schema matches existing Postgres DDL
- [ ] Migrations work on fresh and existing databases
- [ ] Seed script unchanged in behavior
- [ ] Sprint 02 auth flows pass on Prisma
- [ ] `docs/DECISIONS.md` updated
- [ ] `pnpm audit` clean of Drizzle-related advisories
