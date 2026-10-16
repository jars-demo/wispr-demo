import type { ClaimStatus } from '@/domain/claim'
import type { EvidenceSourceKind } from '@/domain/evidence-source'
import type { VerdictKind } from '@/domain/verdict'

// Illustrative content for static mockups only. Every screen that shows it says so.
// Nothing here describes a real repository, session or check.

export const SAMPLE_TRANSCRIPT =
  'Add rate limiting to the login route, five attempts per minute per IP, and return a 429 ' +
  'with Retry-After. It should survive a restart. Do not touch the signup flow. Add tests. ' +
  'And maybe log the blocked attempts?'

export type SampleRequirement = {
  code: string
  text: string
  acceptance?: string
}

export const SAMPLE_SPEC = {
  title: 'Rate-limit the login endpoint',
  requirements: [
    {
      code: 'R1',
      text: 'Limit POST /api/login to 5 attempts per minute per IP address.',
      acceptance: 'A 6th attempt inside 60 seconds returns 429.',
    },
    {
      code: 'R2',
      text: 'Blocked responses include a Retry-After header.',
      acceptance: 'The header value is the seconds left in the window.',
    },
    { code: 'R3', text: 'Tests cover the limit and the window reset.' },
    { code: 'R4', text: 'Limiter state survives a server restart.' },
  ] satisfies SampleRequirement[],
  nonGoals: [{ code: 'N1', text: 'Do not change the signup flow.' }],
  openQuestions: [
    {
      code: 'Q1',
      text: 'Should blocked attempts be logged?',
      why: 'You said "maybe", so it was not turned into a requirement.',
    },
  ],
}

export type SampleVerdict = {
  code: string
  requirement: string
  verdict: VerdictKind
  reason: string
  citation?: { file: string; lines: string; quote: string }
}

export const SAMPLE_CHECK = {
  title: 'Rate-limit the login endpoint',
  sources: ['pasted_diff', 'agent_summary'] satisfies EvidenceSourceKind[],
  verdicts: [
    {
      code: 'R1',
      requirement: 'Limit POST /api/login to 5 attempts per minute per IP.',
      verdict: 'evidence_found',
      reason: 'A limiter keyed by client IP guards the login handler.',
      citation: {
        file: 'src/app/api/login/route.ts',
        lines: 'L14-L18',
        quote: 'if (!limiter.allow(ip)) return tooManyRequests(limiter.retryAfter(ip))',
      },
    },
    {
      code: 'R2',
      requirement: 'Blocked responses include a Retry-After header.',
      verdict: 'partial',
      reason: 'The header is set, but no test checks it.',
      citation: {
        file: 'src/server/http/responses.ts',
        lines: 'L31',
        quote: "headers: { 'Retry-After': String(seconds) }",
      },
    },
    {
      code: 'R3',
      requirement: 'Tests cover the limit and the window reset.',
      verdict: 'not_found',
      reason: 'None of the changed files are tests.',
    },
    {
      code: 'R4',
      requirement: 'Limiter state survives a server restart.',
      verdict: 'unverifiable',
      reason: 'Where the limiter stores state is set by config that is not in the changes.',
    },
  ] satisfies SampleVerdict[],
  claims: [
    {
      text: 'Added tests for the limiter.',
      status: 'contradicted',
      evidence: '0 of 3 changed files are tests.',
    },
    {
      text: 'All tests pass.',
      status: 'unverifiable',
      evidence: 'No test output was provided.',
    },
    {
      text: 'Signup is untouched.',
      status: 'supported',
      evidence: 'No signup files changed.',
    },
  ] satisfies { text: string; status: ClaimStatus; evidence: string }[],
}
