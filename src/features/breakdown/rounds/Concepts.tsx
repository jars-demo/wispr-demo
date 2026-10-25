'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { Concept } from '@/domain/breakdown'
import type { ParsedDiff } from '@/domain/diff'

import { DiffView } from '../DiffView'

// Round 2: the engineering behind it. Each concept is a card you flip to unlock.

function ConceptCard({
  concept,
  diff,
  isNew,
  flipped,
  onFlip,
}: {
  concept: Concept
  diff: ParsedDiff
  isNew: boolean
  flipped: boolean
  onFlip: () => void
}) {
  const [showCode, setShowCode] = useState(false)
  return (
    <div className={`flip ${flipped ? 'is-flipped' : ''}`}>
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
          className="flip-back flex min-h-56 flex-col gap-3 rounded-panel bg-surface p-5 ring-1 ring-hairline"
        >
          <span className="text-[17px] font-semibold tracking-tight">{concept.name}</span>
          <p className="text-[14px] leading-relaxed text-ink-2">{concept.explain}</p>
          <p className="text-[14px] leading-relaxed">
            <span className="font-medium">Why here: </span>
            {concept.whyHere}
          </p>
          {concept.analogy ? (
            <p className="rounded-card bg-surface-2 px-3 py-2 text-[14px] leading-relaxed">
              <span aria-hidden="true">💡 </span>
              {concept.analogy}
            </p>
          ) : null}
          {flipped ? (
            <button
              type="button"
              onClick={() => setShowCode((s) => !s)}
              className="self-start text-[13px] font-medium text-accent-text underline-offset-4 hover:underline"
            >
              {showCode ? 'Hide the code' : 'See it in the code'}
            </button>
          ) : null}
          {showCode && flipped ? (
            <DiffView
              diff={diff}
              hot={new Set(concept.refs)}
              focus={new Set(concept.refs)}
              maxHeight="16rem"
            />
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
  const all = flipped.size === concepts.length
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[15px] text-ink-2">
        The engineering behind it. Flip every card to unlock its concept.
        <span className="ml-2 font-medium text-ink tabular-nums">
          {flipped.size}/{concepts.length} unlocked
        </span>
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {concepts.map((concept, i) => (
          <ConceptCard
            key={concept.name}
            concept={concept}
            diff={diff}
            isNew={!known(concept.name)}
            flipped={flipped.has(i)}
            onFlip={() => setFlipped((s) => new Set(s).add(i))}
          />
        ))}
      </div>
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
