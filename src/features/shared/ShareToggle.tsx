'use client'

import { Globe, Lock } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'

import { sharedHref } from '@/domain/shared'

import type { ShareState } from './useShare'

// The consent switch on the score screen. Off until the player turns it on, and every share can
// be made private again here or on the card page. Only shown for public GitHub changes.

export function ShareToggle({ state }: { state: ShareState }) {
  const reduce = useReducedMotion()
  const { sharedId, busy, ready } = state
  const on = sharedId !== null

  function toggle() {
    void (on ? state.unshare() : state.share())
  }

  return (
    <div className="glass flex flex-col gap-3 rounded-panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 id="share-title" className="text-[15px] font-semibold">
            Make this breakdown public
          </h3>
          <p id="share-note" className="text-[14px] text-ink-2">
            Others can play it on Learn from others, with your name on it. The code is already
            public on GitHub. You can make it private again any time.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-labelledby="share-title"
          aria-describedby="share-note"
          disabled={!ready || busy}
          onClick={toggle}
          className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${on ? 'bg-accent' : 'bg-surface-2 ring-1 ring-hairline'}`}
        >
          <motion.span
            aria-hidden="true"
            animate={{ x: on ? 20 : 0 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 32 }}
            className="size-6 rounded-full bg-canvas shadow-[var(--shadow-soft)]"
          />
        </button>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        {on ? (
          <>
            <span className="inline-flex items-center gap-1.5 font-medium text-ok">
              <Globe aria-hidden="true" className="size-4" />
              Public
            </span>
            <Link
              href={sharedHref(sharedId)}
              className="font-medium text-accent-text underline-offset-4 hover:underline"
            >
              See it as others will
            </Link>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-muted">
            <Lock aria-hidden="true" className="size-4" />
            {ready ? 'Private. Only you have seen it.' : 'Claim a name above to share it.'}
          </span>
        )}
      </p>
    </div>
  )
}
