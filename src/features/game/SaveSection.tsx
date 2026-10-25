'use client'

import { Eye, EyeOff, Link2, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { refreshBoard } from '@/features/board/board-store'
import { toast } from '@/features/fx/toasts'
import { useHydrated } from '@/lib/local-store'

import { NameClaim } from './NameClaim'
import { profileStore, restoreLink, startSaving, stopSaving } from './store'

// Saving without an account: claim a name, then a restore link for other devices, a switch to
// stay off the public board, and a way out.

export function SaveSection() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const [busy, setBusy] = useState(false)

  if (!hydrated) return <div className="h-24 animate-pulse rounded-card bg-surface-2/60" />

  const board = profile.board
  if (!board) return <NameClaim id="settings-name" />

  async function setHidden(hidden: boolean) {
    setBusy(true)
    const result = await startSaving(profile.name, hidden)
    setBusy(false)
    if (!result.ok) toast({ tone: 'error', title: result.message })
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
            title: 'Saved progress deleted',
            body: 'Your progress stays in this browser.',
          }
        : { tone: 'error', title: result.message },
    )
    void refreshBoard()
  }

  async function copyRestore() {
    const link = restoreLink(profile)
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      toast({
        tone: 'info',
        title: 'Restore link copied',
        body: 'Anyone with it can change your progress. Keep it to yourself.',
      })
    } catch {
      toast({ tone: 'error', title: 'Copy failed', body: 'Your browser blocked the clipboard.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <NameClaim id="settings-name" />
      <p className="text-[13px] text-muted">
        {board.hidden ? 'Saved privately, off the public board.' : 'Saved and on the public board.'}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void copyRestore()}
          className={buttonStyles('secondary', 'field')}
        >
          <Link2 aria-hidden="true" className="size-4" />
          Copy restore link
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void setHidden(!board.hidden)}
          className={buttonStyles('secondary', 'field')}
        >
          {board.hidden ? (
            <Eye aria-hidden="true" className="size-4" />
          ) : (
            <EyeOff aria-hidden="true" className="size-4" />
          )}
          {board.hidden ? 'Show me on the board' : 'Hide me from the board'}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void remove()}
          className={buttonStyles('ghost', 'field')}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete saved progress
        </button>
      </div>
    </div>
  )
}
