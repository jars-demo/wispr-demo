'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { refreshBoard } from '@/features/board/board-store'
import { toast } from '@/features/fx/toasts'

import { profileStore, startSaving } from './store'

// The whole "sign-up": a name. Progress is saved and, unless hidden, joins the board.

export function SaveForm() {
  const profile = profileStore.use()
  const [name, setName] = useState(profile.name)
  const [hidden, setHidden] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    const result = await startSaving(name, hidden)
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    toast({
      tone: 'info',
      icon: '💾',
      title: 'Progress saved',
      body: hidden
        ? 'Saved privately. Grab your restore link on your card.'
        : 'You are on the board.',
    })
    void refreshBoard()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="player-name" className="sr-only">
          Your name on the board
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          placeholder="Your name or handle"
          autoComplete="nickname"
          className="h-11 min-w-0 flex-1 rounded-full border border-hairline-strong bg-surface px-4 text-[15px]"
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className={buttonStyles('primary', 'lg')}
        >
          {busy ? 'Saving…' : 'Save my progress'}
        </button>
      </div>
      <label className="flex items-center gap-2 px-1 text-[13px] text-ink-2">
        <input
          type="checkbox"
          checked={hidden}
          onChange={(event) => setHidden(event.target.checked)}
          className="size-4 accent-[var(--accent)]"
        />
        Keep me off the public board
      </label>
      {error ? (
        <p role="alert" className="px-1 text-[13px] text-bad">
          {error}
        </p>
      ) : null}
    </form>
  )
}
