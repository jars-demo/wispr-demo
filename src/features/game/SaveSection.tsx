'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { refreshBoard } from '@/features/board/board-store'
import { toast } from '@/features/fx/toasts'
import { useHydrated } from '@/lib/local-store'

import { SaveForm } from './SaveForm'
import { profileStore, restoreLink, startSaving, stopSaving } from './store'

// Saving without an account: a name, a restore link for other devices, and a way out.

export function SaveSection() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const [busy, setBusy] = useState(false)

  if (!hydrated) return <div className="h-24 animate-pulse rounded-card bg-surface-2/60" />
  if (!profile.board) return <SaveForm />

  const board = profile.board
  const link = restoreLink(profile)

  async function setHidden(hidden: boolean) {
    setBusy(true)
    const result = await startSaving(profile.name, hidden)
    setBusy(false)
    if (!result.ok) toast({ tone: 'error', icon: '⚠️', title: result.message })
    else void refreshBoard()
  }

  async function remove() {
    setBusy(true)
    const result = await stopSaving()
    setBusy(false)
    toast(
      result.ok
        ? {
            tone: 'info',
            icon: '🗑️',
            title: 'Saved progress deleted',
            body: 'Your progress stays in this browser.',
          }
        : { tone: 'error', icon: '⚠️', title: result.message },
    )
    void refreshBoard()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[15px]">
        Saved as <span className="font-semibold">{profile.name || 'A developer'}</span>
        {board.hidden ? ' · kept off the public board' : ' · on the public board'}
      </p>
      <div className="flex flex-col gap-2 rounded-card bg-surface-2/70 p-4">
        <p className="text-[14px] font-medium">Your restore link</p>
        <p className="text-[13px] text-ink-2">
          Open it on another device to bring your progress along. Anyone with it can change your
          progress, so keep it to yourself.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              if (!link) return
              navigator.clipboard
                .writeText(link)
                .then(() => toast({ tone: 'info', icon: '🔑', title: 'Restore link copied' }))
                .catch(() => toast({ tone: 'error', icon: '⚠️', title: 'Copy failed' }))
            }}
            className={buttonStyles('primary')}
          >
            Copy restore link
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void setHidden(!board.hidden)}
          className={buttonStyles('secondary')}
        >
          {board.hidden ? 'Show me on the board' : 'Hide me from the board'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className={buttonStyles('ghost')}
        >
          Delete saved progress
        </button>
      </div>
    </div>
  )
}
