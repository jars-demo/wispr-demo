'use client'

import { useEffect, useRef, useState } from 'react'

import { MASCOT_FAQ } from './faq'

// "Recei", a little receipt with eyes. It peeks from the bottom-left corner, follows the pointer
// with its eyes, waves when opened and answers a few fixed questions about Receipts. Fixed
// answers only, so it can never make things up.

function Buddy({ waving, look }: { waving: boolean; look: { x: number; y: number } }) {
  return (
    <svg viewBox="0 0 120 150" className="h-full w-full overflow-visible" aria-hidden="true">
      {/* arms */}
      <path
        className={waving ? 'mascot-wave' : 'mascot-arm-idle'}
        style={{ transformOrigin: '96px 78px' }}
        d="M96 78 C 110 70, 116 58, 112 46"
        fill="none"
        stroke="#141412"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M24 80 C 12 86, 8 96, 12 106"
        fill="none"
        stroke="#141412"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* paper */}
      <path
        d="M30 14h60a8 8 0 0 1 8 8v112l-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5-7-5-7 5-7-5V22a8 8 0 0 1 8-8Z"
        fill="#fffdf8"
        stroke="#141412"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* eyes */}
      <g className="mascot-blink" style={{ transformOrigin: '60px 50px' }}>
        <circle cx="47" cy="50" r="7.5" fill="#141412" />
        <circle cx="73" cy="50" r="7.5" fill="#141412" />
        <circle cx={49 + look.x * 2.5} cy={47 + look.y * 2.5} r="2.6" fill="#fff" />
        <circle cx={75 + look.x * 2.5} cy={47 + look.y * 2.5} r="2.6" fill="#fff" />
      </g>
      {/* cheeks and smile */}
      <circle cx="38" cy="63" r="4" fill="#ff5a1f" opacity="0.35" />
      <circle cx="82" cy="63" r="4" fill="#ff5a1f" opacity="0.35" />
      <path
        d="M52 66 Q 60 73 68 66"
        fill="none"
        stroke="#141412"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* receipt lines and tick */}
      <rect x="40" y="84" width="40" height="3.5" rx="1.75" fill="#d6d6d3" />
      <rect x="40" y="94" width="26" height="3.5" rx="1.75" fill="#d6d6d3" />
      <path
        d="m70 102 5 5 10-11"
        fill="none"
        stroke="#ff5a1f"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Mascot() {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = button.current?.getBoundingClientRect()
        if (!rect) return
        const dx = event.clientX - (rect.left + rect.width / 2)
        const dy = event.clientY - (rect.top + rect.height / 3)
        const length = Math.hypot(dx, dy) || 1
        setLook({ x: dx / length, y: dy / length })
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="pointer-events-none fixed bottom-0 left-3 z-40 flex flex-col items-start sm:left-6">
      {open ? (
        <div
          role="dialog"
          aria-label="Questions about Receipts"
          className="mascot-pop glass-strong pointer-events-auto mb-2 w-[min(20rem,calc(100vw-1.5rem))] rounded-panel p-4 shadow-lift"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <p className="text-[15px] leading-snug">
              <span className="font-semibold">Hi, I&rsquo;m Recei.</span> Ask me anything about
              Receipts.
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="m4 4 8 8m0-8-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          {answer ? (
            <p
              aria-live="polite"
              className="mb-3 rounded-card bg-surface-2 p-3 text-[14px] leading-relaxed text-ink-2"
            >
              {answer}
            </p>
          ) : null}
          <ul className="flex flex-wrap gap-1.5">
            {MASCOT_FAQ.map((item) => (
              <li key={item.question}>
                <button
                  type="button"
                  onClick={() => setAnswer(item.answer)}
                  className="rounded-full bg-surface px-3 py-1.5 text-left text-[13px] text-ink-2 shadow-soft transition-colors hover:bg-accent-wash hover:text-ink"
                >
                  {item.question}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Hide Recei' : 'Ask Recei about Receipts'}
        onClick={() => {
          setOpen((v) => !v)
          setAnswer(null)
        }}
        className={`mascot-peek pointer-events-auto h-24 w-20 sm:h-28 sm:w-24 ${open ? 'is-open' : ''}`}
      >
        <Buddy waving={open} look={look} />
      </button>
    </div>
  )
}
