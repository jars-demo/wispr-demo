'use client'

import { X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import type { CardData } from '@/domain/card'

import { ScaledCard } from './ScaledCard'
import { ShareActions } from './ShareActions'

// The moment a breakdown is done: your fresh card rises up with "Post on X" right there, so
// sharing never means a trip to another page. A native <dialog> for focus trapping and Escape.

export function CardModal({
  card,
  open,
  onClose,
}: {
  card: CardData
  open: boolean
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const reduce = useReducedMotion()

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
        // A click on the backdrop (the dialog itself, outside the panel) closes it.
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="card-modal-title"
      className="card-modal m-auto w-[min(44rem,calc(100vw-2rem))] max-w-none bg-transparent p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="glass-strong flex flex-col gap-5 rounded-panel p-4 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <h2 id="card-modal-title" className="font-display text-3xl tracking-tight">
                  Your card is ready
                </h2>
                <p className="text-[14px] text-ink-2">
                  Post it on X. The link opens your card on wispr.jishanahmed.in.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-ink/5 hover:text-ink"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <motion.div
              initial={reduce ? false : { rotateX: 18, y: 20, opacity: 0 }}
              animate={{ rotateX: 0, y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 160, damping: 20, delay: 0.12 }}
              style={{ transformPerspective: 1200 }}
            >
              <ScaledCard card={card} label={`Your card: ${card.name}, ${card.xp} XP`} />
            </motion.div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ShareActions card={card} size="field" />
              <Link
                href="/me"
                className="text-[13px] font-medium text-accent-text underline-offset-4 hover:underline"
              >
                Change avatar or style
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </dialog>
  )
}
