import { z } from 'zod'

import { parseChangeLink } from './feed'

// Shared breakdowns: a player chooses, per breakdown, to make it public so others can learn from
// it. Off by default. Only public GitHub changes the server broke down itself can be shared, so
// private code and pasted diffs never leave the browser that made them.

/** How many breakdowns one visitor can share in a day. */
export const SHARES_PER_DAY = 20

const credentials = { id: z.uuid(), secret: z.string().min(20).max(100) }

export const shareSchema = z.object({
  ...credentials,
  url: z.string().min(1).max(500),
  only: z.string().max(400).nullable().optional(),
})

export const ownerSchema = z.object(credentials)

export type SharedItem = {
  id: string
  name: string
  avatar: string
  repo: string
  title: string
  url: string
  only: string | null
  at: string
  /** How many players shared this same change. */
  sharers: number
}

export type MyShare = Pick<SharedItem, 'id' | 'repo' | 'title' | 'url' | 'only' | 'at'>

/** Where a shared breakdown is played. */
export function sharedHref(id: string): string {
  return `/b?shared=${encodeURIComponent(id)}`
}

/** "vercel/next.js #123", "vercel/next.js @ 1a2b3c4" or the repo for a compare. */
export function changeLabel(url: string): string {
  const link = parseChangeLink(url)
  if (!link) return 'a change'
  if (link.pr) return `${link.repo} #${link.pr}`
  if (link.sha) return `${link.repo} @ ${link.sha.slice(0, 7)}`
  return link.repo
}
