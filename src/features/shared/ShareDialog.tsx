'use client'

import { ArrowRight, Check, Globe, Lock, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { sharedHref } from '@/domain/shared'
import { NameClaim } from '@/features/game/NameClaim'

import type { ShareState } from './useShare'

// The question asked right after a public change is broken down: make it public for others to
// learn from? Nothing is shared until the player says yes. Keeping it private is one tap, and the
// switch on the score screen can change the answer later. A native <dialog>, like the card.

export function ShareDialog({
  state,
  open,
  onClose,
}: {
  state: ShareState
  open: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const reduce = useReducedMotion()
  const { sharedId, busy, ready } = state

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="share-dialog-title"
      aria-describedby="share-dialog-note"
      className="card-modal m-auto w-[min(30rem,calc(100vw-2rem))] max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="glass-strong flex flex-col gap-5 rounded-panel p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <motion.span
                initial={reduce ? false : { scale: 0.6, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 16, delay: 0.1 }}
                className={`grid size-12 place-items-center rounded-full ${sharedId ? 'bg-ok/15 text-ok' : 'bg-accent/15 text-accent-text'}`}
              >
                {sharedId ? (
                  <Check aria-hidden="true" className="size-6" />
                ) : (
                  <Globe aria-hidden="true" className="size-6" />
                )}
              </motion.span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            {sharedId ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <h2 id="share-dialog-title" className="font-display text-3xl tracking-tight">
                    It is public
                  </h2>
                  <p id="share-dialog-note" className="text-[15px] text-ink-2">
                    Others can play it now on Learn from others, with your name on it. Turn it off
                    any time from the score screen or your profile.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className={buttonStyles('primary', 'field')}
                  >
                    Continue
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                  <Link
                    href={sharedHref(sharedId)}
                    className="text-[14px] font-medium text-accent-text underline-offset-4 hover:underline"
                  >
                    See it as others will
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <h2 id="share-dialog-title" className="font-display text-3xl tracking-tight">
                    Make this breakdown public?
                  </h2>
                  <p id="share-dialog-note" className="text-[15px] text-ink-2">
                    Others can play it on Learn from others, with your name on it. The code is
                    already public on GitHub, and you can make it private again any time.
                  </p>
                </div>
                {ready ? null : (
                  <div className="flex flex-col gap-2 rounded-card bg-surface p-3 ring-1 ring-hairline">
                    <p className="text-[14px] font-medium">First, a name to put on it</p>
                    <NameClaim id="share-name" />
                  </div>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className={buttonStyles('secondary', 'field')}
                  >
                    <Lock aria-hidden="true" className="size-4" />
                    Keep it private
                  </button>
                  <button
                    type="button"
                    disabled={!ready || busy}
                    onClick={() => void state.share()}
                    className={buttonStyles('accent', 'field')}
                  >
                    <Globe aria-hidden="true" className="size-4" />
                    {busy ? 'Sharing…' : 'Make it public'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  )
}
