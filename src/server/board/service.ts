import 'server-only'

import {
  checkSync,
  describeEvent,
  eventsBetween,
  isRename,
  nameLockedMessage,
  nameLockedUntil,
  rivalryLine,
  type BoardView,
  type SyncInput,
} from '@/domain/board'
import { levelFor } from '@/domain/game'
import { changeLabel, sharedHref } from '@/domain/shared'
import type { Db } from '@/server/db'

import {
  countPlayers,
  deleteOwnPlayer,
  findOwnPlayer,
  findOwnProfile,
  insertEvents,
  insertPlayer,
  isUniqueViolation,
  lastNameChange,
  markNameChanged,
  nameTaken,
  playerExists,
  recentEvents,
  standing,
  topPlayers,
  updateOwnPlayer,
} from './repository'

export async function hashSecret(secret: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return Buffer.from(digest).toString('hex')
}

export type SyncOutcome =
  | { ok: true; events: number }
  | { ok: false; status: 404 | 409 | 422; reason: string; code?: 'name_taken' }
  | {
      ok: false
      status: 409
      reason: string
      code: 'name_locked'
      /** The name the server keeps, so another device can adopt it. */
      name: string
      until: string
    }

const NAME_TAKEN = {
  ok: false,
  status: 409,
  reason: 'Someone already has that name. Try another.',
  code: 'name_taken',
} as const

/** Saves a player's numbers after re-checking them, and records what changed as public events. */
export async function syncPlayer(db: Db, input: SyncInput, now = new Date()): Promise<SyncOutcome> {
  const check = checkSync(input)
  if (!check.ok) return { ok: false, status: 422, reason: check.reason }
  const secretHash = await hashSecret(input.secret)

  try {
    return await db.transaction(async (tx): Promise<SyncOutcome> => {
      const before = await findOwnPlayer(tx, input.id, secretHash)
      // Someone else's id behaves exactly like a missing one.
      if (!before && (await playerExists(tx, input.id))) {
        return { ok: false, status: 404, reason: 'Player not found.' }
      }
      const renamed = before !== null && isRename(before.name, check.state.name)
      if (renamed) {
        // One rename per NAME_CHANGE_DAYS. Claiming a name and changing its case are free.
        const until = nameLockedUntil(await lastNameChange(tx, input.id), now)
        if (until) {
          return {
            ok: false,
            status: 409,
            reason: nameLockedMessage(until),
            code: 'name_locked',
            name: before.name,
            until: until.toISOString(),
          }
        }
      }
      if (await nameTaken(tx, check.state.name, input.id)) return NAME_TAKEN
      if (before) await updateOwnPlayer(tx, input.id, secretHash, check.state, input.profile)
      else await insertPlayer(tx, input.id, secretHash, check.state, input.profile)
      if (renamed) await markNameChanged(tx, input.id)
      // Hidden players save progress quietly: no public events.
      const events = check.state.hidden ? [] : eventsBetween(before, check.state)
      await insertEvents(tx, input.id, events)
      return { ok: true, events: events.length }
    })
  } catch (error) {
    // Two players claimed the same name at the same moment; the index let only one through.
    if (isUniqueViolation(error)) return NAME_TAKEN
    throw error
  }
}

/** Whether a name is free to claim. A player's own current name is checked in the browser. */
export async function nameAvailable(db: Db, name: string): Promise<boolean> {
  return !(await nameTaken(db, name, null))
}

export async function leaveBoard(db: Db, id: string, secret: string): Promise<boolean> {
  return deleteOwnPlayer(db, id, await hashSecret(secret))
}

export async function restoreProfile(
  db: Db,
  id: string,
  secret: string,
): Promise<{ profile: unknown; hidden: boolean } | null> {
  return findOwnProfile(db, id, await hashSecret(secret))
}

export async function loadBoard(db: Db, meId: string | null): Promise<BoardView> {
  const [top, mine, events, players] = await Promise.all([
    topPlayers(db, meId, 25),
    meId ? standing(db, meId) : Promise.resolve(null),
    recentEvents(db),
    countPlayers(db),
  ])
  return {
    players,
    top: top.map((row, i) => ({
      rank: i + 1,
      name: row.name,
      avatar: row.avatar,
      xp: row.xp,
      level: levelFor(row.xp).title,
      isMe: row.isMe,
    })),
    me: mine?.me ?? null,
    rivalry: rivalryLine(mine?.me ?? null, mine?.ahead ?? null),
    events: events.map((e) => ({
      kind: e.kind,
      detail: e.detail,
      text: describeEvent(e.kind, e.detail, e.name, e.shareUrl ? changeLabel(e.shareUrl) : null),
      avatar: e.avatar,
      at: e.at,
      href: e.kind === 'shared' ? sharedHref(e.detail) : null,
    })),
  }
}
