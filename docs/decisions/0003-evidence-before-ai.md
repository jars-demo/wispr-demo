# 0003. Deterministic evidence first, model output only with validated citations

Date: 2026-10-16. Status: accepted (implemented in M3). User-facing labels updated by ADR 0004.

## Context

The product's value is trust. A model that says "implemented" without proof repeats the problem
Receipts exists to catch. PR descriptions and diffs are attacker-controllable text.

## Decision

1. Claims about tests, CI, docs and dependencies are settled by rules over GitHub data (changed
   file paths, check runs on the exact head commit, manifest diffs). Rules override the model.
2. The model maps requirements to numbered diff hunks and must return hunk ids plus quoted lines,
   as structured output with no tools.
3. The server validates each citation: the hunk exists and the quote appears in it. Any failure
   downgrades the verdict to Unverifiable. The model can never upgrade a verdict without valid
   citations.
4. With no CI runs on the head commit, "tests pass" is Unverifiable, never Supported.
5. Oversized diffs produce a partial audit that lists every skipped file.
6. Copy says "Evidence found", never "Works" or "Verified".

## Consequences

Some true implementations will show as Unverifiable. That is the intended failure direction.
Accuracy is measured against hand-labelled pull requests before any number is published.
