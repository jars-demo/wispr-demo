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
4. For a public link, the server first looks in `breakdown_cache`. A hit returns at once, marked
   `X-Breakdown-Cache: hit`, and costs nothing against the free limit. Otherwise it fetches
   `github.com/<repo>/<pull|commit|compare>.diff` itself.
5. The shared key allows `BREAKDOWNS_PER_HOUR` (default 2) per visitor; an own key allows 120.
   The hit is taken just before the model call and refunded if the breakdown fails, so errors
   never cost a free breakdown. `GET /api/breakdown` reports the quota without spending it.
6. `src/domain/diff.ts` parses the diff, tags every line (`F2.L14`) and picks what fits the
   budget: source before tests before docs, bigger changes first.
7. The model (shared Groq key, or the player's own key from request headers) returns JSON in a
   fixed schema. `groundBreakdown` keeps only parts that cite real lines.
8. If the provider says the request is too large, the service retries with smaller budgets.
9. Link results are written to `breakdown_cache`: 30 days for a commit, 6 hours for a pull
   request or compare. The browser also keeps the result in localStorage and plays the rounds.

**Scoring and saving**

- XP, levels, achievements and avatar unlocks are pure functions in `src/domain/game.ts` and
  `src/domain/profile.ts`, applied in the browser.
- Names are unique across players, ignoring case (a unique index on `lower(name)`). The name
  field checks `GET /api/players/name` as you type; a race still ends in a 409 `name_taken`.
- Saving creates a random player id and secret in the browser. `POST /api/players` stores the
  numbers (re-checked by `checkSync`), the profile JSON for restore links, and public events
  derived from what changed. Writes match on id and secret hash; another player's id behaves like
  a missing one.
- `GET /api/board` returns the top 25, the caller's rank and rival, and recent events. The browser
  polls it every 20 seconds while visible and raises "X just overtook you" when the rank drops.

**Share cards**

`CardArt` is one inline-styled component used both on the page and by
`/card/[code]/opengraph-image` (next/og). The card's numbers travel in the link (`encodeCard`), so
cards need no database. Avatars are static SVGs drawn once by `scripts/avatars.mjs`; the share
image reads them as data URIs and loads committed fonts, so it fetches nothing at render time.
Card links always use `SITE_URL` (wispr.jishanahmed.in), never the current host. When a
breakdown ends, `CardModal` shows the card with a Post on X button; the post text lives in
`shareText` and credits @jishanarshaikh and @WisprFlow.

## Layers

| Layer       | Where           | Rule                                             |
| ----------- | --------------- | ------------------------------------------------ |
| Domain      | `src/domain/`   | Pure TypeScript, no I/O, unit tested             |
| Server      | `src/server/`   | Config, database, providers, services            |
| Routes      | `src/app/api/`  | Validate input, call a service, map errors       |
| UI features | `src/features/` | Client components; no secrets, no business rules |
| Pages       | `src/app/`      | Thin shells that compose features                |

## Data

Tables (`src/server/db/migrations.ts`, applied in order on the first request): `players` (with a
unique index on `lower(name)`), `player_events`, `rate_limits` and `breakdown_cache`. Migration
`b0002_drop_receipts` drops Receipts' archived tables (`specs`, `spec_versions`, `spec_items`,
`checks`) from the shared Neon database and keeps everything Breakdown uses.

Logs carry ids, codes, counts and durations only: never diffs, names, keys or tokens.
