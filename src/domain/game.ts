// The game: XP, levels, achievements and unlockable avatars. Pure functions over plain numbers,
// so the leaderboard server can re-check what a browser reports with the same rules.

export const LEVELS = [
  { min: 0, title: 'Vibe coder' },
  { min: 250, title: 'Diff reader' },
  { min: 700, title: 'Pattern spotter' },
  { min: 1500, title: 'Code whisperer' },
  { min: 3000, title: 'Systems thinker' },
  { min: 5500, title: 'Staff energy' },
] as const

export function levelFor(xp: number): {
  level: number
  title: string
  next: number | null
  floor: number
} {
  let index = 0
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) index = i
  })
  const current = LEVELS[index] ?? LEVELS[0]
  return {
    level: index + 1,
    title: current.title,
    floor: current.min,
    next: LEVELS[index + 1]?.min ?? null,
  }
}

export const XP = {
  correct: 100,
  explainPerPoint: 2,
  finish: 50,
  newConcept: 25,
  /** A replay of something already broken down earns a quarter. */
  replayShare: 0.25,
} as const

/** The most one run can ever earn: the server rejects totals above runs times this. */
export const MAX_XP_PER_RUN =
  4 * XP.correct + 100 * XP.explainPerPoint + XP.finish + 4 * XP.newConcept

export function runXp(input: {
  correct: number
  explain: number | null
  newConcepts: number
  replay: boolean
}): number {
  const base =
    input.correct * XP.correct +
    Math.round((input.explain ?? 0) * XP.explainPerPoint) +
    XP.finish +
    input.newConcepts * XP.newConcept
  return input.replay ? Math.floor(base * XP.replayShare) : base
}

/** What the leaderboard can see and re-check. */
export type BoardStats = {
  xp: number
  breakdowns: number
  concepts: number
  achievements: string[]
}

/** Everything the browser knows, a superset of BoardStats. */
export type Stats = BoardStats & {
  level: number
  streak: number
  perfectQuizzes: number
  bestExplain: number
  linkRuns: number
  githubRuns: number
  drilled: number
}

export type Achievement = {
  id: string
  emoji: string
  title: string
  how: string
  test: (s: Stats) => boolean
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first',
    emoji: '🔍',
    title: 'First breakdown',
    how: 'Finish a breakdown',
    test: (s) => s.breakdowns >= 1,
  },
  {
    id: 'called-it',
    emoji: '🎯',
    title: 'Called it',
    how: 'Answer every question right',
    test: (s) => s.perfectQuizzes >= 1,
  },
  {
    id: 'teacher',
    emoji: '🎙️',
    title: 'Could teach it',
    how: 'Score 80+ explaining it back',
    test: (s) => s.bestExplain >= 80,
  },
  {
    id: 'senior-study',
    emoji: '🧑‍🏫',
    title: 'Studied a senior',
    how: 'Break down a public PR or commit link',
    test: (s) => s.linkRuns >= 1,
  },
  {
    id: 'owned-it',
    emoji: '🛠️',
    title: 'Owned it',
    how: 'Break down a change from your GitHub',
    test: (s) => s.githubRuns >= 1,
  },
  {
    id: 'rabbit-hole',
    emoji: '🕳️',
    title: 'Rabbit hole',
    how: 'Drill into one part of a change',
    test: (s) => s.drilled >= 1,
  },
  {
    id: 'on-the-wire',
    emoji: '📡',
    title: 'On the wire',
    how: 'Finish 5 breakdowns',
    test: (s) => s.breakdowns >= 5,
  },
  {
    id: 'collector',
    emoji: '🧠',
    title: 'Concept collector',
    how: 'Unlock 10 concepts',
    test: (s) => s.concepts >= 10,
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    title: 'On a streak',
    how: 'Break something down 3 days in a row',
    test: (s) => s.streak >= 3,
  },
  {
    id: 'staff-energy',
    emoji: '👑',
    title: 'Staff energy',
    how: 'Reach level 6',
    test: (s) => s.level >= 6,
  },
]

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id))

export function earnedAchievements(stats: Stats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id)
}

export type Avatar = {
  id: string
  emoji: string
  name: string
  /** Gradient stops behind the emoji. */
  colors: readonly [string, string]
  /** null means free from the start. */
  unlock: { how: string; test: (s: BoardStats) => boolean } | null
}

// Two free avatars, eight earned. Unlock rules use only BoardStats, so the server can re-check them.
export const AVATARS: readonly Avatar[] = [
  { id: 'dev-he', emoji: '👨‍💻', name: 'Dev', colors: ['#ffe4d4', '#ffb38a'], unlock: null },
  { id: 'dev-she', emoji: '👩‍💻', name: 'Dev', colors: ['#fde7ef', '#f9a8c4'], unlock: null },
  {
    id: 'fox',
    emoji: '🦊',
    name: 'Fox',
    colors: ['#fff1d6', '#ffc46b'],
    unlock: { how: 'Finish 1 breakdown', test: (s) => s.breakdowns >= 1 },
  },
  {
    id: 'owl',
    emoji: '🦉',
    name: 'Night owl',
    colors: ['#e9e4ff', '#b7a8ff'],
    unlock: { how: 'Earn 300 XP', test: (s) => s.xp >= 300 },
  },
  {
    id: 'robot',
    emoji: '🤖',
    name: 'Robot',
    colors: ['#e0f2fe', '#8fd0f7'],
    unlock: { how: 'Finish 3 breakdowns', test: (s) => s.breakdowns >= 3 },
  },
  {
    id: 'ninja',
    emoji: '🥷',
    name: 'Ninja',
    colors: ['#e7e5e4', '#a8a29e'],
    unlock: { how: 'Get a perfect quiz', test: (s) => s.achievements.includes('called-it') },
  },
  {
    id: 'octopus',
    emoji: '🐙',
    name: 'Octopus',
    colors: ['#ffe4e6', '#fda4af'],
    unlock: { how: 'Unlock 10 concepts', test: (s) => s.concepts >= 10 },
  },
  {
    id: 'astronaut',
    emoji: '🧑‍🚀',
    name: 'Astronaut',
    colors: ['#dbeafe', '#93b4f5'],
    unlock: { how: 'Keep a 3-day streak', test: (s) => s.achievements.includes('streak-3') },
  },
  {
    id: 'wizard',
    emoji: '🧙',
    name: 'Wizard',
    colors: ['#ede9fe', '#c4b5fd'],
    unlock: { how: 'Earn 1,500 XP', test: (s) => s.xp >= 1500 },
  },
  {
    id: 'dragon',
    emoji: '🐉',
    name: 'Dragon',
    colors: ['#dcfce7', '#86efac'],
    unlock: { how: 'Earn 3,000 XP', test: (s) => s.xp >= 3000 },
  },
]

export const DEFAULT_AVATAR = 'dev-he'

export function avatarById(id: string): Avatar {
  return AVATARS.find((a) => a.id === id) ?? (AVATARS[0] as Avatar)
}

export function unlockedAvatars(stats: BoardStats): string[] {
  return AVATARS.filter((a) => !a.unlock || a.unlock.test(stats)).map((a) => a.id)
}

/** Days in a row up to today (or yesterday, so a streak survives until the day is over). */
export function streakFrom(days: readonly string[], today: string): number {
  const set = new Set(days)
  const step = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - 1)
    return d.toISOString().slice(0, 10)
  }
  let cursor = set.has(today) ? today : step(today)
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = step(cursor)
  }
  return streak
}
