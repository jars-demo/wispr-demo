# Receipts

Say what you want. Get proof your coding agent did it.

Receipts turns a spoken (or typed) request into a short checklist, then checks your coding
agent's work against it using whatever evidence you have: a GitHub pull request or compare link,
pasted `git diff`, the agent's own summary, or pasted test output. Each item comes back Found,
Partly, Missing, Off-limits or Can't tell, with the lines that support it, and each claim the
agent made is checked against that evidence.

Built solo for No Hands: The Wispr Challenge (WeMakeDevs x Wispr Flow, October 2026), Builders
track.

## Status

| Milestone | Scope                                                             | State   |
| --------- | ----------------------------------------------------------------- | ------- |
| M1        | Foundation, config, CI, design system, design preview             | Done    |
| M2        | Checklists: dictate, organise, review, save, edit, export, delete | Done    |
| M3        | Check engine: evidence adapters, rule checks, cited mapping, eval | Next    |
| M4        | Result UI, feedback, sharing, re-check, PWA                       | Planned |
| M5 to M8  | Beta, hardening, deploy, submission                               | Planned |

What works today:

- `/new`: speak (browser speech), dictate with Wispr Flow or any dictation app, or type a request.
  Receipts organises it into requirements, things to leave alone and open questions, each with the
  words it came from. You review and edit before anything is saved.
- `/specs` and `/specs/:id`: your saved checklists. Copy a ready-made prompt for your agent or
  Markdown for an issue, edit (each save is a new version), or delete.
- No sign-up. Checklists belong to your browser through a signed, HttpOnly cookie.

Checking the agent's work (M3) is not built yet, and the interface says so.

## Requirements

- Node.js 22.13 or newer on the 22.x line (see `.nvmrc`)
- npm (the lockfile is `package-lock.json`)

Nothing else. Locally the database is PGlite, a real PostgreSQL that runs inside the Node
process and stores its files in `.data/pglite`.

## Setup

```bash
npm ci
cp .env.example .env.local
# Put a random value of at least 32 characters in SESSION_SECRET, for example:
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
npm run dev
```

Open http://localhost:3000. The database and its tables are created on the first request.

To start over with an empty local database, stop the server and delete `.data/`.

## Commands

| Command                | What it does                                                  |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Development server with hot reload                            |
| `npm run build`        | Production build                                              |
| `npm start`            | Serve the production build (needs `DATABASE_URL`)             |
| `npm run lint`         | ESLint                                                        |
| `npm run typecheck`    | Generate route types, then `tsc --noEmit`                     |
| `npm run format:check` | Prettier check (`npm run format` writes)                      |
| `npm test`             | Unit tests and integration tests (real PostgreSQL via PGlite) |
| `npm run check`        | Lint, typecheck, format check and tests together              |

## Environment variables

All variables are read and validated in one place, `src/server/config.ts`. The server refuses to
start when one is missing or invalid, and the error names the variable without echoing its value.

| Variable            | Required               | Kind   | Purpose                                                     |
| ------------------- | ---------------------- | ------ | ----------------------------------------------------------- |
| `SESSION_SECRET`    | Yes                    | Secret | Signs the anonymous owner cookie (32+ characters)           |
| `DATABASE_URL`      | In production          | Secret | Hosted Postgres. Empty locally to use PGlite                |
| `PGLITE_DIR`        | No (`.data/pglite`)    | Config | Where the local database lives                              |
| `ANTHROPIC_API_KEY` | No                     | Secret | Turns on organising with Claude. Without it, rules are used |
| `ANTHROPIC_MODEL`   | No (`claude-opus-5-5`) | Config | Claude model for organising                                 |
| `LOG_LEVEL`         | No (`info`)            | Config | `debug`, `info`, `warn` or `error`                          |

## How organising works

Two engines, described in [ADR 0006](docs/decisions/0006-structuring-engines.md):

- **Built-in rules** (always available): splits what you said into clauses. "Don't", "never" and
  "leave ... alone" become things to leave alone; "maybe" and questions become open questions,
  never requirements.
- **Claude** (when `ANTHROPIC_API_KEY` is set): better wording, then a grounding check drops any
  item whose quote is not in what you said, and tells you how many were dropped. If Claude is
  unavailable, the rules run and the page says so.

## Deployment

Planned target: Vercel (Hobby) with a hosted Postgres in `DATABASE_URL`. Not deployed yet. See
[docs/architecture.md](docs/architecture.md) and [docs/decisions/](docs/decisions/).

## Documentation

- [docs/architecture.md](docs/architecture.md): boundaries, components and data flow
- [docs/decisions/](docs/decisions/): architecture decision records
- [docs/CHANGELOG.md](docs/CHANGELOG.md): user-facing changes
- [AGENTS.md](AGENTS.md): instructions for coding agents working in this repository

## License

[MIT](LICENSE) © 2026 Jishanahmed AR Shaikh
