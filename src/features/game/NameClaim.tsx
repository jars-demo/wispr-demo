'use client'

import { Check, LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { NAME_CHANGE_DAYS } from '@/domain/board'
import { refreshBoard } from '@/features/board/board-store'
import { toast } from '@/features/fx/toasts'

import { useNameCheck, type NameStatus } from './name-check'
import { claimName, profileStore } from './store'

// The whole "sign-up": claim a name. Names are unique across the board, checked as you type.
// Claiming saves progress and puts you on the board; claiming again renames you.

const HINT: Record<NameStatus, string> = {
  empty: 'One name per player, first come first served.',
  checking: 'Checking…',
  available: 'Available',
  taken: 'Someone already has this name',
  yours: 'This name is yours',
  unknown: 'Could not check right now. You can still try.',
}

function StatusIcon({ status }: { status: NameStatus }) {
  if (status === 'checking') {
    return <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-muted" />
  }
  if (status === 'available' || status === 'yours') {
    return <Check aria-hidden="true" className="size-4 text-ok" strokeWidth={2.5} />
  }
  if (status === 'taken')
    return <X aria-hidden="true" className="size-4 text-bad" strokeWidth={2.5} />
  return null
}

export function NameClaim({ id = 'claim-name' }: { id?: string }) {
  const profile = profileStore.use()
  const claimed = profile.board ? profile.name : null
  const [name, setName] = useState(profile.name)
  const [busy, setBusy] = useState(false)
  const status = useNameCheck(name, claimed)
  const canClaim = !busy && (status === 'available' || status === 'unknown')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!canClaim) return
    setBusy(true)
    const result = await claimName(name)
    setBusy(false)
    if (!result.ok) {
      toast({ tone: 'error', title: result.message })
      return
    }
    toast({
      tone: 'info',
      title: claimed ? 'Renamed' : 'Name claimed',
      body: claimed
        ? 'Your card and the board use it now.'
        : 'Progress saved. You are on the board.',
    })
    void refreshBoard()
  }

  const hintTone =
    status === 'taken'
      ? 'text-bad'
      : status === 'available' || status === 'yours'
        ? 'text-ok'
        : 'text-muted'

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {claimed ? 'Your name' : 'Claim your name'}
      </label>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={id}
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            placeholder="Your name or handle"
            autoComplete="nickname"
            aria-invalid={status === 'taken'}
            aria-describedby={`${id}-hint`}
            className="field pr-10"
          />
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2">
            <StatusIcon status={status} />
          </span>
        </div>
        <button type="submit" disabled={!canClaim} className={buttonStyles('primary', 'field')}>
          {busy ? 'Saving…' : claimed ? 'Rename' : 'Claim'}
        </button>
      </div>
      <p id={`${id}-hint`} aria-live="polite" className={`px-1 text-[12.5px] ${hintTone}`}>
        {HINT[status]}
        {claimed ? ` · You can change it once every ${NAME_CHANGE_DAYS} days.` : null}
      </p>
    </form>
  )
}
