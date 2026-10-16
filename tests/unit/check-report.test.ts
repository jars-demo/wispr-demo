import { describe, expect, it } from 'vitest'

import { runCheck } from '@/domain/check/engine'
import { describeCheck, toFixPrompt } from '@/domain/check/report'
import { SAMPLE_DIFF, SAMPLE_REQUEST, SAMPLE_SUMMARY } from '@/domain/check/sample'
import { assignCodes } from '@/domain/spec'
import { structureWithRules } from '@/domain/structure-rules'

const items = assignCodes(structureWithRules(SAMPLE_REQUEST).items)
const result = runCheck({ items, diff: SAMPLE_DIFF, summary: SAMPLE_SUMMARY })

describe('describeCheck', () => {
  it('summarises the sample in one spoken line', () => {
    expect(describeCheck(result)).toBe('1 of 2 found, 1 missing, 1 claim is not true.')
  })
})

describe('toFixPrompt', () => {
  it('lists the missing item and the untrue claim', () => {
    const prompt = toFixPrompt('Rate limit login', result) ?? ''

    expect(prompt).toContain('- **R2** Add tests for the limit and the reset.')
    expect(prompt).toContain(
      'You said "Added tests for the limiter." but 0 of 2 changed files are tests.',
    )
    expect(prompt).toContain('Do not say tests pass unless you ran them.')
  })

  it('returns null when there is nothing to fix', () => {
    const clean = { ...result, requirements: [], claims: [], nonGoals: [] }
    expect(toFixPrompt('x', clean)).toBeNull()
  })
})
