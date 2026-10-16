import { describe, expect, it } from 'vitest'

import { assignCodes, specDraftSchema, type SpecItemInput } from '@/domain/spec'
import { toAgentPrompt, toMarkdown } from '@/domain/spec-export'

const items: SpecItemInput[] = [
  { kind: 'requirement', text: 'Limit login attempts.', acceptance: 'A 6th try returns 429.' },
  { kind: 'non_goal', text: 'Do not change signup.' },
  { kind: 'requirement', text: 'Add tests.' },
  { kind: 'open_question', text: 'Log blocked attempts?' },
]

describe('assignCodes', () => {
  it('numbers each kind separately, in order', () => {
    expect(assignCodes(items).map((item) => item.code)).toEqual(['R1', 'N1', 'R2', 'Q1'])
  })

  it('records the original position', () => {
    expect(assignCodes(items).map((item) => item.position)).toEqual([0, 1, 2, 3])
  })
})

describe('specDraftSchema', () => {
  const draft = { title: 'Rate limit', transcript: 'x', engine: 'rules', items }

  it('accepts a valid draft and turns blank optional fields into undefined', () => {
    const parsed = specDraftSchema.parse({
      ...draft,
      items: [{ kind: 'requirement', text: ' Add tests. ', acceptance: '  ' }],
    })

    expect(parsed.items[0]).toEqual({ kind: 'requirement', text: 'Add tests.' })
  })

  it('rejects a draft without any requirement', () => {
    const result = specDraftSchema.safeParse({ ...draft, items: [items[1]] })
    expect(result.success).toBe(false)
  })

  it.each([
    ['an empty title', { title: '  ' }],
    ['an unknown kind', { items: [{ kind: 'wish', text: 'More speed.' }] }],
    ['an unknown engine', { engine: 'magic' }],
    ['an oversized item', { items: [{ kind: 'requirement', text: 'a'.repeat(501) }] }],
    ['too many items', { items: Array.from({ length: 51 }, () => items[0]) }],
  ])('rejects %s', (_label, override) => {
    expect(specDraftSchema.safeParse({ ...draft, ...override }).success).toBe(false)
  })
})

describe('exports', () => {
  const spec = { title: 'Rate-limit login', items: assignCodes(items) }

  it('formats markdown with grouped sections and acceptance criteria', () => {
    expect(toMarkdown(spec)).toBe(
      [
        '# Rate-limit login',
        '',
        '## Requirements',
        '',
        '- **R1** Limit login attempts. Done when: A 6th try returns 429.',
        '- **R2** Add tests.',
        '',
        '## Do not change',
        '',
        '- **N1** Do not change signup.',
        '',
        '## Open questions',
        '',
        '- **Q1** Log blocked attempts?',
        '',
      ].join('\n'),
    )
  })

  it('omits empty sections', () => {
    const onlyRequirement = { title: 'T', items: assignCodes([items[0] as SpecItemInput]) }
    expect(toMarkdown(onlyRequirement)).not.toContain('## Do not change')
  })

  it('asks the agent to resolve open questions first and to report honestly', () => {
    const prompt = toAgentPrompt(spec)

    expect(prompt.indexOf('ask me these questions')).toBeLessThan(prompt.indexOf('Implement'))
    expect(prompt).toContain('- **N1** Do not change signup.')
    expect(prompt).toContain('Do not say tests pass unless you ran them and saw them pass.')
  })
})
