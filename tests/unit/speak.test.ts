import { describe, expect, it } from 'vitest'

import { summarise } from '@/features/voice/speak'

describe('summarise', () => {
  it('reads back every group with correct plurals', () => {
    expect(summarise({ todo: 3, leaveAlone: 1, questions: 1 })).toBe(
      'Got it. 3 things to do, 1 to leave alone, and 1 question for you. Have a look and fix anything I got wrong.',
    )
  })

  it('leaves out empty groups', () => {
    expect(summarise({ todo: 1, leaveAlone: 0, questions: 0 })).toBe(
      'Got it. 1 thing to do. Have a look and fix anything I got wrong.',
    )
  })

  it('joins two groups with "and"', () => {
    expect(summarise({ todo: 2, leaveAlone: 0, questions: 2 })).toBe(
      'Got it. 2 things to do and 2 questions for you. Have a look and fix anything I got wrong.',
    )
  })
})
