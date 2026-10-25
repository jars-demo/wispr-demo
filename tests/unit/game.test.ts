import { describe, expect, it } from 'vitest'

import { gradeExplanation } from '@/domain/explain'
import { levelFor, MAX_XP_PER_RUN, runXp, streakFrom, unlockedAvatars } from '@/domain/game'
import { applyRun, chooseAvatar, emptyProfile, parseProfile, type RunInput } from '@/domain/profile'

const NOW = new Date('2026-10-25T10:00:00Z')

const run = (overrides: Partial<RunInput> = {}): RunInput => ({
  key: 'sample:pagination',
  title: 'Cursor pagination',
  source: 'sample',
  correct: 3,
  total: 3,
  explain: 75,
  concepts: ['Cursor pagination', 'Tie-breaker sort key'],
  ...overrides,
})

describe('levels and XP', () => {
  it('maps XP to levels with the next threshold', () => {
    expect(levelFor(0)).toMatchObject({ level: 1, title: 'Vibe coder', next: 250 })
    expect(levelFor(250)).toMatchObject({ level: 2, title: 'Diff reader' })
    expect(levelFor(99_999)).toMatchObject({ level: 6, next: null })
  })

  it('pays a quarter for replays and never more than the per-run maximum', () => {
    const full = runXp({ correct: 4, explain: 100, newConcepts: 4, replay: false })
    expect(full).toBe(MAX_XP_PER_RUN)
    expect(runXp({ correct: 4, explain: 100, newConcepts: 4, replay: true })).toBe(
      Math.floor(full / 4),
    )
  })

  it('counts a streak through yesterday so it survives until the day ends', () => {
    expect(streakFrom(['2026-10-24', '2026-10-23', '2026-10-21'], '2026-10-25')).toBe(2)
    expect(streakFrom(['2026-10-25', '2026-10-24'], '2026-10-25')).toBe(2)
    expect(streakFrom(['2026-10-20'], '2026-10-25')).toBe(0)
  })
})

describe('applyRun', () => {
  it('earns XP, concepts, achievements and avatar unlocks from one perfect run', () => {
    const outcome = applyRun(emptyProfile(), run(), NOW)
    // 3 right (300) + explain 75% (150) + finish (50) + 2 new concepts (50)
    expect(outcome.gained).toBe(550)
    expect(outcome.newConcepts).toEqual(['Cursor pagination', 'Tie-breaker sort key'])
    expect(outcome.newAchievements).toEqual(expect.arrayContaining(['first', 'called-it']))
    expect(outcome.newAvatars).toEqual(expect.arrayContaining(['fox', 'owl', 'ninja']))
    expect(outcome.levelUp).toEqual({ from: 1, to: 2 })
    expect(outcome.profile.days).toEqual(['2026-10-25'])
  })

  it('does not count a concept twice, whatever its casing', () => {
    const first = applyRun(emptyProfile(), run(), NOW).profile
    const second = applyRun(first, run({ key: 'other', concepts: ['cursor PAGINATION'] }), NOW)
    expect(second.newConcepts).toEqual([])
    expect(second.profile.concepts).toHaveLength(2)
  })

  it('only lets a player pick avatars they have unlocked', () => {
    const fresh = emptyProfile()
    expect(chooseAvatar(fresh, 'dragon').avatar).toBe('dev-he')
    expect(chooseAvatar(fresh, 'dev-she').avatar).toBe('dev-she')
    expect(unlockedAvatars({ xp: 0, breakdowns: 0, concepts: 0, achievements: [] })).toEqual([
      'dev-he',
      'dev-she',
    ])
  })

  it('starts fresh instead of crashing on corrupt storage', () => {
    expect(parseProfile('{not json').xp).toBe(0)
    expect(parseProfile(JSON.stringify({ v: 2 })).runs).toEqual([])
  })
})

describe('gradeExplanation', () => {
  const points = [
    { point: 'Uses a cursor', keywords: ['cursor'] },
    { point: 'No offset', keywords: ['offset', 'skip'] },
    { point: 'Extra row', keywords: ['one more', 'extra row'] },
  ]

  it('scores each key idea heard, including other word forms', () => {
    const result = gradeExplanation(
      'The client sends the cursors back so we never skip rows with an offset anymore at all',
      points,
    )
    expect(result.covered).toEqual([true, true, false])
    expect(result.score).toBe(67)
  })

  it('needs a real explanation, not a keyword list', () => {
    expect(gradeExplanation('cursor offset extra row', points)).toMatchObject({
      score: 0,
      tooShort: true,
    })
  })
})
