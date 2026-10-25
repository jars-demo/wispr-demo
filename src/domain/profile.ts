import { z } from 'zod'

import {
  ACHIEVEMENT_IDS,
  AVATARS,
  DEFAULT_AVATAR,
  earnedAchievements,
  levelFor,
  runXp,
  streakFrom,
  unlockedAvatars,
  type BoardStats,
  type Stats,
} from './game'

// The player's profile. It lives in this browser only (no sign-up). Pure functions so every game
// rule is unit tested without a browser.

export const RUN_SOURCES = ['sample', 'link', 'github', 'paste'] as const
export type RunSource = (typeof RUN_SOURCES)[number]

export type Run = {
  key: string
  title: string
  source: RunSource
  correct: number
  total: number
  explain: number | null
  xp: number
  at: string
}

export const CARD_TEMPLATES = ['paper', 'night', 'signal'] as const
export type CardTemplate = (typeof CARD_TEMPLATES)[number]

export type Profile = {
  v: 1
  name: string
  avatar: string
  xp: number
  runs: Run[]
  concepts: string[]
  achievements: string[]
  days: string[]
  drilled: number
  card: { template: CardTemplate; tagline: number }
  /**
   * Saved progress: a random id and the secret that proves this browser owns it. Hidden players
   * are saved but kept off the public board.
   */
  board: {
    id: string
    secret: string
    hidden: boolean
    /** When the name can change again (one rename per NAME_CHANGE_DAYS), as the server said. */
    renameAfter?: string | null
  } | null
}

const MAX = { runs: 60, concepts: 300, days: 120, name: 24 } as const

export function emptyProfile(): Profile {
  return {
    v: 1,
    name: '',
    avatar: DEFAULT_AVATAR,
    xp: 0,
    runs: [],
    concepts: [],
    achievements: [],
    days: [],
    drilled: 0,
    card: { template: 'paper', tagline: 0 },
    board: null,
  }
}

const profileSchema = z.object({
  v: z.literal(1),
  name: z.string().max(MAX.name),
  avatar: z.string(),
  xp: z.number().int().min(0),
  runs: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      source: z.enum(RUN_SOURCES),
      correct: z.number().int().min(0),
      total: z.number().int().min(0),
      explain: z.number().min(0).max(100).nullable(),
      xp: z.number().int().min(0),
      at: z.string(),
    }),
  ),
  concepts: z.array(z.string()),
  achievements: z.array(z.string()),
  days: z.array(z.string()),
  drilled: z.number().int().min(0),
  card: z.object({ template: z.enum(CARD_TEMPLATES), tagline: z.number().int().min(0) }),
  board: z
    .object({
      id: z.uuid(),
      secret: z.string().min(20),
      hidden: z.boolean().default(false),
      renameAfter: z.string().nullable().optional(),
    })
    .nullable(),
})

/** Validates a profile from storage or a restore link; null when it is not one. */
export function checkProfile(value: unknown): Profile | null {
  const result = profileSchema.safeParse(value)
  return result.success ? result.data : null
}

/** Reads stored JSON; anything malformed starts a fresh profile rather than crashing. */
export function parseProfile(raw: string | null): Profile {
  if (!raw) return emptyProfile()
  try {
    return checkProfile(JSON.parse(raw)) ?? emptyProfile()
  } catch {
    return emptyProfile()
  }
}

export function conceptKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function statsOf(profile: Profile, today: string): Stats {
  return {
    xp: profile.xp,
    breakdowns: profile.runs.length,
    concepts: profile.concepts.length,
    achievements: profile.achievements,
    level: levelFor(profile.xp).level,
    streak: streakFrom(profile.days, today),
    perfectQuizzes: profile.runs.filter((r) => r.total > 0 && r.correct === r.total).length,
    bestExplain: Math.max(0, ...profile.runs.map((r) => r.explain ?? 0)),
    linkRuns: profile.runs.filter((r) => r.source === 'link').length,
    githubRuns: profile.runs.filter((r) => r.source === 'github').length,
    drilled: profile.drilled,
  }
}

export function boardStats(profile: Profile): BoardStats {
  return {
    xp: profile.xp,
    breakdowns: profile.runs.length,
    concepts: profile.concepts.length,
    achievements: profile.achievements,
  }
}

export type RunInput = {
  key: string
  title: string
  source: RunSource
  correct: number
  total: number
  explain: number | null
  concepts: string[]
}

export type RunOutcome = {
  profile: Profile
  gained: number
  newConcepts: string[]
  newAchievements: string[]
  newAvatars: string[]
  levelUp: { from: number; to: number } | null
}

function settle(profile: Profile, today: string): Profile {
  // Achievements feed the avatar rules, so earn achievements first, then avatars follow.
  const earned = earnedAchievements(statsOf(profile, today))
  return { ...profile, achievements: [...new Set([...profile.achievements, ...earned])] }
}

export function applyRun(profile: Profile, input: RunInput, now: Date): RunOutcome {
  const today = now.toISOString().slice(0, 10)
  const known = new Set(profile.concepts.map(conceptKey))
  const newConcepts = [...new Set(input.concepts.map((c) => c.trim()).filter(Boolean))].filter(
    (c) => !known.has(conceptKey(c)),
  )
  const replay = profile.runs.some((r) => r.key === input.key)
  const gained = runXp({
    correct: input.correct,
    explain: input.explain,
    newConcepts: newConcepts.length,
    replay,
  })
  const run: Run = {
    key: input.key,
    title: input.title,
    source: input.source,
    correct: input.correct,
    total: input.total,
    explain: input.explain,
    xp: gained,
    at: now.toISOString(),
  }
  const before = {
    level: levelFor(profile.xp).level,
    avatars: unlockedAvatars(boardStats(profile)),
  }
  const next = settle(
    {
      ...profile,
      xp: profile.xp + gained,
      runs: [run, ...profile.runs].slice(0, MAX.runs),
      concepts: [...profile.concepts, ...newConcepts].slice(0, MAX.concepts),
      days: [...new Set([today, ...profile.days])].slice(0, MAX.days),
    },
    today,
  )
  const after = levelFor(next.xp).level
  return {
    profile: next,
    gained,
    newConcepts,
    newAchievements: next.achievements.filter((a) => !profile.achievements.includes(a)),
    newAvatars: unlockedAvatars(boardStats(next)).filter((a) => !before.avatars.includes(a)),
    levelUp: after > before.level ? { from: before.level, to: after } : null,
  }
}

export function recordDrill(profile: Profile, now: Date): Profile {
  return settle({ ...profile, drilled: profile.drilled + 1 }, now.toISOString().slice(0, 10))
}

/** Picking an avatar only works for one this profile has unlocked. */
export function chooseAvatar(profile: Profile, avatar: string): Profile {
  return unlockedAvatars(boardStats(profile)).includes(avatar) ? { ...profile, avatar } : profile
}

export function cleanName(name: string): string {
  return name
    .replace(/[\u0000-\u001f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX.name)
}

export function isKnownAchievement(id: string): boolean {
  return ACHIEVEMENT_IDS.has(id)
}

export function isKnownAvatar(id: string): boolean {
  return AVATARS.some((a) => a.id === id)
}
