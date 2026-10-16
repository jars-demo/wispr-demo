import { describe, expect, it } from 'vitest'

import { parseDiff } from '@/domain/check/diff'
import { runCheck } from '@/domain/check/engine'
import { buildDigest, mergeModelVerdicts, type ModelVerdict } from '@/domain/check/model-mapping'
import { SAMPLE_DIFF, SAMPLE_REQUEST } from '@/domain/check/sample'
import { assignCodes } from '@/domain/spec'
import { structureWithRules } from '@/domain/structure-rules'

const items = assignCodes(structureWithRules(SAMPLE_REQUEST).items)
const rules = runCheck({ items, diff: SAMPLE_DIFF })
const { text, hunks } = buildDigest(parseDiff(SAMPLE_DIFF))

const merge = (verdicts: ModelVerdict[]) => mergeModelVerdicts(rules, items, verdicts, hunks)

describe('buildDigest', () => {
  it('numbers hunks and lines, and leaves out skipped lockfiles', () => {
    expect(text).toContain('### H1 src/app/api/login/route.ts')
    expect(text).toContain('7:   if (!limiter.allow(ip)) {')
    expect(text).not.toContain('package-lock.json')
  })
})

describe('mergeModelVerdicts', () => {
  it('accepts a Found that quotes real lines, and cites them with line numbers', () => {
    const result = merge([
      {
        code: 'R1',
        verdict: 'evidence_found',
        reason: 'A limiter guards the login handler.',
        citations: [{ hunk: 'H1', quote: 'if (!limiter.allow(ip)) {' }],
      },
    ])
    const r1 = result.requirements.find((r) => r.code === 'R1')

    expect(result.engine).toBe('model')
    expect(r1?.verdict).toBe('evidence_found')
    expect(r1?.citations).toEqual([
      { file: 'src/app/api/login/route.ts', lines: 'L7', quote: 'if (!limiter.allow(ip)) {' },
    ])
  })

  it('downgrades a Found with invented lines to Can’t tell', () => {
    const result = merge([
      {
        code: 'R1',
        verdict: 'evidence_found',
        reason: 'Trust me.',
        citations: [{ hunk: 'H1', quote: 'rateLimit.enforceEverywhere()' }],
      },
    ])
    expect(result.requirements.find((r) => r.code === 'R1')?.verdict).toBe('unverifiable')
  })

  it('downgrades a Found that cites a hunk that does not exist', () => {
    const result = merge([
      {
        code: 'R1',
        verdict: 'evidence_found',
        reason: 'x',
        citations: [{ hunk: 'H99', quote: 'if (!limiter.allow(ip)) {' }],
      },
    ])
    expect(result.requirements.find((r) => r.code === 'R1')?.verdict).toBe('unverifiable')
  })

  it('never lets the model overrule the hard test-file evidence', () => {
    const tests = rules.requirements.find((r) => /tests/i.test(r.text))
    const result = merge([
      {
        code: tests?.code ?? 'R2',
        verdict: 'evidence_found',
        reason: 'Tests were added.',
        citations: [{ hunk: 'H1', quote: 'if (!limiter.allow(ip)) {' }],
      },
    ])
    expect(result.requirements.find((r) => r.code === tests?.code)?.verdict).toBe('not_found')
  })

  it('accepts Missing without lines and recounts the summary', () => {
    const result = merge([
      { code: 'R1', verdict: 'not_found', reason: 'Not there.', citations: [] },
    ])
    expect(result.summary).toMatchObject({ found: 0, missing: 2, total: 2 })
  })

  it('keeps the rules verdict for codes the model skipped or invented', () => {
    const result = merge([{ code: 'R42', verdict: 'evidence_found', reason: 'x', citations: [] }])
    expect(result.requirements).toEqual(rules.requirements)
  })
})
