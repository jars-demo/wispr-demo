# 0007. A deterministic check engine, and Wispr Flow as the only voice input

Date: 2026-10-17. Status: accepted.

## Context

Step 3 (checking the agent's work) must work with no API key and must never claim more than the
evidence shows. Separately, the app had its own browser speech-to-text, which failed on some
browsers and networks and duplicated what Wispr Flow already does in every text box.

## Decision

1. **Check engine** (`src/domain/check/`), pure and deterministic:
   - Parses unified diffs (pasted `git diff`, or a public GitHub pull request, compare or commit
     link fetched server-side with a fixed host, a validated path, a 15 s timeout and a 400 KB cap).
   - Requirements: test-related items are decided by whether test files changed; others by
     keyword overlap between the requirement and the added lines. A strong match is Found with
     cited lines, a weak match is Can't tell with the possible lines, no match is Missing. A
     missing "done when" condition downgrades Found to Partly.
   - Things to leave alone are violated when a changed file path matches them.
   - Claims in the agent's summary ("added tests", "tests pass", "updated docs", "no new
     dependencies", "didn't touch X") are judged by changed files and pasted test output only.
     "Tests pass" without test output is always Can't tell.
   - Only the result is stored (short quotes), never the pasted diff, summary or test output.
2. **No browser speech.** The microphone button and spoken read-back are removed. Wispr Flow types
   into whichever box has focus, so the interface only explains the Flow keys. The
   Permissions-Policy now denies the microphone.

## Consequences

- Keyword matching can be fooled by unrelated code that shares words, and misses work described
  with different words. The result page says "Found is evidence, not proof", every verdict shows
  its lines, and weak matches are Can't tell rather than Found. A model-based mapper with
  validated citations (ADR 0003) can replace the matcher later behind the same result shape.
- Users without Wispr Flow type, which works everywhere.
