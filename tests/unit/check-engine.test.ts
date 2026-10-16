import { describe, expect, it } from 'vitest'

import { isTestFile, parseDiff } from '@/domain/check/diff'
import { checkClaims, runCheck } from '@/domain/check/engine'
import { SAMPLE_DIFF, SAMPLE_REQUEST, SAMPLE_SUMMARY } from '@/domain/check/sample'
import { assignCodes } from '@/domain/spec'
import { structureWithRules } from '@/domain/structure-rules'

const items = assignCodes(structureWithRules(SAMPLE_REQUEST).items)

describe('parseDiff', () => {
  it('reads files, statuses and new-file line numbers', () => {
    const files = parseDiff(SAMPLE_DIFF)
    const route = files.find((f) => f.path === 'src/app/api/login/route.ts')
    const firstAdd = route?.hunks[0]?.lines.find((l) => l.kind === 'add')

    expect(files.map((f) => f.path)).toEqual([
      'src/app/api/login/route.ts',
      'src/server/http/responses.ts',
      'package-lock.json',
    ])
    expect(firstAdd).toEqual({
      kind: 'add',
      text: "import { createRateLimiter } from '@/server/rate-limit'",
      line: 2,
    })
  })

  it('marks lockfiles as skipped and detects new files', () => {
    const files = parseDiff(
      SAMPLE_DIFF +
        'diff --git a/x.test.ts b/x.test.ts\nnew file mode 100644\n--- /dev/null\n+++ b/x.test.ts\n@@ -0,0 +1 @@\n+it()\n',
    )
    expect(files.find((f) => f.path === 'package-lock.json')?.skipped).toBe(true)
    expect(files.find((f) => f.path === 'x.test.ts')?.status).toBe('added')
  })

  it('returns nothing for text that is not a diff', () => {
    expect(parseDiff('hello world')).toEqual([])
  })

  it.each([
    ['src/a.test.ts', true],
    ['tests/e2e/flow.spec.ts', true],
    ['pkg/handler_test.go', true],
    ['src/latest.ts', false],
  ])('isTestFile(%s) is %s', (path, expected) => {
    expect(isTestFile(path)).toBe(expected)
  })
})

describe('runCheck on the sample', () => {
  const result = runCheck({ items, diff: SAMPLE_DIFF, summary: SAMPLE_SUMMARY })

  it('finds the rate limiting with cited, real lines', () => {
    const r1 = result.requirements.find((r) => r.code === 'R1')
    expect(r1?.verdict).toBe('evidence_found')
    expect(r1?.citations[0]?.file).toBe('src/app/api/login/route.ts')
    expect(SAMPLE_DIFF).toContain(r1?.citations[0]?.quote.split('\n')[0] ?? 'missing')
  })

  it('reports the missing tests', () => {
    const tests = result.requirements.find((r) => /tests/i.test(r.text))
    expect(tests?.verdict).toBe('not_found')
  })

  it('confirms signup was left alone', () => {
    expect(result.nonGoals[0]?.status).toBe('respected')
  })

  it('catches the false claims and leaves unprovable ones as can’t tell', () => {
    const byText = Object.fromEntries(result.claims.map((c) => [c.text, c.status]))
    expect(byText['Added tests for the limiter.']).toBe('contradicted')
    expect(byText['All tests pass.']).toBe('unverifiable')
    expect(byText["Didn't touch signup."]).toBe('supported')
  })

  it('skips lockfiles and counts the summary', () => {
    expect(result.skipped).toEqual(['package-lock.json'])
    expect(result.summary.total).toBe(result.requirements.length)
    expect(result.summary.missing).toBeGreaterThanOrEqual(1)
  })
})

describe('checkClaims', () => {
  const files = parseDiff(SAMPLE_DIFF)

  it('backs up "tests pass" only with passing test output', () => {
    expect(checkClaims('All tests pass.', files, ' 12 passed (12)')[0]?.status).toBe('supported')
    expect(checkClaims('All tests pass.', files, ' 2 failed | 10 passed')[0]?.status).toBe(
      'contradicted',
    )
  })

  it('flags a touched area the agent said it left alone', () => {
    expect(checkClaims("I didn't touch login.", files)[0]?.status).toBe('contradicted')
  })

  it('checks dependency claims against manifests', () => {
    expect(checkClaims('No new dependencies.', files)[0]?.status).toBe('supported')
  })

  it('ignores sentences that make no checkable claim', () => {
    expect(checkClaims('Hope this helps!', files)).toEqual([])
  })
})

describe('runCheck edge cases', () => {
  it('marks a change touching a non-goal as off-limits', () => {
    const diff =
      'diff --git a/src/app/signup/page.tsx b/src/app/signup/page.tsx\n--- a/src/app/signup/page.tsx\n+++ b/src/app/signup/page.tsx\n@@ -1,1 +1,2 @@\n x\n+y\n'
    const result = runCheck({ items, diff })
    expect(result.nonGoals[0]?.status).toBe('violated')
  })

  it('says missing for everything when the diff is empty', () => {
    const result = runCheck({ items, diff: '' })
    expect(result.requirements.every((r) => r.verdict === 'not_found')).toBe(true)
  })
})
