'use client'

import { Globe, Lock } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { changeLabel, sharedHref, type MyShare } from '@/domain/shared'
import { toast } from '@/features/fx/toasts'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { fetchMyShares, unshareRun } from './api'

// Every breakdown this player made public, each one a tap away from private again.

export function MyShares() {
  const hydrated = useHydrated()
  const board = profileStore.use().board
  const [items, setItems] = useState<MyShare[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const id = board?.id
  const secret = board?.secret

  useEffect(() => {
    if (!id || !secret) return
    let live = true
    void fetchMyShares({ id, secret }).then((result) => live && setItems(result ?? []))
    return () => {
      live = false
    }
  }, [id, secret])

  if (!hydrated || !board || !items?.length) return null

  async function makePrivate(share: MyShare) {
    if (!board) return
    setBusy(share.id)
    const ok = await unshareRun({ id: board.id, secret: board.secret }, share.id)
    setBusy(null)
    if (ok) {
      setItems((list) => list?.filter((s) => s.id !== share.id) ?? null)
      toast({ tone: 'info', title: 'Private again', body: 'It is off Learn from others.' })
    } else {
      toast({ tone: 'error', title: 'Could not make it private. Try again.' })
    }
  }

  return (
    <section aria-labelledby="shares-title" className="tile mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="shares-title"
          className="text-[13px] font-semibold tracking-wide text-ink uppercase"
        >
          Your public breakdowns
        </h2>
        <span className="text-[12.5px] text-muted tabular-nums">{items.length}</span>
      </div>
      <ul className="flex flex-col divide-y divide-hairline">
        {items.map((share) => (
          <li key={share.id} className="flex flex-wrap items-center gap-3 py-3">
            <Globe aria-hidden="true" className="size-4 shrink-0 text-ok" />
            <span className="sr-only">Public:</span>
            <Link
              href={sharedHref(share.id)}
              className="flex min-w-0 flex-1 flex-col underline-offset-4 hover:underline"
            >
              <span className="truncate text-[15px] font-medium">{share.title}</span>
              <span className="truncate font-mono text-[12px] text-muted">
                {changeLabel(share.url)}
              </span>
            </Link>
            <button
              type="button"
              disabled={busy === share.id}
              onClick={() => void makePrivate(share)}
              className={buttonStyles('secondary')}
            >
              <Lock aria-hidden="true" className="size-4" />
              Make private
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
