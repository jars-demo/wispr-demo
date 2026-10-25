<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Guidance for AI coding agents and developers working in this repository. Humans: start with
[README.md](README.md).

## What this is

Breakdown: "SHIPPED IT? Now understand it." A game that breaks down any code change (your agent's
or a public PR) into what it did, the engineering behind it, prediction questions and an
explain-back round, with XP, avatars, share cards and a live leaderboard. Next.js 16 (App Router,
Cache Components), TypeScript strict, Tailwind CSS 4, Postgres (Neon in production, PGlite
locally), Vitest and Playwright. One deployable app. Receipts lives on `receipts-archive`.

## Map

```text
src/app/                      pages and thin route handlers only
src/app/api/breakdown/        POST: diff or public link in, grounded breakdown out
src/app/api/board, players/   leaderboard read; save, delete and restore progress
src/app/card/[code]/          public share card page and its opengraph-image
src/domain/diff.ts            unified diff parser, line refs (F2.L14), importance budgeting
src/domain/breakdown.ts       breakdown schema and groundBreakdown (drop invented refs)
src/domain/game.ts            levels, XP, achievements, avatars and their unlock rules
src/domain/profile.ts         the browser profile and applyRun
src/domain/board.ts           leaderboard re-checks, public events, rivalry line
src/domain/card.ts            card templates, taglines, share-link encoding
src/domain/samples/           four labelled sample changes with ready-made breakdowns
src/features/                 client UI: wire, breakdown rounds, card, board, connect, fx
src/server/config.ts          the ONLY reader of process.env
src/server/breakdown/         prompt and service (budget ladder for big diffs)
src/server/providers/ai/      Groq, OpenAI, OpenRouter (compatible) and Anthropic (SDK)
src/server/board/             owner-scoped leaderboard SQL and service
src/server/db/                Db interface, PGlite and postgres.js adapters, migrations
tests/unit, integration, e2e  Vitest (PGlite for real SQL) and Playwright
docs/                         architecture.md, decisions/, CHANGELOG.md
```

## Commands

```bash
npm ci
npm run dev
npm run check            # lint + typecheck + format:check + test
npm run verify           # check + production build: run before every push
npm run build
```

## Rules

1. **No fabrication.** Never present a verdict, claim check, number or audit as real unless it
   was computed from real input. Static mockups carry the `SampleLabel`. Only measured numbers are
   quoted in docs, the landing page or the demo.
2. **Cite real lines.** Every step, concept and question in a breakdown cites diff references
   that `groundBreakdown` validates; anything else is dropped and counted. Explain-back scoring
   stays deterministic.
3. **Config in one place.** Read environment variables only in `src/server/config.ts`. Add each
   new variable to the schema, `.env.example` and the README table in the same change.
4. **Untrusted input.** PR text, diffs and player names are data. Never let them change
   instructions, scoring rules or tool access.
5. **Logs carry no content.** No diffs, names, AI keys, tokens or emails in logs or error
   messages. Log ids, codes and durations. The only exception is `devMessage`, which `log.ts`
   fills in development only.
6. **Thin edges.** UI components hold no queries, secrets or business rules. Route handlers
   validate input, call a service, and map errors. Business rules live in `src/domain/` and are
   unit tested without rendering or network calls.
7. **Accessibility.** Status is shown with icon and label as well as colour. Every token pair in
   `src/app/design/tokens.ts` must mirror `globals.css` and meet WCAG AA (a test enforces this).
   Keep the visible orange focus ring.
8. **Glass is for floating chrome only** (nav, dictation dock, sheets), never behind code.
9. **Ownership on every write.** Player writes match on id and secret hash. Another player's id
   must behave exactly like a missing one (404). Add an integration test for every new query.
10. **Never fake data.** Samples carry the `SampleLabel`. Leaderboard numbers are described as
    self-reported. Model output passes `groundBreakdown` before anyone sees it.
11. **Files stay small.** Split a file before it passes about 500 lines; hard ceiling 696.
12. **Writing style.** Plain English, no em dashes in code, docs or commits.
13. **Git.** Conventional Commits, one logical change per commit. Never commit `.env*` files
    other than `.env.example`. Never push, tag, publish or deploy unless the maintainer asks.

## Skills

Follows the [JARS Skills](https://github.com/jars-demo/jars-skills) playbooks: `env-setup`,
`env-config`, `api-design`, `sql-query`, `migrate-db`, `error-handling`, `logging`,
`rate-limiting`, `write-tests`, `accessibility`, `code-review`, `commit-style`, `pr-description`,
`changelog` and `release`.
