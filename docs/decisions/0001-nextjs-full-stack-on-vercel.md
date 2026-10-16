# 0001. One Next.js full-stack app, hosted on Vercel

Date: 2026-10-16. Status: accepted.

## Context

Solo builder, 14 days to the 30 October 2026 deadline, judges must open a public link without
signing up. The JARS reference demos split a Next.js frontend from a FastAPI backend and ship with
Docker, because they target offline and workshop deployments. Receipts has neither constraint.

## Decision

- One Next.js 16 App Router app (TypeScript strict, Tailwind 4) with route handlers as the API.
- Hosted on Vercel Hobby. Database: managed Postgres, chosen in M2.
- npm with a committed lockfile, Node 22 (`.nvmrc`), matching the JARS demos.
- Vitest for unit tests; Playwright added when the first end-to-end journey exists.
- Kept the scaffold's Cache Components and Partial Prefetching defaults.

## Consequences

- One deploy, one language, one test stack. Preview deploys and rollback come with the host.
- Vercel function duration limits bound how long one audit can run in a request. Verified in M3
  before relying on it; the fallback is a background job.
- Hobby is for non-commercial use. A commercial launch needs a paid plan or another host.

## Rejected

- Separate frontend and backend: two deploys, CORS and two toolchains for no benefit here.
- Docker on a VPS: TLS, patching and uptime become our job.
