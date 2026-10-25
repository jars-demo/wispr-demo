import { describe, expect, it } from 'vitest'

import { BreakdownError, createBreakdown } from '@/server/breakdown/service'
import { ModelUnavailableError, type JsonModel } from '@/server/providers/ai/types'

// A big change never fails on the first "too large": the service retries with smaller parts.

const bigDiff = Array.from({ length: 6 }, (_, f) => {
  const body = Array.from(
    { length: 300 },
    (_, i) => `+export const v${f}_${i} = ${i} // ${'.'.repeat(60)}`,
  )
  return `diff --git a/src/f${f}.ts b/src/f${f}.ts\n--- /dev/null\n+++ b/src/f${f}.ts\n@@ -0,0 +1,300 @@\n${body.join('\n')}\n`
}).join('')

function tooLargeModel(sizes: number[]): JsonModel {
  return {
    provider: 'test',
    model: 'tiny',
    run: async (request) => {
      sizes.push(request.user.length)
      throw new ModelUnavailableError('too_large')
    },
  }
}

describe('breaking a big change down in smaller parts', () => {
  it('tries four ever smaller parts on the shared key before giving up', async () => {
    const sizes: number[] = []
    const run = createBreakdown(tooLargeModel(sizes), {
      diffText: bigDiff,
      title: 'Big change',
      only: null,
      ownKey: false,
      origin: 'theirs',
    })
    await expect(run).rejects.toBeInstanceOf(BreakdownError)
    expect(sizes).toHaveLength(4)
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThan(sizes[i - 1] ?? 0)
    // The smallest part fits even a tight free tier: a few thousand characters.
    expect(sizes.at(-1)).toBeLessThan(6_000)
  })
})
