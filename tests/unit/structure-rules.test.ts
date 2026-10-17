import { describe, expect, it } from 'vitest'

import { LIMITS } from '@/domain/spec'
import { structureWithRules } from '@/domain/structure-rules'

const SAMPLE =
  'Add rate limiting to the login route, five attempts per minute per IP. ' +
  'Return a 429 with Retry-After. Do not touch the signup flow. Add tests. ' +
  'And maybe log the blocked attempts?'

describe('structureWithRules', () => {
  it('turns a spoken request into requirements, non-goals and open questions', () => {
    const { items } = structureWithRules(SAMPLE)

    expect(items.map((item) => [item.kind, item.text])).toEqual([
      ['requirement', 'Add rate limiting to the login route, five attempts per minute per IP.'],
      ['requirement', 'Return a 429 with Retry-After.'],
      ['non_goal', 'Do not touch the signup flow.'],
      ['requirement', 'Add tests.'],
      ['open_question', 'Log the blocked attempts?'],
    ])
  })

  it('keeps every source quote as an exact substring of the transcript', () => {
    for (const item of structureWithRules(SAMPLE).items) {
      expect(SAMPLE).toContain(item.sourceQuote)
    }
  })

  it('explains why a hedged request became a question instead of a requirement', () => {
    const question = structureWithRules('Maybe cache the results').items[0]

    expect(question?.kind).toBe('open_question')
    expect(question?.note).toBe('You said "maybe", so this was not made a requirement.')
  })

  it('treats a plain question as an open question', () => {
    const [item] = structureWithRules('Should the limit be per user or per IP?').items

    expect(item).toMatchObject({ kind: 'open_question', note: 'You asked this as a question.' })
  })

  it.each([
    "Don't change the public API",
    'Never log passwords',
    'Avoid new dependencies',
    'Leave the billing module alone',
    'Keep the database schema unchanged',
  ])('recognises "%s" as something to leave alone', (clause) => {
    expect(structureWithRules(clause).items[0]?.kind).toBe('non_goal')
  })

  it('splits clauses joined by "also" and strips filler and polite asks', () => {
    const { items } = structureWithRules(
      'Okay so I want you to add a health check also make sure that it returns JSON',
    )

    expect(items.map((item) => item.text)).toEqual(['Add a health check.', 'It returns JSON.'])
  })

  it('drops filler-only sentences and fragments too short to act on', () => {
    expect(structureWithRules('Okay. Thanks. That is it. Hmm.').items).toEqual([])
  })

  it('titles the receipt from the first requirement, shortened to ten words', () => {
    const { title } = structureWithRules(
      'Add rate limiting to the login route with a sliding time window. Add tests.',
    )

    expect(title).toBe('Add rate limiting to the login route with a sliding…')
  })

  it('titles from the first clause when the first requirement has several', () => {
    const { title } = structureWithRules('Add rate limiting to the login route, five per minute.')

    expect(title).toBe('Add rate limiting to the login route')
  })

  it('falls back to a neutral title when nothing is a requirement', () => {
    expect(structureWithRules('Maybe add caching?').title).toBe('Untitled receipt')
  })

  it('returns nothing, rather than inventing items, for empty input', () => {
    expect(structureWithRules('   ')).toEqual({ title: 'Untitled receipt', items: [] })
  })

  it('caps the number of items and the length of each one', () => {
    const many = Array.from({ length: 80 }, (_, i) => `Add feature number ${i}.`).join(' ')
    const long = `Add ${'very '.repeat(200)}long thing.`

    expect(structureWithRules(many).items).toHaveLength(LIMITS.items)
    expect(structureWithRules(long).items[0]?.text.length).toBeLessThanOrEqual(LIMITS.itemText)
  })
})
