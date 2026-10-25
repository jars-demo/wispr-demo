import { describe, expect, it } from 'vitest'

import { ownKeyFrom } from '@/domain/ai'
import {
  checkSync,
  describeEvent,
  eventsBetween,
  rivalryLine,
  type SyncInput,
} from '@/domain/board'
import { decodeCard, encodeCard, shareText, TAGLINES, type CardData } from '@/domain/card'
import { mergeFeed, parseChangeLink, type FeedItem } from '@/domain/feed'
import { LEVELS } from '@/domain/game'

const CARD: CardData = {
  name: 'Asha ✨',
  avatar: 'spotter',
  xp: 1234,
  breakdowns: 5,
  concepts: 9,
  streak: 3,
  achievements: ['first', 'called-it'],
  topConcepts: ['Idempotency'],
  template: 'night',
  tagline: 2,
}

describe('share cards', () => {
  it('round-trips through the link, unicode included', () => {
    expect(decodeCard(encodeCard(CARD))).toEqual(CARD)
  })

  it('rejects junk and clamps unknown ids to known ones', () => {
    expect(decodeCard('not-a-card')).toBeNull()
    expect(decodeCard('a'.repeat(5000))).toBeNull()
    const sneaky = encodeCard({ ...CARD, avatar: 'unicorn', achievements: ['first', 'hacker'] })
    expect(decodeCard(sneaky)).toMatchObject({ avatar: 'dev-he', achievements: ['first'] })
  })

  it('writes the X post from numbers only, tagging Wispr Flow and the maker', () => {
    const text = shareText(CARD, 'Code whisperer')
    expect(text).toContain('1,234 XP')
    expect(text).toContain('Code whisperer')
    expect(text).toContain('@WisprFlow')
    expect(text).toContain('@jishanarshaikh')
    expect(text).toContain('@WeMakeDevs')
    expect(text).toContain('wispr.jishanahmed.in')
    expect(text).not.toMatch(/localhost|—/)
  })

  it('keeps the X post inside the limit, counting the card link as 23 characters', () => {
    // Every tagline and level title with the biggest numbers, plus a blank line and the link.
    for (const tagline of TAGLINES.keys()) {
      for (const level of LEVELS) {
        const text = shareText(
          { ...CARD, tagline, xp: 9_999_999, breakdowns: 99_999, concepts: 99_999 },
          level.title,
        )
        expect(text.length + 2 + 23).toBeLessThanOrEqual(280)
      }
    }
  })
})

const SYNC: SyncInput = {
  id: '6f1c2a5e-7d1b-4a0e-9a57-0d7f2b0c9e11',
  secret: 'x'.repeat(32),
  name: '  Ravi  ',
  avatar: 'staff',
  xp: 400,
  breakdowns: 1,
  concepts: 2,
  achievements: ['first', 'made-up'],
  hidden: false,
  profile: {},
}

describe('leaderboard checks', () => {
  it('drops unknown achievements and avatars the numbers have not unlocked', () => {
    const check = checkSync(SYNC)
    if (!check.ok) throw new Error(check.reason)
    expect(check.state.name).toBe('Ravi')
    expect(check.state.achievements).toEqual(['first'])
    expect(check.state.avatar).toBe('dev-he')
    expect(check.state.avatars).toEqual(expect.arrayContaining(['reader', 'spotter']))
  })

  it('rejects XP that no number of runs could earn', () => {
    expect(checkSync({ ...SYNC, xp: 999_999 }).ok).toBe(false)
    expect(checkSync({ ...SYNC, concepts: 50 }).ok).toBe(false)
  })

  it('turns what changed into public events with known ids only', () => {
    const before = checkSync(SYNC)
    const after = checkSync({
      ...SYNC,
      xp: 800,
      breakdowns: 2,
      achievements: ['first', 'called-it'],
    })
    if (!before.ok || !after.ok) throw new Error('check failed')
    const events = eventsBetween(before.state, after.state)
    expect(events).toEqual(
      expect.arrayContaining([
        { kind: 'level', detail: '3' },
        { kind: 'achievement', detail: 'called-it' },
        { kind: 'avatar', detail: 'oracle' },
      ]),
    )
    expect(describeEvent('avatar', 'oracle', 'Ravi')).toBe('Ravi unlocked the Oracle avatar')
    expect(eventsBetween(null, after.state)).toEqual([{ kind: 'joined', detail: '3' }])
  })

  it('names the rival just ahead', () => {
    expect(rivalryLine({ xp: 100, rank: 4 }, { name: 'Asha', xp: 220 })).toBe(
      'Asha is 120 XP ahead of you.',
    )
    expect(rivalryLine({ xp: 100, rank: 1 }, null)).toMatch(/top of the board/)
    expect(rivalryLine(null, null)).toBeNull()
  })
})

describe('feed and links', () => {
  it('accepts PR, commit and compare links, with or without extras', () => {
    expect(parseChangeLink('https://github.com/vercel/next.js/pull/123/files?x=1')).toMatchObject({
      repo: 'vercel/next.js',
      pr: 123,
      url: 'https://github.com/vercel/next.js/pull/123',
    })
    expect(parseChangeLink('github.com/a/b/commit/abcdef1')).toBeNull()
    expect(parseChangeLink('https://github.com/a/b/commit/abcdef1')).toMatchObject({
      sha: 'abcdef1',
    })
    expect(parseChangeLink('https://evil.com/a/b/pull/1')).toBeNull()
  })

  it('sorts newest first and removes duplicates', () => {
    const item = (id: string, at: string): FeedItem => ({
      id,
      kind: 'pr',
      repo: 'a/b',
      title: id,
      author: 'me',
      at,
      url: null,
      additions: null,
      deletions: null,
      source: { kind: 'sample', id },
    })
    const merged = mergeFeed([
      item('old', '2026-01-01'),
      item('new', '2026-02-01'),
      item('old', '2026-01-01'),
    ])
    expect(merged.map((i) => i.id)).toEqual(['new', 'old'])
  })
})

describe('own AI keys', () => {
  const headers = (entries: Record<string, string>) => new Headers(entries)

  it('reads a valid key and falls back to the default model', () => {
    expect(
      ownKeyFrom(headers({ 'x-ai-provider': 'anthropic', 'x-ai-key': 'sk-ant-1234567890' })),
    ).toEqual({
      provider: 'anthropic',
      key: 'sk-ant-1234567890',
      model: 'claude-opus-5-5',
    })
  })

  it('ignores unknown providers, short keys and odd model names', () => {
    expect(ownKeyFrom(headers({ 'x-ai-provider': 'acme', 'x-ai-key': 'k'.repeat(20) }))).toBeNull()
    expect(ownKeyFrom(headers({ 'x-ai-provider': 'groq', 'x-ai-key': 'short' }))).toBeNull()
    expect(
      ownKeyFrom(
        headers({ 'x-ai-provider': 'groq', 'x-ai-key': 'k'.repeat(20), 'x-ai-model': 'a b;c' }),
      )?.model,
    ).toBe('openai/gpt-oss-120b')
  })
})
