'use client'

import { useMemo, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { Breakdown } from '@/domain/breakdown'
import { gradeExplanation, MIN_WORDS } from '@/domain/explain'
import { XP } from '@/domain/game'
import { WisprHint } from '@/features/home/WisprHint'

// Round 4: explain it back, out loud. Talking beats typing here, so this is where Wispr Flow
// shines. Key points light up live as your explanation covers them. Scored without AI.

export function ExplainBack({
  explain,
  onDone,
}: {
  explain: Breakdown['explainBack']
  onDone: (score: number | null) => void
}) {
  const [text, setText] = useState('')
  const result = useMemo(() => gradeExplanation(text, explain.keyPoints), [text, explain.keyPoints])
  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="flex flex-col gap-5">
      <div className="glass flex flex-col gap-4 rounded-panel p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
          {explain.prompt}
        </h3>
        <WisprHint />
        <div className="glow-box rounded-card">
          <label htmlFor="explain" className="sr-only">
            Your explanation
          </label>
          <textarea
            id="explain"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            placeholder="Say it like you would to a teammate…"
            className="block w-full resize-y rounded-card bg-surface p-4 text-[16px] leading-relaxed ring-1 ring-hairline outline-none"
          />
        </div>
        <ul className="grid gap-2 sm:grid-cols-2" aria-label="Key ideas">
          {explain.keyPoints.map((point, i) => {
            const hit = result.covered[i] && !result.tooShort
            return (
              <li
                key={point.point}
                className={`flex items-start gap-2.5 rounded-card px-3 py-2.5 text-[14px] ring-1 transition-all duration-500 ${
                  hit ? 'pop bg-ok-wash ring-ok/40' : 'bg-surface ring-hairline'
                }`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${hit ? 'bg-ok text-canvas' : 'bg-surface-2 text-muted'}`}
                  aria-hidden="true"
                >
                  {hit ? '✓' : i + 1}
                </span>
                <span>
                  <span className="sr-only">{hit ? 'Covered: ' : 'Not yet: '}</span>
                  {point.point}
                </span>
              </li>
            )
          })}
        </ul>
        <p className="text-[12px] text-muted">
          Scored by matching the key ideas in your words, not by AI. Worth up to{' '}
          {100 * XP.explainPerPoint} XP.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onDone(result.score)}
            disabled={words < MIN_WORDS}
            className={buttonStyles('accent', 'lg')}
          >
            Lock it in · {result.tooShort ? 0 : result.score}%
          </button>
          <button type="button" onClick={() => onDone(null)} className={buttonStyles('ghost')}>
            Skip
          </button>
          {words < MIN_WORDS ? (
            <span className="text-[13px] text-muted">
              {MIN_WORDS - words} more {MIN_WORDS - words === 1 ? 'word' : 'words'} to go
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
