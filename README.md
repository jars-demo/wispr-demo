# Breakdown

**SHIPPED IT? Now understand it.**

Coding agents ship code in minutes. Breakdown turns each change they ship into a three minute
game, so you understand what the agent did and the engineering behind it, instead of merging code
you could not explain.

Live at [wispr.jishanahmed.in](https://wispr.jishanahmed.in). Built for No Hands: The Wispr
Challenge (WeMakeDevs and Wispr Flow, October 2026). Independent entry, not an official Wispr
product.

## How it works

1. **The wire.** A news-style feed of recent pull requests and commits. Without GitHub it plays a
   clearly labelled sample wire. Plug in GitHub once (a read-only token kept in your browser) to
   see what you and your agents shipped. Or paste any public PR, commit or compare link, or a raw
   diff, into the search bar.
2. **Break it down.** Five rounds:
   - **Replay**: what the agent did, step by step, with the exact lines lighting up.
   - **Engineering**: two or three concept cards (for example "idempotency") you flip to unlock.
   - **Predict**: questions about how this exact code behaves. Every answer shows the real lines.
   - **Explain it back**: say it in your own words. With Wispr Flow you just talk. Key ideas
     light up as you cover them. Scored by keyword matching, not by AI.
   - **Score**: XP, levels, achievements and avatar unlocks.
3. **Drill down.** Tap any line to see where it is explained, or break down one file on its own.
   Big pull requests are covered most important files first; the rest are listed for file-by-file
   rounds.
4. **Show it.** Your card (10 avatars, 2 free and 8 to unlock, 3 templates, 5 taglines) posts to
   X or LinkedIn with a share image. Pick a name to save progress and join the live leaderboard,
   which tells you when someone overtakes you. No sign-up, no email.

## Honesty rules

- Every step, concept and question must cite real lines of the diff. The server checks each
  reference and drops anything invented; if nothing grounded is left, the breakdown is refused.
- Sample changes and the sample wire are labelled as samples everywhere.
- Leaderboard numbers are self-reported by each browser and re-checked against the game rules.
  It is a game, not a certificate.
- The GitHub token is only sent to api.github.com. A player's own AI key is sent with each
  breakdown request and used for that one call; neither is stored or logged.

## Run it

Needs Node 22.13 or later.

```bash
npm ci
cp .env.example .env.local   # add GROQ_API_KEY for live breakdowns
npm run dev                  # http://localhost:3000
```

Without any keys the four sample breakdowns, the card and a local leaderboard (embedded PGlite)
all work. Live breakdowns need `GROQ_API_KEY`, or a player's own key added in Settings.

```bash
npm run check      # lint, typecheck, format check, unit and integration tests
npm run test:e2e   # Playwright on desktop and phone sizes (starts the dev server)
npm run verify     # check plus a production build
```

## Configuration

Every variable is validated in `src/server/config.ts`; error messages name the variable, never its
value.

| Variable              | Required      | Purpose                                                         |
| --------------------- | ------------- | --------------------------------------------------------------- |
| `GROQ_API_KEY`        | No            | Shared AI for breakdowns. Without it, samples and own keys only |
| `GROQ_MODEL`          | No            | Default `openai/gpt-oss-120b`                                   |
| `BREAKDOWNS_PER_HOUR` | No            | Shared-key breakdowns per visitor per hour. Default 30          |
| `DATABASE_URL`        | In production | Hosted Postgres (Neon) for the leaderboard and saved progress   |
| `PGLITE_DIR`          | No            | Where local PGlite keeps data. Default `.data/pglite`           |
| `LOG_LEVEL`           | No            | `debug`, `info`, `warn` or `error`. Default `info`              |

Players can bring their own Groq, OpenAI, Anthropic or OpenRouter key in Settings. With their own
key a breakdown covers up to 3,000 changed lines at once and the hourly limit rises.

## Architecture

Next.js 16 (App Router, Cache Components), TypeScript strict, Tailwind CSS 4, Postgres through
postgres.js (Neon) or PGlite locally, Vitest and Playwright. See
[docs/architecture.md](docs/architecture.md) and [AGENTS.md](AGENTS.md).

## Known limits

- Live GitHub alerts only update while the page is open; there is no server holding your token.
- The free shared model has small request limits, so very large changes are split by importance
  and the remaining files are broken down one at a time.
- The share link carries the card's numbers, so anyone can make a card with any numbers. The
  leaderboard re-checks numbers against the game rules but cannot prove them.
- GitLab and Bitbucket are not connected yet.

## License

MIT
