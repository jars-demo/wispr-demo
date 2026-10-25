'use client'

import {
  ChevronsUp,
  CircleAlert,
  CircleCheck,
  Sparkles,
  Swords,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'

import { dismiss, useToasts, type Toast, type ToastTone } from './toasts'

// Side notifications, stacked on the right on wide screens and at the top on phones. They spring
// in, slide out, and the rest reflow smoothly when one leaves.

const TONE: Record<ToastTone, { box: string; icon: LucideIcon; iconBox: string }> = {
  xp: { box: 'bg-surface', icon: Sparkles, iconBox: 'bg-accent text-accent-on' },
  achievement: { box: 'bg-surface', icon: Sparkles, iconBox: 'bg-accent text-accent-on' },
  avatar: { box: 'bg-surface', icon: Sparkles, iconBox: 'bg-accent text-accent-on' },
  level: { box: 'bg-ink text-canvas', icon: ChevronsUp, iconBox: 'bg-accent text-accent-on' },
  rival: { box: 'bg-ink text-canvas', icon: Swords, iconBox: 'bg-canvas/15 text-canvas' },
  info: { box: 'bg-surface', icon: CircleCheck, iconBox: 'bg-ok-wash text-ok' },
  error: { box: 'bg-surface', icon: CircleAlert, iconBox: 'bg-bad-wash text-bad' },
}

function Art({ t }: { t: Toast }) {
  if (t.art && 'badge' in t.art) return <Badge id={t.art.badge} size={40} />
  if (t.art && 'avatar' in t.art) return <Avatar id={t.art.avatar} size={40} />
  const Icon = TONE[t.tone].icon
  return (
    <span
      className={`grid size-10 shrink-0 place-items-center rounded-full ${TONE[t.tone].iconBox}`}
    >
      <Icon aria-hidden="true" className="size-5" strokeWidth={2} />
    </span>
  )
}

export function Toaster() {
  const toasts = useToasts()
  const reduce = useReducedMotion()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+4.75rem)] right-3 left-3 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-[22rem]"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reduce}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 40, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex w-full items-center gap-3 rounded-[1.1rem] py-2.5 pr-2 pl-2.5 shadow-[var(--shadow-lift)] ring-1 ring-hairline ${TONE[t.tone].box}`}
          >
            <Art t={t} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[14px] leading-snug font-semibold tracking-tight">
                {t.title}
              </span>
              {t.body ? (
                <span className="text-[13px] leading-snug opacity-70">{t.body}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
              className="grid size-8 shrink-0 place-items-center rounded-full opacity-50 transition hover:bg-ink/5 hover:opacity-100"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
