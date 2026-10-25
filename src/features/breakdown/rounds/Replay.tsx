'use client'

import { useEffect, useMemo, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { Breakdown } from '@/domain/breakdown'
import type { DiffFile, ParsedDiff } from '@/domain/diff'

import { DiffView } from '../DiffView'

// Round 1: replay what the agent did, move by move, with the lines lighting up as each step plays.

const STEP_MS = 4200

export function Replay({
  breakdown,
  diff,
  onNext,
  onLine,
  onDrill,
}: {
  breakdown: Breakdown
  diff: ParsedDiff
  onNext: () => void
  onLine: (ref: string, file: DiffFile) => void
  onDrill: ((path: string) => void) | null
}) {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(true)
  const steps = breakdown.steps
  const done = active >= steps.length - 1

  useEffect(() => {
    if (!playing || done) return
    const id = window.setTimeout(() => setActive((a) => a + 1), STEP_MS)
    return () => window.clearTimeout(id)
  }, [playing, active, done])

  const hot = useMemo(() => new Set(steps[active]?.refs ?? []), [steps, active])

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="flex flex-col gap-4">
        <p className="font-display text-2xl leading-snug tracking-tight text-balance sm:text-[28px]">
          {breakdown.gist}
        </p>
        <ol className="flex flex-col gap-2" aria-label="What your agent did">
          {steps.map((step, i) => {
            const state = i < active ? 'past' : i === active ? 'now' : 'next'
            return (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => {
                    setActive(i)
                    setPlaying(false)
                  }}
                  aria-current={state === 'now' ? 'step' : undefined}
                  className={`flex w-full gap-3 rounded-card p-3 text-left transition-all duration-500 ${
                    state === 'now'
                      ? 'glass-strong scale-[1.01] shadow-[var(--shadow-lift)]'
                      : state === 'past'
                        ? 'opacity-70 hover:opacity-100'
                        : 'opacity-45 hover:opacity-80'
                  }`}
                >
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
                      state === 'now'
                        ? 'bg-accent text-accent-on'
                        : state === 'past'
                          ? 'bg-ink text-canvas'
                          : 'bg-surface-2 text-muted'
                    }`}
                  >
                    {state === 'past' ? '✓' : i + 1}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-[15px] font-semibold tracking-tight">{step.title}</span>
                    {state === 'now' ? (
                      <span className="rise text-[14px] leading-relaxed text-ink-2">
                        {step.detail}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={buttonStyles('secondary')}
          >
            {playing && !done ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={onNext}
            className={buttonStyles(done ? 'accent' : 'ghost')}
          >
            {done ? 'Next: the engineering →' : 'Skip to the engineering'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[12px] text-muted">Tap any line to see where it is explained.</p>
        <DiffView diff={diff} hot={hot} animate onLine={onLine} onDrill={onDrill ?? undefined} />
      </div>
    </div>
  )
}
