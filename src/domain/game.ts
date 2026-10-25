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

/** Badge metal: how hard an achievement is to earn. */
export type Tier = 'bronze' | 'silver' | 'gold'

/** Names an icon in the UI's line icon set; the domain never imports UI code. */
export type BadgeIcon =
  | 'scan'
  | 'target'
  | 'mic'
  | 'pull-request'
  | 'wrench'
  | 'layers'
  | 'radio'
  | 'brain'
  | 'flame'
  | 'crown'

export type Achievement = {
  id: string
  icon: BadgeIcon
  tier: Tier
  title: string
  how: string
  test: (s: Stats) => boolean
}

export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first',
    icon: 'scan',
    tier: 'bronze',
    title: 'First breakdown',
    how: 'Finish a breakdown',
    test: (s) => s.breakdowns >= 1,
  },
  {
    id: 'senior-study',
    icon: 'pull-request',
    tier: 'bronze',
    title: 'Studied a senior',
    how: 'Break down a public PR or commit link',
    test: (s) => s.linkRuns >= 1,
  },
  {
    id: 'rabbit-hole',
    icon: 'layers',
    tier: 'bronze',
    title: 'Rabbit hole',
    how: 'Drill into one part of a change',
    test: (s) => s.drilled >= 1,
  },
  {
    id: 'called-it',
    icon: 'target',
    tier: 'silver',
    title: 'Called it',
    how: 'Answer every question right',
    test: (s) => s.perfectQuizzes >= 1,
  },
  {
    id: 'teacher',
    icon: 'mic',
    tier: 'silver',
    title: 'Could teach it',
    how: 'Score 80+ explaining it back',
    test: (s) => s.bestExplain >= 80,
  },
  {
    id: 'owned-it',
    icon: 'wrench',
    tier: 'silver',
    title: 'Owned it',
    how: 'Break down a change from your GitHub',
    test: (s) => s.githubRuns >= 1,
  },
  {
    id: 'on-the-wire',
    icon: 'radio',
    tier: 'silver',
    title: 'On the wire',
    how: 'Finish 5 breakdowns',
    test: (s) => s.breakdowns >= 5,
  },
  {
    id: 'collector',
    icon: 'brain',
    tier: 'gold',
    title: 'Concept collector',
    how: 'Unlock 10 concepts',
    test: (s) => s.concepts >= 10,
  },
  {
    id: 'streak-3',
    icon: 'flame',
    tier: 'gold',
    title: 'On a streak',
    how: 'Break something down 3 days in a row',
    test: (s) => s.streak >= 3,
  },
  {
    id: 'staff-energy',
    icon: 'crown',
    tier: 'gold',
    title: 'Staff energy',
    how: 'Reach level 6',
    test: (s) => s.level >= 6,
  },
]

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id))

export function achievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

export function earnedAchievements(stats: Stats): string[] {
  return ACHIEVEMENTS.filter((a) => a.test(stats)).map((a) => a.id)
}

export type Avatar = {
  id: string
  name: string
  /** Soft backdrop behind the line art (public/avatars/<id>.svg). */
  tone: string
  /** null means free from the start. */
  unlock: { how: string; test: (s: BoardStats) => boolean } | null
}

// Two free avatars, eight earned. Characters gain props as they get harder to unlock. Unlock
// rules use only BoardStats, so the server can re-check them.
export const AVATARS: readonly Avatar[] = [
  { id: 'dev-he', name: 'Dev', tone: '#efe4d2', unlock: null },
  { id: 'dev-she', name: 'Dev', tone: '#f6dccb', unlock: null },
  {
    id: 'reader',
    name: 'Reader',
    tone: '#e0e8d4',
    unlock: { how: 'Finish 1 breakdown', test: (s) => s.breakdowns >= 1 },
  },
  {
    id: 'spotter',
    name: 'Spotter',
    tone: '#d9e5ef',
    unlock: { how: 'Earn 300 XP', test: (s) => s.xp >= 300 },
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    tone: '#e7def0',
    unlock: { how: 'Finish 3 breakdowns', test: (s) => s.breakdowns >= 3 },
  },
  {
    id: 'oracle',
    name: 'Oracle',
    tone: '#f3e6c6',
    unlock: { how: 'Get a perfect quiz', test: (s) => s.achievements.includes('called-it') },
  },
  {
    id: 'collector',
    name: 'Collector',
    tone: '#f6dccb',
    unlock: { how: 'Unlock 10 concepts', test: (s) => s.concepts >= 10 },
  },
  {
    id: 'night-owl',
    name: 'Night owl',
    tone: '#d9e5ef',
    unlock: { how: 'Keep a 3-day streak', test: (s) => s.achievements.includes('streak-3') },
  },
  {
    id: 'architect',
    name: 'Architect',
    tone: '#e0e8d4',
    unlock: { how: 'Earn 1,500 XP', test: (s) => s.xp >= 1500 },
  },
  {
    id: 'staff',
    name: 'Staff engineer',
    tone: '#f3e6c6',
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
