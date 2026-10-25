'use client'

import { dismiss, useToasts, type ToastTone } from './toasts'

// Side notifications, stacked on the right on wide screens and at the top on phones.

const TONE: Record<ToastTone, string> = {
  xp: 'bg-accent-wash',
  achievement: 'bg-accent-wash',
  avatar: 'bg-accent-wash',
  level: 'bg-ink text-canvas',
  rival: 'bg-ink text-canvas',
  info: 'bg-surface',
  error: 'bg-bad-wash',
}

export function Toaster() {
  const toasts = useToasts()
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-[calc(env(safe-area-inset-top)+4.5rem)] right-3 left-3 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-80"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => dismiss(t.id)}
          className={`toast-in pointer-events-auto flex w-full items-start gap-3 rounded-card px-4 py-3 text-left shadow-[var(--shadow-lift)] ring-1 ring-hairline ${TONE[t.tone]}`}
        >
          <span aria-hidden="true" className="text-2xl leading-none">
            {t.icon}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[14px] font-semibold tracking-tight">{t.title}</span>
            {t.body ? <span className="text-[13px] opacity-75">{t.body}</span> : null}
          </span>
          <span className="sr-only">Dismiss</span>
        </button>
      ))}
    </div>
  )
}
