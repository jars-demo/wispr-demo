import { describe, expect, it, vi } from 'vitest'

import { groundModelOutput, type RawModelItem } from '@/server/providers/structurer/grounding'
import {
  StructurerUnavailableError,
  type ModelStructurer,
} from '@/server/providers/structurer/types'
import { structureTranscript } from '@/server/specs/structure'

const TRANSCRIPT =
  'Add rate limiting to the login route. Don’t touch signup. Maybe log blocked attempts?'

const item = (overrides: Partial<RawModelItem>): RawModelItem => ({
  kind: 'requirement',
  text: 'Add rate limiting to the login route.',
  acceptance: null,
  source_quote: 'Add rate limiting to the login route',
  note: null,
  ...overrides,
})

describe('groundModelOutput', () => {
  it('keeps items whose quote appears in the transcript, ignoring case and punctuation', () => {
    const result = groundModelOutput(TRANSCRIPT, {
      title: 'Rate limiting',
      items: [
        item({}),
        item({
          kind: 'non_goal',
          text: 'Do not touch signup.',
          source_quote: "don't touch SIGNUP",
        }),
      ],
    })

    expect(result.items.map((i) => i.kind)).toEqual(['requirement', 'non_goal'])
    expect(result.droppedUngrounded).toBe(0)
  })

  it('drops invented items whose quote the user never said', () => {
    const result = groundModelOutput(TRANSCRIPT, {
      title: 'Rate limiting',
      items: [
        item({}),
        item({ text: 'Add CAPTCHA after 3 failures.', source_quote: 'add a captcha' }),
        item({ text: 'Use Redis.', source_quote: '' }),
      ],
    })

    expect(result.items).toHaveLength(1)
    expect(result.droppedUngrounded).toBe(2)
  })

  it('drops unknown kinds and empty text, and turns null fields into undefined', () => {
    const result = groundModelOutput(TRANSCRIPT, {
      title: '  ',
      items: [item({ kind: 'wish' }), item({ text: '   ' }), item({ acceptance: null })],
    })

    expect(result.droppedUngrounded).toBe(2)
    expect(result.items[0]?.acceptance).toBeUndefined()
    expect(result.title).toBe('Untitled receipt')
  })
})

describe('structureTranscript', () => {
  it('uses the rules engine when no model is configured', async () => {
    const result = await structureTranscript(TRANSCRIPT, null)

    expect(result.engine).toBe('rules')
    expect(result.notices).toEqual([])
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('uses the model and reports how many invented items were removed', async () => {
    const model: ModelStructurer = vi.fn().mockResolvedValue({
      title: 'Rate limiting',
      items: [{ kind: 'requirement', text: 'Add rate limiting.' }],
      droppedUngrounded: 2,
    })

    const result = await structureTranscript(TRANSCRIPT, model)

    expect(result.engine).toBe('model')
    expect(result.notices).toEqual([
      '2 suggested items were removed because they were not in what you said.',
    ])
  })

  it('falls back to rules and says so when the model is unavailable', async () => {
    const model: ModelStructurer = vi
      .fn()
      .mockRejectedValue(new StructurerUnavailableError('rate_limited'))

    const result = await structureTranscript(TRANSCRIPT, model)

    expect(result.engine).toBe('rules')
    expect(result.notices).toEqual([
      'AI structuring was unavailable, so the built-in rules were used.',
    ])
  })

  it('falls back to rules when the model returns no requirement at all', async () => {
    const model: ModelStructurer = vi
      .fn()
      .mockResolvedValue({ title: 'x', items: [], droppedUngrounded: 0 })

    expect((await structureTranscript(TRANSCRIPT, model)).engine).toBe('rules')
  })

  it('does not hide programmer errors behind the fallback', async () => {
    const model: ModelStructurer = vi.fn().mockRejectedValue(new TypeError('bug'))

    await expect(structureTranscript(TRANSCRIPT, model)).rejects.toThrow(TypeError)
  })
})
