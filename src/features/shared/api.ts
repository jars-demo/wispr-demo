'use client'

import type { MyShare, SharedItem } from '@/domain/shared'

// Browser calls for shared breakdowns. The player's secret only ever travels in a request body.

type Owner = { id: string; secret: string }
export type ShareResult = { ok: true; id: string } | { ok: false; message: string }

async function problemMessage(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as { title?: string } | null
  return body?.title ?? 'Something went wrong. Try again.'
}

export async function shareRun(
  owner: Owner,
  url: string,
  only: string | null,
): Promise<ShareResult> {
  try {
    const response = await fetch('/api/shared', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...owner, url, only }),
    })
    if (!response.ok) return { ok: false, message: await problemMessage(response) }
    const { id } = (await response.json()) as { id: string }
    return { ok: true, id }
  } catch {
    return { ok: false, message: 'Could not reach Breakdown. Check your connection.' }
  }
}

export async function unshareRun(owner: Owner, id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/shared/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner),
    })
    // Already gone counts as private.
    return response.ok || response.status === 404
  } catch {
    return false
  }
}

export async function fetchMyShares(owner: Owner): Promise<MyShare[] | null> {
  try {
    const response = await fetch('/api/shared/mine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner),
    })
    if (!response.ok) return null
    return ((await response.json()) as { items: MyShare[] }).items
  } catch {
    return null
  }
}

export async function fetchShared(): Promise<SharedItem[] | null> {
  try {
    const response = await fetch('/api/shared', { cache: 'no-store' })
    if (!response.ok) return null
    return ((await response.json()) as { items: SharedItem[] }).items
  } catch {
    return null
  }
}
