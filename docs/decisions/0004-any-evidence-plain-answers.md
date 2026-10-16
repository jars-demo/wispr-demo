# 0004. Check against any evidence the user has, and answer in plain words

Date: 2026-10-16. Status: accepted.

## Context

The first design assumed every check starts from a GitHub pull request with CI. Many people
work with agents locally (Claude Code, Cursor) and never open a PR for every change. The first
labels ("Evidence found", "Unverifiable") were accurate but read like a compliance tool.

## Decision

1. Evidence sources are a domain concept (`src/domain/evidence-source.ts`): GitHub pull request,
   branch or commit compare link, pasted changes (`git diff`), the agent's summary, and pasted
   test output. A check uses any combination.
2. Each source carries its provenance, shown to the user:
   - An agent summary is the set of claims to check, never evidence by itself.
   - Pasted test output is shown as provided by the user. Receipts does not re-run it.
   - Pasted changes are exactly what was pasted. Receipts cannot see the user's machine.
3. Answers use plain words: Found, Partly, Missing, Off-limits, Can't tell. Claims are Backed up,
   Not true or Can't tell. The meaning of each opens in a sheet on tap.
4. A unit test fails if product copy uses overclaiming words such as "verified" or "proven".

## Consequences

- The audit engine (M3) takes a normalised change set plus optional claims and test output, so
  GitHub becomes one adapter rather than the core.
- Without CI or pasted test output, "tests pass" is always Can't tell. That is intended.
- More inputs means more parsing to validate. Pasted text has size limits and is treated as
  untrusted input, like PR text.
