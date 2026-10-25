'use client'

import { ACHIEVEMENTS, avatarById, LEVELS } from '@/domain/game'
import {
  boardStats,
  checkProfile,
  cleanName,
  parseProfile,
  type Profile,
  type RunOutcome,
} from '@/domain/profile'
import { toast } from '@/features/fx/toasts'
import { createLocalStore } from '@/lib/local-store'

// The player's profile in this browser, and quiet saving to the server once they have a save
// slot. Saving needs no account: a random id plus a secret only this browser (and its restore
// link) knows.

export const profileStore = createLocalStore<Profile>('breakdown:profile', parseProfile)

let syncTimer: number | undefined

export function updateProfile(change: (profile: Profile) => Profile) {
  profileStore.write(change(profileStore.read()))
  window.clearTimeout(syncTimer)
  syncTimer = window.setTimeout(() => {
    void saveProgress().then((result) => {
      // Quiet saves only speak up when the name needs attention.
      if (!result.ok && result.code === 'name_locked' && result.name) {
        // Another device renamed this player; this browser takes the saved name and carries on.
        profileStore.write({ ...profileStore.read(), name: result.name })
        void saveProgress()
        return
      }
      if (!result.ok && result.code === 'name_taken') {
        toast({
          tone: 'error',
          title: 'Your name was just taken',
          body: 'Pick another on your card.',
        })
      }
    })
  }, 700)
}

export type SaveResult = { ok: true } | { ok: false; message: string; code?: string; name?: string }

async function readProblem(
  response: Response,
): Promise<{ message: string; code?: string; name?: string; until?: string }> {
  const body = (await response.json().catch(() => null)) as {
    title?: string
    code?: string
    name?: string
    until?: string
  } | null
  return {
    message: body?.title ?? 'Could not save right now.',
    code: body?.code,
    name: body?.name,
    until: body?.until,
  }
}

/** Keeps the server's word on when the name unlocks, so the name field can say so. */
function rememberRenameAfter(value: string | null) {
  const profile = profileStore.read()
  if (!profile.board || (profile.board.renameAfter ?? null) === value) return
  profileStore.write({ ...profile, board: { ...profile.board, renameAfter: value } })
}

export async function saveProgress(): Promise<SaveResult> {
  const profile = profileStore.read()
  if (!profile.board) return { ok: false, message: 'Not saving yet.' }
  const stats = boardStats(profile)
  try {
    const response = await fetch('/api/players', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: profile.board.id,
        secret: profile.board.secret,
        name: profile.name || 'A developer',
        avatar: profile.avatar,
        ...stats,
        hidden: profile.board.hidden,
        profile: { ...profile, board: null },
      }),
    })
    if (response.ok) {
      const body = (await response.json().catch(() => null)) as {
        renameAfter?: string | null
      } | null
      rememberRenameAfter(body?.renameAfter ?? null)
      return { ok: true }
    }
    const problem = await readProblem(response)
    if (problem.code === 'name_locked' && problem.until) rememberRenameAfter(problem.until)
    return { ok: false, ...problem }
  } catch {
    return { ok: false, message: 'You look offline. Progress is still saved in this browser.' }
  }
}

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** One step: a name, and progress is saved and (unless hidden) on the board. */
export async function startSaving(name: string, hidden: boolean): Promise<SaveResult> {
  const clean = cleanName(name)
  if (!clean) return { ok: false, message: 'Pick a name first.' }
  const before = profileStore.read()
  profileStore.write({
    ...before,
    name: clean,
    board: before.board
      ? { ...before.board, hidden }
      : { id: crypto.randomUUID(), secret: randomSecret(), hidden },
  })
  const result = await saveProgress()
  if (!result.ok && !before.board) profileStore.write(before)
  return result
}

/** Claims a name on the board: starts saving, or renames a saved player. Reverts if taken. */
export async function claimName(name: string): Promise<SaveResult> {
  const before = profileStore.read()
  if (!before.board) return startSaving(name, false)
  const clean = cleanName(name)
  if (!clean) return { ok: false, message: 'Pick a name first.' }
  profileStore.write({ ...before, name: clean })
  const result = await saveProgress()
  // A refused rename puts the old name back but keeps what the server said about the lock.
  if (!result.ok) profileStore.write({ ...before, board: profileStore.read().board })
  return result
}

export async function stopSaving(): Promise<SaveResult> {
  const profile = profileStore.read()
  if (!profile.board) return { ok: true }
  const response = await fetch('/api/players', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: profile.board.id, secret: profile.board.secret }),
  }).catch(() => null)
  if (!response || (!response.ok && response.status !== 404)) {
    return { ok: false, message: 'Could not reach the server. Try again.' }
  }
  profileStore.write({ ...profile, board: null })
  return { ok: true }
}

export function restoreLink(profile: Profile): string | null {
  if (!profile.board) return null
  return `${window.location.origin}/restore#${profile.board.id}.${profile.board.secret}`
}

export async function restoreFrom(id: string, secret: string): Promise<SaveResult> {
  const response = await fetch('/api/players/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, secret }),
  }).catch(() => null)
  if (!response) return { ok: false, message: 'Could not reach the server. Try again.' }
  if (!response.ok) return { ok: false, ...(await readProblem(response)) }
  const body = (await response.json()) as { profile: unknown; hidden: boolean }
  const restored = checkProfile({ ...(body.profile as object), board: null })
  if (!restored) return { ok: false, message: 'That saved progress could not be read.' }
  profileStore.write({ ...restored, board: { id, secret, hidden: body.hidden === true } })
  return { ok: true }
}

/** Celebrates everything a finished run unlocked, one toast at a time. */
export function announce(outcome: RunOutcome) {
  if (outcome.levelUp) {
    const title = LEVELS[outcome.levelUp.to - 1]?.title ?? ''
    toast({
      tone: 'level',
      title: `Level ${outcome.levelUp.to}: ${title}`,
      body: 'You levelled up.',
    })
  }
  for (const id of outcome.newAchievements) {
    const a = ACHIEVEMENTS.find((x) => x.id === id)
    if (a)
      toast({
        tone: 'achievement',
        art: { badge: a.id },
        title: a.title,
        body: 'Achievement unlocked',
      })
  }
  for (const id of outcome.newAvatars) {
    const a = avatarById(id)
    toast({
      tone: 'avatar',
      art: { avatar: a.id },
      title: `${a.name} avatar unlocked`,
      body: 'Pick it on your card.',
    })
  }
}
