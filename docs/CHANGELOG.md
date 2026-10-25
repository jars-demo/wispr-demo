# Changelog

All notable user-facing changes are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

Breakdown replaces Receipts (see docs/decisions/0003). Receipts lives on the `receipts-archive`
branch.

### Added

- The wire: a news-style feed of your recent GitHub pull requests and commits (token kept in the
  browser), or a labelled sample wire; plus a search bar for any public PR, commit, compare link
  or pasted diff.
- Breakdowns in five rounds: replay, engineering concept cards, predict-the-behaviour questions,
  explain it back (scored without AI, made for talking with Wispr Flow), and a score screen.
- Every breakdown cites real lines; invented references are removed and shown as a count.
- Big changes: most important files first, automatic smaller retries, and file-by-file rounds.
- XP, six levels, ten achievements and ten avatars (two free, eight to unlock).
- Player cards with three templates and five taglines, shared to X with an image. The card pops
  up when a breakdown ends, and the post credits @jishanarshaikh and @WisprFlow.
- Drawn avatars (DiceBear Notionists, CC0) and metal badge medallions instead of emoji.
- Unique player names, checked live as you type.
- 2 free AI breakdowns per hour on the shared key, with the count shown under the search bar.
  Failed breakdowns are refunded, and public links someone already broke down are cached and free.
- Clear error screens for each failure, with what to do next and when the limit resets.
- A new logo, a site share image, a podium and live feed on the leaderboard, a settings bento,
  and animated round transitions.
- Save without an account, restore links, and a live leaderboard with "just overtook you" alerts.
- Bring your own Groq, OpenAI, Anthropic or OpenRouter key.

- Make this breakdown public: an opt-in switch at the end of a public GitHub breakdown. Shared
  breakdowns appear on Learn from others and in the live feed, play free, and can be made
  private again from your card page.
- Names can change once every 180 days.

### Removed

- LinkedIn sharing. Cards post to X only.
- Receipts' database tables, dropped by migration `b0002_drop_receipts`.

## Receipts (archived)

### Changed

- Checklists are now called receipts everywhere you can see them, each with a status stamp: Ready
  to send, Sent to an agent, Done or N of M done. The flow is three steps: speak and send, check
  the work, done or not.

### Removed

- Browser speech input and spoken read-back. Voice is Wispr Flow, which types into any text box.

### Added

- One-tap sending by agent logo: Copilot and Claude on GitHub (with a token kept only in the
  browser), Claude Code and Codex CLI commands, a Cursor prompt link, and chat sites. GitHub sends
  are followed to the pull request and checked automatically.
- Optional Groq AI (gpt-oss-20b to organise, gpt-oss-120b to check). Every AI verdict must quote
  lines that exist in the diff, or it becomes Can't tell; test claims stay rule-based.
- Check the work: paste a diff or a public GitHub link, plus the agent's summary and test output,
  and get Found, Partly, Missing or Can't tell per item with cited lines, leave-alone checks, claim
  checks and a copyable fix-up prompt. Past checks are listed on each checklist.
- Receipt logo as favicon and home-screen icon; warm editorial design with hand-drawn doodles.
- Checklists: speak, dictate or type a request at `/new`, review the organised checklist
  (requirements, things to leave alone, open questions, each with the words it came from), then
  save. Edit creates a new version; delete asks once more. Copy as an agent prompt or Markdown.
- Your checklists at `/specs`, private to your browser, with no sign-up.
- Optional organising with Claude, with a grounding check that removes anything you did not say.
- Embedded PostgreSQL for local use, so the app runs with no install or account.
- Plain-language answers (Found, Partly, Missing, Off-limits, Can't tell) with a frosted sheet
  explaining each one on tap.
- Evidence sources beyond pull requests: compare links, pasted changes, agent summaries and test
  output, each labelled with what it can prove.
- Frosted glass material over soft ambient light, and gentle rise-in motion that respects
  reduced-motion settings.
- Landing page describing Receipts, with a clearly labelled sample check.
- Design preview at `/design`: colour tokens with measured contrast, type, controls, verdict
  badges, glass and static mockups of the checklist and check screens.
- `/api/health` liveness probe.
- Validated configuration that stops the server at start-up when a variable is missing.
