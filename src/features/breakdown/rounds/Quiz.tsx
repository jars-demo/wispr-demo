'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { QuizItem } from '@/domain/breakdown'
import type { ParsedDiff } from '@/domain/diff'
import { XP } from '@/domain/game'

import { DiffView } from '../DiffView'

// Round 3: predict it. One question at a time about how this exact code behaves; every answer
// shows the real lines that prove it.

export function Quiz({
  quiz,
  diff,
  onDone,
}: {
  quiz: QuizItem[]
  diff: ParsedDiff
  onDone: (correct: number) => void
}) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const item = quiz[index]

  if (!item) {
    return (
      <div className="glass rounded-panel p-6">
        <p className="text-[15px]">No questions this time.</p>
        <button
          type="button"
          onClick={() => onDone(0)}
          className={`${buttonStyles('accent', 'lg')} mt-4`}
        >
          Next: explain it back →
        </button>
      </div>
    )
  }

  const answered = picked !== null
  const right = picked === item.answer
  const last = index === quiz.length - 1

  function pick(option: number) {
    if (answered) return
    setPicked(option)
    if (option === item?.answer) setCorrect((c) => c + 1)
  }

  function next() {
    if (last) {
      onDone(correct)
      return
    }
    setIndex((i) => i + 1)
    setPicked(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="flex gap-1.5" aria-hidden="true">
          {quiz.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full transition-colors ${i < index ? 'bg-ink' : i === index ? 'bg-accent' : 'bg-surface-2'}`}
            />
          ))}
        </div>
        <span className="text-[13px] text-muted tabular-nums">
          Question {index + 1} of {quiz.length} · {correct} right
        </span>
      </div>

      <div key={index} className="rise glass flex flex-col gap-4 rounded-panel p-5 sm:p-6">
        <h3 className="font-display text-2xl leading-snug tracking-tight text-balance sm:text-3xl">
          {item.question}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Answers">
          {item.options.map((option, i) => {
            const isAnswer = i === item.answer
            const isPicked = i === picked
            const tone = !answered
              ? 'bg-surface hover:bg-accent-wash hover:ring-accent/40'
              : isAnswer
                ? `bg-ok-wash ring-ok/50 ${isPicked ? 'pop' : ''}`
                : isPicked
                  ? 'shake bg-bad-wash ring-bad/40'
                  : 'bg-surface opacity-60'
            return (
              <button
                key={option}
                type="button"
                onClick={() => pick(i)}
                disabled={answered}
                aria-pressed={isPicked}
                className={`flex items-start gap-3 rounded-card p-4 text-left text-[15px] ring-1 ring-hairline transition-all ${tone}`}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold">
                  {answered && isAnswer
                    ? '✓'
                    : answered && isPicked
                      ? '✕'
                      : String.fromCharCode(65 + i)}
                </span>
                <span>{option}</span>
              </button>
            )
          })}
        </div>

        {answered ? (
          <div className="rise flex flex-col gap-3" aria-live="polite">
            <div className="flex items-center gap-3">
              <p className={`text-[16px] font-semibold ${right ? 'text-ok' : 'text-bad'}`}>
                {right ? 'Called it.' : 'Not quite.'}
              </p>
              {right ? (
                <span className="xp-pop rounded-full bg-accent px-2 py-0.5 text-[13px] font-bold text-accent-on">
                  +{XP.correct} XP
                </span>
              ) : null}
            </div>
            <p className="text-[15px] leading-relaxed text-ink-2">{item.why}</p>
            <DiffView
              diff={diff}
              hot={new Set(item.refs)}
              focus={new Set(item.refs)}
              maxHeight="14rem"
            />
            <div>
              <button type="button" onClick={next} className={buttonStyles('accent', 'lg')}>
                {last ? 'Next: explain it back →' : 'Next question →'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
