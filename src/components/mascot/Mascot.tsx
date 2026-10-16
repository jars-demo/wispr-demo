'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MASCOT_FAQ } from './faq'

// "Recei", a little receipt with eyes. Now and then it gets up and strolls along the bottom of
// the screen, then rests and peeks. Its eyes follow the pointer, it hops on hover, waves when
// opened and answers a few fixed questions, so it never makes things up. It stays put while
// open, while the tab is hidden, and for people who prefer reduced motion.

const WIDTH = 96
const WALK_SPEED = 120 // pixels per second
const TRICKS = ['trick-flip', 'trick-spin', 'trick-jump'] as const
type Trick = (typeof TRICKS)[number]

function Buddy({
  waving,
  walking,
  look,
}: {
  waving: boolean
  walking: boolean
  look: { x: number; y: number }
}) {
  return (
    <svg viewBox="0 0 120 160" className="h-full w-full overflow-visible" aria-hidden="true">
      {/* legs */}
      <g className={walking ? 'mascot-legs-walk' : ''}>
        <path
          className="mascot-leg-a"
          style={{ transformOrigin: '48px 136px' }}
          d="M48 136 L46 152 L38 153"
          fill="none"
          stroke="#141412"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          className="mascot-leg-b"
          style={{ transformOrigin: '72px 136px' }}
          d="M72 136 L74 152 L82 153"
          fill="none"
          stroke="#141412"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g className={walking ? 'mascot-bob' : ''}>
        {/* arms */}
        <path
          className={waving ? 'mascot-wave' : walking ? 'mascot-swing' : ''}
          style={{ transformOrigin: '96px 78px' }}
          d="M96 78 C 110 70, 116 58, 112 46"
          fill="none"
          stroke="#141412"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          className={walking ? 'mascot-swing-late' : ''}
          style={{ transformOrigin: '24px 80px' }}
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
          d={waving ? 'M50 64 Q 60 76 70 64' : 'M52 66 Q 60 73 68 66'}
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
      </g>
    </svg>
  )
}

function bounds(): { min: number; max: number } {
  const min = window.innerWidth < 640 ? 10 : 24
  // Keep clear of the back-to-top button in the right corner.
  const max = Math.max(min, window.innerWidth - WIDTH - 80)
  return { min, max }
}

export function Mascot() {
  const [open, setOpen] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [look, setLook] = useState({ x: 0, y: 0 })
  const [x, setX] = useState(24)
  const [facing, setFacing] = useState<1 | -1>(1)
  const [walk, setWalk] = useState<{ ms: number } | null>(null)
  const [awake, setAwake] = useState(false)
  const [trick, setTrick] = useState<Trick | null>(null)
  const pathname = usePathname()
  const firstPath = useRef(true)
  const button = useRef<HTMLButtonElement>(null)
  const openRef = useRef(open)
  const xRef = useRef(x)

  useEffect(() => {
    openRef.current = open
  }, [open])
  useEffect(() => {
    xRef.current = x
  }, [x])

  // Eyes follow the pointer.
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

  // Now and then, take a stroll to somewhere else along the bottom edge.
  const stroll = useCallback(() => {
    const { min, max } = bounds()
    if (max - min < 140) return
    let target = min + Math.random() * (max - min)
    if (Math.abs(target - xRef.current) < 140) {
      target = xRef.current > (min + max) / 2 ? min + Math.random() * 60 : max - Math.random() * 60
    }
    const ms = Math.round((Math.abs(target - xRef.current) / WALK_SPEED) * 1000)
    setFacing(target >= xRef.current ? 1 : -1)
    setAwake(true)
    setWalk({ ms })
    setX(target)
    window.setTimeout(() => {
      setWalk(null)
      if (Math.random() < 0.7) {
        setTrick(TRICKS[Math.floor(Math.random() * TRICKS.length)] ?? null)
        window.setTimeout(() => setTrick(null), 1000)
      }
      window.setTimeout(() => setAwake(false), 2600)
    }, ms)
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    let timer = 0
    const schedule = (delay: number) => {
      timer = window.setTimeout(() => {
        if (!openRef.current && !document.hidden) stroll()
        schedule(12_000 + Math.random() * 14_000)
      }, delay)
    }
    schedule(6_000)
    return () => window.clearTimeout(timer)
  }, [stroll])

  // A new page: turn like a page.
  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false
      return
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const start = window.setTimeout(() => {
      setAwake(true)
      setTrick('trick-flip')
    }, 0)
    const stop = window.setTimeout(() => {
      setTrick(null)
      setAwake(false)
    }, 1600)
    return () => {
      window.clearTimeout(start)
      window.clearTimeout(stop)
    }
  }, [pathname])

  // Stay on screen after a resize.
  useEffect(() => {
    const onResize = () => {
      const { min, max } = bounds()
      setX((current) => Math.min(Math.max(current, min), max))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
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

  const onRight = typeof window !== 'undefined' && x > window.innerWidth / 2

  return (
    <div
      className="pointer-events-none fixed bottom-0 left-0 z-40"
      style={{
        transform: `translateX(${x}px)`,
        transition: walk ? `transform ${walk.ms}ms linear` : 'none',
      }}
    >
      {open ? (
        <div
          role="dialog"
          aria-label="Questions about Receipts"
          className={`mascot-pop glass-strong pointer-events-auto absolute bottom-full mb-1 w-[min(20rem,calc(100vw-1.5rem))] rounded-panel p-4 shadow-lift ${
            onRight ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
          }`}
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
          setWalk(null)
        }}
        className={`mascot pointer-events-auto block h-24 w-20 sm:h-28 sm:w-24 ${
          open || walk || awake ? 'is-up' : ''
        }`}
      >
        <span
          className="block h-full w-full transition-transform duration-300"
          style={{ transform: `scaleX(${facing})` }}
        >
          <span className={`block h-full w-full ${trick ?? ''}`}>
            <Buddy waving={open} walking={walk !== null} look={{ x: look.x * facing, y: look.y }} />
          </span>
        </span>
      </button>
    </div>
  )
}
