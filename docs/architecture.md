# Architecture

Status: M2 (checklists) built. Sections marked _planned_ describe the agreed design for later
milestones and are not built yet.

## System boundary

```text
Browser (web app, installable PWA later)
   |  HTTPS
Next.js app on Vercel
   |-- proxy                  src/proxy.ts             (issues the signed owner cookie)
   |-- pages and UI           src/app, src/components, src/features
   |-- route handlers         src/app/api/*            (withOwner: verify owner, validate, map errors)
   |-- use cases              src/server/specs         (repository, structure service)
   |-- domain rules           src/domain               (pure, unit tested)
   |-- config                 src/server/config.ts     (only env reader)
   |-- providers              src/server/providers     (Claude structurer + grounding; GitHub in M3)
   |
   |-- PostgreSQL             PGlite in .data/ locally, hosted via DATABASE_URL in production
   |-- Claude API             optional, server-side key, structured output, no tools
   |-- GitHub REST API        planned, M3, server-side token, public repositories only
```

## Core flows

1. **Checklist (M2, built).** The user dictates into a text area (Wispr Flow or any dictation
   tool), uses browser speech, or types. `POST /api/specs/structure` returns a draft from the
   rules engine or Claude (ADR 0006); nothing is stored. The user edits, then `POST /api/specs`
   saves version 1 idempotently. Edits `PUT` a new version with `expectedVersion` (409 on a stale
   tab). Exports (agent prompt, Markdown) are pure functions in `src/domain/spec-export.ts`.
2. **Check (M3, planned).** The user gives whatever evidence they have (ADR 0004): a public PR or compare
   link (fetched from GitHub with its changes and check runs), pasted `git diff`, the agent's
   summary, and pasted test output. Every input is normalised into one change set plus optional
   claims and test results, so GitHub is one adapter, not the core.
   - Deterministic rules settle claims first (test files changed, CI result on that commit or
     user-provided test output, docs changed, dependency manifests changed).
   - The diff is split into numbered hunks, excluding lockfiles, generated and minified files,
     and every skipped file is recorded.
   - The model maps requirements to hunks and must cite hunk ids and quote lines. The server
     checks each citation exists and matches the diff; a failed citation downgrades the verdict
     to Can't tell.
   - Results are cached by spec version, a hash of the normalised evidence and engine version.
3. **Result (M4, planned).** One answer per requirement with citations, claim checks, the evidence used
   with its provenance, the list of skipped files and per-answer feedback.

## Answer vocabulary

Defined in `src/domain/verdict.ts`, `src/domain/claim.ts` and `src/domain/evidence-source.ts`.
Internal keys stay precise; labels are plain words.

| Key                 | Label      | Meaning                                            |
| ------------------- | ---------- | -------------------------------------------------- |
| `evidence_found`    | Found      | Matching changes, with validated citations         |
| `partial`           | Partly     | Partly covered, or implemented without a test      |
| `not_found`         | Missing    | No matching change                                 |
| `violates_non_goal` | Off-limits | Something the user said to leave alone was changed |
| `unverifiable`      | Can't tell | Not enough evidence either way                     |

Claims are Backed up, Not true or Can't tell.

## Interaction and motion

- One primary (black) action per screen. Detail opens on request.
- Status badges open native popover sheets (`popover` attribute): light dismiss, Escape and
  focus return come from the browser, with no JavaScript of ours.
- Content rises in on load and on scroll (CSS scroll-driven animation where supported, plain
  visible content elsewhere). All motion stops under `prefers-reduced-motion`.

## Configuration

`src/server/config.ts` parses `process.env` with zod and freezes the result.
`src/instrumentation.ts` calls it at server start so a bad deploy fails before serving traffic.
Verified in M1: starting the production server without `SESSION_SECRET` fails with an error that
names the variable.

## Design system

Tokens live in `src/app/globals.css` (light brand default, dark palette behind
`data-theme="dark"`). `/design` renders measured contrast for every text pair, and
`tests/unit/design-tokens.test.ts` fails if the table drifts from the stylesheet or a pair drops
below WCAG AA.

## Security posture (current and planned)

- No secrets exist yet. Planned secrets stay server-side and are read only through the config
  module.
- PR text and diffs are treated as untrusted input to the model (prompt injection). Structured
  output, server-side citation checks and rule precedence limit what injected text can change.
- The health probe returns only `{"status":"ok"}` with `Cache-Control: no-store`.
