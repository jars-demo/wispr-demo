# 0003: Breakdown replaces Receipts

Date: 2026-10-25. Status: accepted.

## Context

Receipts (speak a spec, check the agent's pull request against it) overlapped with an entry that
had already won the challenge. Developers ship faster with agents but often cannot explain what
was shipped. That gap is the new focus.

## Decision

Rewrite the app in place as Breakdown: a game that breaks down any change into what the agent
did, the engineering behind it, prediction questions and an explain-back round. Keep the theme,
the Next.js and Postgres foundations, the browser-only GitHub token and the "cite real lines or
drop it" grounding rule. Receipts stays available on the `receipts-archive` branch.

Choices made with it:

- **Explain-back is scored without AI**, by matching the breakdown's key-point keywords. It is
  instant, free and shows exactly what was heard.
- **No accounts.** Saving uses a random id plus a secret held by the browser and its restore link.
- **Share cards are templates, not generated images.** The numbers ride in the link.
- **Bring your own key** for Groq, OpenAI, Anthropic or OpenRouter, passed per request and never
  stored.
- **Big changes** are budgeted by importance with automatic retries at smaller sizes, and the
  rest can be broken down file by file.

## Consequences

The leaderboard is self-reported and only rule-checked, which is acceptable for a game and is
stated in the UI. Live feed alerts only work while the page is open.
