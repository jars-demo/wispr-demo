# 0005. Real Postgres everywhere, embedded locally, and anonymous signed owners

Date: 2026-10-16. Status: accepted.

## Context

The app must run locally with zero accounts or installs, and judges must use it without signing
up. It still needs real persistence, ownership and the same SQL in development and production.

## Decision

1. **One SQL dialect.** Parameterised PostgreSQL through a three-method `Db` interface
   (`query`, `exec`, `transaction`), with two adapters:
   - PGlite (PostgreSQL 18 compiled to WebAssembly) when `DATABASE_URL` is empty. Data lives in
     `PGLITE_DIR` (default `.data/pglite`, git-ignored). Tests use it in memory.
   - postgres.js when `DATABASE_URL` is set. Required in production (config refuses to start
     without it), because serverless hosts have no persistent disk.
2. **Migrations** are numbered TypeScript strings, applied on first connection in one
   transaction under `pg_advisory_xact_lock`. Forward-only and expand-only.
3. **Anonymous ownership.** The proxy gives each browser an HttpOnly, SameSite=Lax cookie holding a
   random 128-bit id plus an HMAC-SHA256 signature (`SESSION_SECRET`). Route handlers and pages
   verify it again; they never trust the proxy alone. Every query filters by owner, and another
   owner's data answers exactly like missing data (404).
4. **Idempotent create** on `(owner_id, client_id)`, and **optimistic versioning** on edit
   (`expectedVersion`, 409 on conflict). Each edit stores a new version, so later checks can
   reference the exact checklist they used.

## Consequences

- No sign-up, no install, and the integration tests run against real PostgreSQL.
- Checklists belong to a browser. Clearing cookies loses access to them. Sign-in and sharing
  come later.
- Under Suspense streaming, a missing or foreign checklist page returns HTTP 200 with the
  not-found screen and `noindex`, as Next.js documents for streamed `notFound()`. No content
  is sent.

## Rejected

- Docker Postgres for local development: an install step for every contributor and judge.
- An ORM: the SQL is small and explicit, and the JARS reference demos use plain SQL.
- Supabase or Clerk auth for M2: an account wall the challenge rules discourage.
