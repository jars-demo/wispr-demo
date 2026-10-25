import { describe, expect, it } from 'vitest'

import { groundBreakdown, UngroundedBreakdownError, type RawBreakdown } from '@/domain/breakdown'
import { lineIndex, parseDiff } from '@/domain/diff'
import { SAMPLES } from '@/domain/samples'

const DIFF = parseDiff(`diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1,2 +1,3 @@
 const a = 1
+const b = 2
 export { a }
`)

function raw(overrides: Partial<RawBreakdown> = {}): RawBreakdown {
  return {
    title: 'Add b',
    gist: 'Adds a constant.',
    kind: 'feature',
    difficulty: 'starter',
    steps: [{ title: 'Added b', detail: 'A new constant.', refs: ['F1.L2'] }],
    concepts: [
      {
        name: 'Constants',
        one_liner: 'x',
        explain: 'y',
        why_here: 'z',
        analogy: 'w',
        refs: ['F1.L2'],
      },
    ],
    quiz: [
      { question: 'Value of b?', options: ['1', '2'], answer: 1, why: 'It is 2.', refs: ['F1.L2'] },
    ],
    explain_back: { prompt: 'Explain', key_points: [{ point: 'b is 2', keywords: ['two', '2'] }] },
    explore: ['Const vs let'],
    ...overrides,
  }
}

describe('groundBreakdown', () => {
  it('keeps everything that points at real lines', () => {
    const { breakdown, dropped } = groundBreakdown(DIFF, raw())
    expect(dropped).toBe(0)
    expect(breakdown.steps).toHaveLength(1)
    expect(breakdown.quiz[0]?.answer).toBe(1)
  })

  it('drops invented references and anything left pointing at nothing', () => {
    const { breakdown, dropped } = groundBreakdown(
      DIFF,
      raw({
        steps: [
          { title: 'Real', detail: 'd', refs: ['F1.L2', 'F9.L1'] },
          { title: 'Invented', detail: 'd', refs: ['F1.L99'] },
        ],
      }),
    )
    expect(breakdown.steps.map((s) => s.title)).toEqual(['Real'])
    expect(breakdown.steps[0]?.refs).toEqual(['F1.L2'])
    expect(dropped).toBe(2)
  })

  it('drops questions whose answer is not one of the options', () => {
    const { breakdown } = groundBreakdown(
      DIFF,
      raw({ quiz: [{ question: 'q', options: ['a', 'b'], answer: 5, why: '', refs: ['F1.L2'] }] }),
    )
    expect(breakdown.quiz).toHaveLength(0)
  })

  it('refuses a breakdown with no grounded steps', () => {
    expect(() =>
      groundBreakdown(DIFF, raw({ steps: [{ title: 't', detail: 'd', refs: ['F2.L1'] }] })),
    ).toThrow(UngroundedBreakdownError)
  })

  it('normalises unknown kinds and difficulties instead of trusting them', () => {
    const { breakdown } = groundBreakdown(DIFF, raw({ kind: 'magic', difficulty: 'legendary' }))
    expect(breakdown.kind).toBe('feature')
    expect(breakdown.difficulty).toBe('intermediate')
  })
})

describe('sample breakdowns', () => {
  it.each(SAMPLES.map((s) => [s.id, s] as const))('%s cites only real lines', (_id, sample) => {
    const known = lineIndex(parseDiff(sample.diff))
    const b = sample.breakdown
    const refs = [...b.steps, ...b.concepts, ...b.quiz].flatMap((x) => x.refs)
    expect(refs.length).toBeGreaterThan(0)
    for (const ref of refs) expect(known.has(ref), ref).toBe(true)
    for (const q of b.quiz) {
      expect(q.answer).toBeGreaterThanOrEqual(0)
      expect(q.answer).toBeLessThan(q.options.length)
    }
    for (const k of b.explainBack.keyPoints) expect(k.keywords.length).toBeGreaterThan(0)
  })
})
