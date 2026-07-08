# Database migrations

## Naming convention

Use timestamp-prefixed directories for new migrations:

```
YYYYMMDDHHMMSS_description/migration.sql
```

Early bootstrap migrations (`0_init`, `1_absurd_init`, `2_sprint_11_*`) predate this convention and are kept as-is because they have already been applied.

## `1_absurd_init`

This migration vendors the [Absurd SDK](https://github.com/absurd-sdk/absurd) Postgres schema (~3k lines of SQL). It is checked in so `prisma migrate deploy` provisions workflow tables alongside app tables without a separate Absurd install step. The schema lives in its own namespace and is not modified by application code directly.
