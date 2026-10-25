# Architecture

One Next.js 16 app on Vercel with a Neon Postgres database. Most of the game runs in the browser;
the server does three things: break down a diff with AI, keep the leaderboard, and render share
images.

## Request flows

**Breaking down a change**

1. The page reads what to break down from its URL: a sample, a public link, a GitHub PR or
   commit from the player's feed, or a pasted diff.
2. Samples never touch the server: the diff and its ready-made breakdown ship with the app.
3. For a player's own GitHub change, the browser fetches the diff from api.github.com with the
   token kept in localStorage, then posts only the diff to `POST /api/breakdown`.
4. For a public link, the server fetches `github.com/<repo>/<pull|commit|compare>.diff` itself.
5. `src/domain/diff.ts` parses the diff, tags every line (`F2.L14`) and picks what fits the
   budget: source before tests before docs, bigger changes first.
6. The model (shared Groq key, or the player's own key from request headers) returns JSON in a
   fixed schema. `groundBreakdown` keeps only parts that cite real lines.
7. If the provider says the request is too large, the service retries with smaller budgets.
8. The browser caches the result in localStorage and plays the rounds.

**Scoring and saving**

- XP, levels, achievements and avatar unlocks are pure functions in `src/domain/game.ts` and
  `src/domain/profile.ts`, applied in the browser.
- Saving creates a random player id and secret in the browser. `POST /api/players` stores the
  numbers (re-checked by `checkSync`), the profile JSON for restore links, and public events
  derived from what changed. Writes match on id and secret hash; another player's id behaves like
  a missing one.
- `GET /api/board` returns the top 25, the caller's rank and rival, and recent events. The browser
  polls it every 20 seconds while visible and raises "X just overtook you" when the rank drops.

**Share cards**

`CardArt` is one inline-styled component used both on the page and by
`/card/[code]/opengraph-image` (next/og). The card's numbers travel in the link (`encodeCard`), so
cards need no database and no image generation.

## Layers

| Layer       | Where           | Rule                                             |
| ----------- | --------------- | ------------------------------------------------ |
| Domain      | `src/domain/`   | Pure TypeScript, no I/O, unit tested             |
| Server      | `src/server/`   | Config, database, providers, services            |
| Routes      | `src/app/api/`  | Validate input, call a service, map errors       |
| UI features | `src/features/` | Client components; no secrets, no business rules |
| Pages       | `src/app/`      | Thin shells that compose features                |

## Data

Tables (`src/server/db/migrations.ts`): `players`, `player_events`, `rate_limits`. Receipts' old
tables may still exist in the same database and are untouched.

Logs carry ids, codes, counts and durations only: never diffs, names, keys or tokens.
