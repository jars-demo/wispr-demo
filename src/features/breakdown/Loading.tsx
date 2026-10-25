'use client'

import { useEffect, useMemo, useState } from 'react'

// While the AI works, the change's title breaks into pieces that drift apart, and the stages of
// the work are named honestly. Nothing here pretends to be real output.

const STAGES = [
  'Fetching the change…',
  'Reading every line…',
  'Finding the engineering behind it…',
  'Writing your questions…',
  'Checking every line it cites is real…',
]

function seeded(seed: number) {
  let value = seed || 1
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

export function Loading({ label }: { label: string }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 2600)
    return () => window.clearInterval(id)
  }, [])

  const words = useMemo(() => {
    const random = seeded(label.length * 7919)
    return label.split(/\s+/).map((word, i) => ({
      word,
      style: {
        '--dx': `${(random() - 0.5) * 60}px`,
        '--dy': `${(random() - 0.5) * 40}px`,
        '--rot': `${(random() - 0.5) * 24}deg`,
        '--delay': `${i * 90}ms`,
      } as React.CSSProperties,
    }))
  }, [label])

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-8 py-16 text-center"
    >
      <p
        className="font-display text-4xl leading-tight tracking-tight sm:text-5xl"
        aria-hidden="true"
      >
        {words.map((w, i) => (
          <span key={i} className="piece mx-1.5" style={w.style}>
            {w.word}
          </span>
        ))}
      </p>
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {STAGES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-10 rounded-full transition-colors duration-700 ${i <= stage ? 'bg-accent' : 'bg-surface-2'}`}
            />
          ))}
        </div>
        <p className="text-[15px] text-ink-2">{STAGES[stage]}</p>
        <span className="sr-only">Breaking down {label}</span>
      </div>
      <p className="max-w-sm text-[13px] text-muted">
        Big changes take up to a minute. Tip: in the explain-back round, hold the Wispr Flow key and
        just talk.
      </p>
    </div>
  )
}
