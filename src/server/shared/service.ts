import 'server-only'

import type { MyShare } from '@/domain/shared'
import { findOwnPlayer, insertEvents } from '@/server/board/repository'
import { hashSecret } from '@/server/board/service'
import { cacheKeyFor, readCached } from '@/server/breakdown/cache'
import type { Db } from '@/server/db'
import { parseGitHubLink } from '@/server/providers/github'

import {
  deleteOwnShare,
  findOwnShareId,
  findShare,
  insertShare,
  ownShares,
  recentShares,
  refreshShare,
  type SharedRecord,
} from './repository'

// Sharing is consent per breakdown. What gets shared is never what the browser sends: it is the
// server's own cached breakdown of a public GitHub link. The cache only ever holds diffs the
// server fetched from github.com without a token, so a private repo or a pasted diff cannot be
// shared, and the text is the grounded model output, not something a client wrote.

export type ShareInput = { id: string; secret: string; url: string; only?: string | null }

export type ShareOutcome =
  | { ok: true; id: string; created: boolean }
  | { ok: false; status: 404 | 410 | 422; reason: string; code: string }

export async function shareBreakdown(db: Db, input: ShareInput): Promise<ShareOutcome> {
  const link = parseGitHubLink(input.url)
  if (!link) {
    return {
      ok: false,
      status: 422,
      reason: 'Only public GitHub changes can be shared.',
      code: 'not_shareable',
    }
  }
  const secretHash = await hashSecret(input.secret)
  const owner = await findOwnPlayer(db, input.id, secretHash)
  if (!owner) {
    return {
      ok: false,
      status: 404,
      reason: 'Claim a name first, so your share has a name on it.',
      code: 'not_saved',
    }
  }

  const only = input.only ?? null
  const sourceKey = cacheKeyFor(link, only ? [only] : null)
  const result = await readCached(db, sourceKey)
  if (!result) {
    return {
      ok: false,
      status: 410,
      reason: 'This breakdown can no longer be shared. Break it down again, then share it.',
      code: 'not_shareable',
    }
  }
  const title = result.breakdown.title.slice(0, 300)

  return db.transaction(async (tx): Promise<ShareOutcome> => {
    const existing = await findOwnShareId(tx, input.id, sourceKey)
    if (existing) {
      await refreshShare(tx, existing, result, title)
      return { ok: true, id: existing, created: false }
    }
    const id = crypto.randomUUID()
    await insertShare(tx, {
      id,
      playerId: input.id,
      sourceKey,
      url: `https://github.com/${link.owner}/${link.repo}/${link.path}`,
      only,
      repo: `${link.owner}/${link.repo}`,
      title,
      result,
    })
    // Hidden players can share, but they stay out of the live feed.
    if (!owner.hidden) await insertEvents(tx, input.id, [{ kind: 'shared', detail: id }])
    return { ok: true, id, created: true }
  })
}

export async function unshareBreakdown(
  db: Db,
  shareId: string,
  owner: { id: string; secret: string },
): Promise<boolean> {
  return deleteOwnShare(db, shareId, owner.id, await hashSecret(owner.secret))
}

export async function listMyShares(
  db: Db,
  owner: { id: string; secret: string },
): Promise<MyShare[]> {
  return ownShares(db, owner.id, await hashSecret(owner.secret))
}

export const listShared = recentShares

export function loadShare(db: Db, id: string): Promise<SharedRecord | null> {
  return findShare(db, id)
}
