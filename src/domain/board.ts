import { z } from 'zod'

import {
  ACHIEVEMENT_IDS,
  ACHIEVEMENTS,
  AVATARS,
  LEVELS,
  levelFor,
  MAX_XP_PER_RUN,
  unlockedAvatars,
  type BoardStats,
} from './game'
import { cleanName } from './profile'

// The public leaderboard. Players join with a name and no account; their browser reports its
// numbers and the server re-checks them here with the same game rules. Only names, avatars and
// numbers are public. Numbers are self-reported, so the board is for fun, not for proof.

export const syncSchema = z.object({
  id: z.uuid(),
  secret: z.string().min(20).max(100),
  name: z.string().min(1).max(40),
  avatar: z.string().max(24),
  xp: z.number().int().min(0).max(10_000_000),
  breakdowns: z.number().int().min(0).max(100_000),
  concepts: z.number().int().min(0).max(100_000),
  achievements: z.array(z.string().max(24)).max(ACHIEVEMENTS.length + 5),
  /** Hidden players keep their saved progress but do not appear on the board. */
  hidden: z.boolean().default(false),
  /** The browser profile for restore links. Opaque to the server, checked on restore. */
  profile: z.record(z.string(), z.unknown()),
})

export type SyncInput = z.infer<typeof syncSchema>

export type PlayerState = BoardStats & {
  name: string
  avatar: string
  avatars: string[]
  hidden: boolean
}

export type SyncCheck = { ok: true; state: PlayerState } | { ok: false; reason: string }

/** Re-checks reported numbers against the game rules. Unknown ids are dropped, not trusted. */
export function checkSync(input: SyncInput): SyncCheck {
  const name = cleanName(input.name)
  if (!name) return { ok: false, reason: 'Pick a name for the board.' }
  if (input.xp > input.breakdowns * MAX_XP_PER_RUN) {
    return { ok: false, reason: 'Those numbers do not add up.' }
  }
  if (input.concepts > input.breakdowns * 4) {
    return { ok: false, reason: 'Those numbers do not add up.' }
  }
  const stats: BoardStats = {
    xp: input.xp,
    breakdowns: input.breakdowns,
    concepts: input.concepts,
    achievements: [...new Set(input.achievements.filter((a) => ACHIEVEMENT_IDS.has(a)))],
  }
  const avatars = unlockedAvatars(stats)
  const avatar = avatars.includes(input.avatar) ? input.avatar : (avatars[0] ?? 'dev-he')
  return { ok: true, state: { ...stats, name, avatar, avatars, hidden: input.hidden } }
}

export const EVENT_KINDS = ['joined', 'level', 'achievement', 'avatar'] as const
export type BoardEventKind = (typeof EVENT_KINDS)[number]
export type BoardEvent = { kind: BoardEventKind; detail: string }

/** What changed between two saves, as public events. */
export function eventsBetween(before: PlayerState | null, after: PlayerState): BoardEvent[] {
  if (!before) return [{ kind: 'joined', detail: String(levelFor(after.xp).level) }]
  const events: BoardEvent[] = []
  const from = levelFor(before.xp).level
  const to = levelFor(after.xp).level
  if (to > from) events.push({ kind: 'level', detail: String(to) })
  for (const id of after.achievements) {
    if (!before.achievements.includes(id)) events.push({ kind: 'achievement', detail: id })
  }
  for (const id of after.avatars) {
    if (!before.avatars.includes(id)) events.push({ kind: 'avatar', detail: id })
  }
  return events
}

/** The sentence shown in the live board ticker. Built from known ids only. */
export function describeEvent(kind: BoardEventKind, detail: string, name: string): string {
  switch (kind) {
    case 'joined':
      return `${name} joined the board`
    case 'level': {
      const level = Number(detail)
      const title = LEVELS[level - 1]?.title ?? 'a new level'
      return `${name} reached level ${level}: ${title}`
    }
    case 'achievement': {
      const a = ACHIEVEMENTS.find((x) => x.id === detail)
      return a ? `${name} earned ${a.title}` : `${name} earned an achievement`
    }
    case 'avatar': {
      const a = AVATARS.find((x) => x.id === detail)
      return a ? `${name} unlocked the ${a.name} avatar` : `${name} unlocked an avatar`
    }
  }
}

/** "Asha is 120 XP ahead of you", or a nudge when you lead. */
export function rivalryLine(
  me: { xp: number; rank: number } | null,
  ahead: { name: string; xp: number } | null,
): string | null {
  if (!me) return null
  if (me.rank === 1) return 'You are top of the board. Someone is coming for you.'
  if (!ahead) return null
  const gap = ahead.xp - me.xp
  return gap <= 0
    ? `You are level with ${ahead.name}. One breakdown settles it.`
    : `${ahead.name} is ${gap.toLocaleString('en-US')} XP ahead of you.`
}

/** What GET /api/board returns: names, avatars and numbers, never ids. */
export type BoardView = {
  players: number
  top: { rank: number; name: string; avatar: string; xp: number; level: string; isMe: boolean }[]
  me: { rank: number; xp: number } | null
  rivalry: string | null
  events: { kind: BoardEventKind; detail: string; text: string; avatar: string; at: string }[]
}
