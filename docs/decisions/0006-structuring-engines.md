# 0006. Two structuring engines: deterministic rules, and Claude with grounding

Date: 2026-10-16. Status: accepted.

## Context

Turning a spoken request into a checklist must work without any API key (local runs, judges,
outages) and must never add requirements the user did not say.

## Decision

1. **Rules engine** (`src/domain/structure-rules.ts`), always available and pure. It splits the
   transcript into clauses and classifies them: "don't", "never", "avoid", "leave ... alone" become
   things to leave alone; hedges ("maybe", "might") and questions become open questions with a
   note quoting the hedge; everything else actionable becomes a requirement. Every item keeps the
   exact clause it came from.
2. **Claude engine** (`src/server/providers/structurer/anthropic.ts`), on when
   `ANTHROPIC_API_KEY` is set. Model `claude-opus-5-5` by default (override with
   `ANTHROPIC_MODEL`), `effort: low`, schema-constrained output via `betaZodOutputFormat`, server
   fallback `fallbacks: "default"` for policy declines, 45 s timeout, 1 retry. The transcript is
   wrapped as data and the model has no tools.
3. **Grounding** (`grounding.ts`) runs on every model result: an item whose `source_quote` does not
   appear in the transcript (case and punctuation insensitive) is dropped, and the user is told
   how many were removed.
4. If the model is unavailable (rate limit, provider error, refusal, unparseable output, or no
   requirement returned), the rules engine runs and the user is told so. Programmer errors are
   not swallowed.
5. The engine used is stored with each version and shown in the interface.

## Consequences

- The product works fully offline from any AI provider. Model quality is an upgrade, not a
  dependency.
- Rules output reads more literally ("It respects the system setting by default."). The review
  step exists so the user fixes wording before saving.
- Per-request model cost is not measured yet; it is bounded by a limit of 30 structuring calls per
  owner per hour.
