# Changelog

All notable user-facing changes are recorded here, following
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

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
