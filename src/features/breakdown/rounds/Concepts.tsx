'use client'

import { Code2, Lightbulb, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { Concept } from '@/domain/breakdown'
import type { ParsedDiff } from '@/domain/diff'

import { DiffView } from '../DiffView'

// Round 2: the engineering behind it. Each concept is a card you flip to unlock. "See it in the
// code" opens one full-width code panel under the cards, never inside a card: code lines do not
// wrap, and a card is too narrow to hold them on a phone.

function ConceptCard({
  concept,
  isNew,
  flipped,
  showingCode,
  onFlip,
  onCode,
}: {
  concept: Concept
  isNew: boolean
  flipped: boolean
  showingCode: boolean
  onFlip: () => void
  onCode: () => void
}) {
  return (
    <div className={`flip min-w-0 ${flipped ? 'is-flipped' : ''}`}>
      <div className="flip-inner">
        <button
          type="button"
          onClick={onFlip}
          aria-expanded={flipped}
          aria-hidden={flipped}
          tabIndex={flipped ? -1 : 0}
          className="lift glass flex min-h-56 flex-col items-start justify-between gap-4 rounded-panel p-5 text-left"
        >
          <span className="rounded-full bg-accent-wash px-2.5 py-1 text-[11px] font-semibold tracking-wider text-accent-text uppercase">
            {isNew ? 'New concept' : 'Concept'}
          </span>
          <span className="flex flex-col gap-2">
            <span className="font-display text-3xl leading-tight tracking-tight">
              {concept.name}
            </span>
            <span className="text-[15px] text-ink-2">{concept.oneLiner}</span>
          </span>
          <span className="text-[13px] font-medium text-accent-text">
            Tap to break it down {isNew ? '· +25 XP' : ''}
          </span>
        </button>
        <div
          aria-hidden={!flipped}
          className={`flip-back flex min-h-56 min-w-0 flex-col gap-3 rounded-panel bg-surface p-5 ring-1 transition-shadow ${showingCode ? 'ring-2 ring-accent' : 'ring-hairline'}`}
        >
          <span className="text-[17px] font-semibold tracking-tight">{concept.name}</span>
          <p className="text-[14px] leading-relaxed text-ink-2">{concept.explain}</p>
          <p className="text-[14px] leading-relaxed">
            <span className="font-medium">Why here: </span>
            {concept.whyHere}
          </p>
          {concept.analogy ? (
            <p className="flex gap-2 rounded-card bg-surface-2 px-3 py-2 text-[14px] leading-relaxed">
              <Lightbulb aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent-text" />
              {concept.analogy}
            </p>
          ) : null}
          {flipped ? (
            <button
              type="button"
              onClick={onCode}
              aria-pressed={showingCode}
              className="mt-auto inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-accent-text underline-offset-4 hover:underline"
            >
              <Code2 aria-hidden="true" className="size-4" />
              {showingCode ? 'Hide the code' : 'See it in the code'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function Concepts({
  concepts,
  diff,
  known,
  onNext,
}: {
  concepts: Concept[]
  diff: ParsedDiff
  known: (name: string) => boolean
  onNext: () => void
}) {
  const [flipped, setFlipped] = useState<Set<number>>(new Set())
  const [code, setCode] = useState<number | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const all = flipped.size === concepts.length
  const active = code === null ? null : (concepts[code] ?? null)

  // Bring the code panel into view when it opens or switches concept.
  useEffect(() => {
    if (code === null) return
    const id = window.setTimeout(
      () =>
        panel.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }),
      120,
    )
    return () => window.clearTimeout(id)
  }, [code, reduce])

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <p className="text-[15px] text-ink-2">
        The engineering behind it. Flip every card to unlock its concept.
        <span className="ml-2 font-medium text-ink tabular-nums">
          {flipped.size}/{concepts.length} unlocked
        </span>
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {concepts.map((concept, i) => (
          <ConceptCard
            key={concept.name}
            concept={concept}
            isNew={!known(concept.name)}
            flipped={flipped.has(i)}
            showingCode={code === i}
            onFlip={() => setFlipped((s) => new Set(s).add(i))}
            onCode={() => setCode((c) => (c === i ? null : i))}
          />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {active ? (
          <motion.div
            key="code"
            ref={panel}
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 overflow-hidden"
          >
            <section
              aria-label={`${active.name} in the code`}
              className="flex min-w-0 flex-col gap-3 rounded-panel bg-surface p-3 ring-1 ring-hairline sm:p-4"
            >
              <div className="flex items-center justify-between gap-3 px-1">
                <p className="text-[14px]">
                  <span className="text-muted">In the code: </span>
                  <span className="font-semibold">{active.name}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCode(null)}
                  aria-label="Close the code"
                  className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </div>
              <DiffView
                key={active.name}
                diff={diff}
                hot={new Set(active.refs)}
                focus={new Set(active.refs)}
                maxHeight="22rem"
              />
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div>
        <button
          type="button"
          onClick={onNext}
          className={buttonStyles(all ? 'accent' : 'ghost', 'lg')}
        >
          {all ? 'Next: predict it →' : 'Skip to the questions'}
        </button>
      </div>
    </div>
  )
}
