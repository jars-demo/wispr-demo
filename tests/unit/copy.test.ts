import { describe, expect, it } from 'vitest'

import { CLAIM_COPY, CLAIM_STATUSES } from '@/domain/claim'
import { EVIDENCE_SOURCE_COPY, EVIDENCE_SOURCE_KINDS } from '@/domain/evidence-source'
import { VERDICT_COPY, VERDICT_KINDS } from '@/domain/verdict'

// Product copy must never promise more than evidence can show.
const OVERCLAIMING = /\b(verified|guaranteed?|proven|works correctly|100%|bug-free)\b/i

const allCopy = [
  ...VERDICT_KINDS.map((kind) => [kind, Object.values(VERDICT_COPY[kind]).join(' ')] as const),
  ...CLAIM_STATUSES.map((status) => [status, Object.values(CLAIM_COPY[status]).join(' ')] as const),
  ...EVIDENCE_SOURCE_KINDS.map(
    (kind) => [kind, Object.values(EVIDENCE_SOURCE_COPY[kind]).join(' ')] as const,
  ),
]

describe('product copy', () => {
  it.each(allCopy)('%s does not overclaim', (_key, text) => {
    expect(text).not.toMatch(OVERCLAIMING)
  })

  it('gives every verdict a distinct, short label', () => {
    const labels = VERDICT_KINDS.map((kind) => VERDICT_COPY[kind].label)
    expect(new Set(labels).size).toBe(labels.length)
    for (const label of labels) expect(label.length).toBeLessThanOrEqual(12)
  })

  it('never lets an agent summary count as evidence by itself', () => {
    expect(EVIDENCE_SOURCE_COPY.agent_summary.provenance).toMatch(/never treated as evidence/i)
  })

  it('marks pasted test output as provided by the user, not re-run', () => {
    expect(EVIDENCE_SOURCE_COPY.test_output.provenance).toMatch(/does not re-run/i)
  })
})
