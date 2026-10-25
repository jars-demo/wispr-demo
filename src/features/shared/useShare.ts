'use client'

import { useState } from 'react'

import { toast } from '@/features/fx/toasts'
import { profileStore } from '@/features/game/store'

import { shareRun, unshareRun } from './api'

// One breakdown's public state, shared by the popup and the switch on the score screen so both
// always agree. Sharing the same change twice returns the same id, so a retry is harmless.

export type ShareState = {
  sharedId: string | null
  busy: boolean
  /** False until the player has claimed a name: every share carries one. */
  ready: boolean
  share: () => Promise<boolean>
  unshare: () => Promise<boolean>
}

export function useShare(url: string, only: string | null): ShareState {
  const board = profileStore.use().board
  const [sharedId, setSharedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function share(): Promise<boolean> {
    if (!board || busy) return false
    setBusy(true)
    const result = await shareRun({ id: board.id, secret: board.secret }, url, only)
    setBusy(false)
    if (!result.ok) {
      toast({ tone: 'error', title: result.message })
      return false
    }
    setSharedId(result.id)
    toast({ tone: 'info', title: 'Shared', body: 'Others can learn from it now.' })
    return true
  }

  async function unshare(): Promise<boolean> {
    if (!board || busy || !sharedId) return false
    setBusy(true)
    const ok = await unshareRun({ id: board.id, secret: board.secret }, sharedId)
    setBusy(false)
    if (!ok) {
      toast({ tone: 'error', title: 'Could not make it private. Try again.' })
      return false
    }
    setSharedId(null)
    toast({ tone: 'info', title: 'Private again', body: 'It is off Learn from others.' })
    return true
  }

  return { sharedId, busy, ready: board !== null, share, unshare }
}
