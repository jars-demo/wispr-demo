'use client'

import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SampleLabel } from '@/components/SampleLabel'
import { buttonStyles } from '@/components/ui/button-styles'
import { sectionsForRef } from '@/domain/breakdown'
import type { DiffFile } from '@/domain/diff'
import { XP } from '@/domain/game'
import { applyRun, conceptKey, recordDrill, type RunOutcome } from '@/domain/profile'
import { sampleById } from '@/domain/samples'
import { aiKeyStore, githubStore } from '@/features/connect/connection'
import { announce, profileStore, updateProfile } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { Loading } from './Loading'
import { Problem } from './Problem'
import { loadBreakdown, LoadError, readPasted, type Loaded } from './load'
import { Concepts } from './rounds/Concepts'
import { ExplainBack } from './rounds/ExplainBack'
import { Quiz } from './rounds/Quiz'
import { Replay } from './rounds/Replay'
import { Results } from './rounds/Results'
import { hrefFor, readRequest, runKey, runSource, type Request } from './source'

// The breakdown game: replay, engineering, predict, explain back, score.

const ROUNDS = ['Replay', 'Engineering', 'Predict', 'Explain', 'Score'] as const

// Rounds slide in the direction you travel: forward comes from the right, back from the left.
// The offset stays inside the page gutter so phones never scroll sideways mid-transition.
const SLIDE: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 12 * dir, y: 6 }),
  center: { opacity: 1, x: 0, y: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -12 * dir, y: -4 }),
}
const FADE: Variants = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; code: string; retryAfter: number | null }
  | { status: 'ready'; loaded: Loaded }

function preLabel(params: URLSearchParams): string {
  const sample = params.get('sample')
  if (sample) return sampleById(sample)?.item.title ?? 'Sample change'
  const url = params.get('url')
  if (url) return url.replace(/^https?:\/\/(www\.)?github\.com\//, '')
  const repo = params.get('repo')
  if (repo) return `${repo} ${params.get('pr') ? `#${params.get('pr')}` : ''}`
  return 'Your change'
}

export function Player() {
  const params = useSearchParams()
  const hydrated = useHydrated()
  const request = useMemo(() => readRequest(params), [params])
  const [attempt, setAttempt] = useState(0)
  const key = useMemo(
    () =>
      request && hydrated
        ? runKey(request, request.source.kind === 'paste' ? readPasted() : null)
        : null,
    [request, hydrated],
  )

  if (!request) {
    return (
      <div className="glass mt-10 flex flex-col items-center gap-4 rounded-panel px-6 py-16 text-center">
        <p className="text-xl font-semibold">Nothing to break down</p>
        <p className="text-[15px] text-muted">Pick a change on the wire, or paste a link.</p>
        <Link href="/" className={buttonStyles('primary')}>
          Back to the wire
        </Link>
      </div>
    )
  }

  const label = preLabel(new URLSearchParams(params.toString()))
  if (!key) return <Loading label={label} />

  // A new change or a retry mounts a fresh run, so every round starts clean.
  return (
    <Run
      key={`${key}:${attempt}`}
      request={request}
      runId={key}
      fresh={attempt > 0}
      label={label}
      onRetry={() => setAttempt((a) => a + 1)}
    />
  )
}

function Run({
  request,
  runId: key,
  fresh,
  label,
  onRetry,
}: {
  request: Request
  runId: string
  fresh: boolean
  label: string
  onRetry: () => void
}) {
  const router = useRouter()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [round, setRound] = useState(0)
  const [dir, setDir] = useState(1)
  const reduce = useReducedMotion()
  const [reached, setReached] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [explain, setExplain] = useState<number | null>(null)
  const [outcome, setOutcome] = useState<RunOutcome | null>(null)
  const [line, setLine] = useState<{ ref: string; file: DiffFile } | null>(null)
  const profile = profileStore.use()

  useEffect(() => {
    let cancelled = false
    loadBreakdown(request, key, { github: githubStore.read(), ai: aiKeyStore.read(), fresh })
      .then((loaded) => !cancelled && setState({ status: 'ready', loaded }))
      .catch((error: unknown) => {
        if (cancelled) return
        setState(
          error instanceof LoadError
            ? {
                status: 'error',
                message: error.message,
                code: error.code,
                retryAfter: error.retryAfter,
              }
            : {
                status: 'error',
                message: 'Something went wrong on our side. Try again.',
                code: 'error',
                retryAfter: null,
              },
        )
      })
    return () => {
      cancelled = true
    }
  }, [request, key, fresh])

  const go = useCallback(
    (next: number) => {
      setDir(next >= round ? 1 : -1)
      setRound(next)
      setReached((r) => Math.max(r, next))
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
    },
    [round, reduce],
  )

  const drill = useCallback(
    (path: string) => {
      updateProfile((p) => recordDrill(p, new Date()))
      router.push(hrefFor(request, path))
    },
    [request, router],
  )

  if (state.status === 'loading') return <Loading label={label} />

  if (state.status === 'error') {
    return (
      <Problem
        code={state.code}
        message={state.message}
        retryAfter={state.retryAfter}
        onRetry={onRetry}
      />
    )
  }

  const { loaded } = state
  const { breakdown, diff } = loaded
  const known = new Set(profile.concepts.map(conceptKey))

  function finish(score: number | null) {
    setExplain(score)
    const result = applyRun(
      profileStore.read(),
      {
        key,
        title: breakdown.title,
        source: runSource(request.source),
        correct,
        total: breakdown.quiz.length,
        explain: score,
        concepts: breakdown.concepts.map((c) => c.name),
      },
      new Date(),
    )
    updateProfile(() => result.profile)
    setOutcome(result)
    announce(result)
    go(4)
  }

  const runXp = correct * XP.correct

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-strong z-30 sm:sticky flex flex-col gap-3 rounded-panel px-4 py-3 sm:top-22 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted">
          {loaded.demo ? <SampleLabel>Sample change · ready-made breakdown</SampleLabel> : null}
          {loaded.repo ? <span className="font-mono">{loaded.repo}</span> : null}
          {request.only ? (
            <span className="rounded-full bg-accent-wash px-2 py-0.5 text-accent-text">
              Focused on {request.only}
            </span>
          ) : null}
          <span>
            {diff.files.length} {diff.files.length === 1 ? 'file' : 'files'} ·{' '}
            <span className="text-ok">+{diff.additions}</span>{' '}
            <span className="text-bad">-{diff.deletions}</span>
          </span>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 capitalize">
            {breakdown.difficulty}
          </span>
          {loaded.url ? (
            <a
              href={loaded.url}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:text-ink hover:underline"
            >
              View on GitHub
            </a>
          ) : null}
          <span className="ml-auto rounded-full bg-accent px-2.5 py-0.5 font-semibold text-accent-on tabular-nums">
            {outcome ? `+${outcome.gained}` : `+${runXp}`} XP
          </span>
        </div>
        <h1 className="text-[19px] leading-snug font-semibold tracking-tight text-balance sm:text-[22px]">
          {breakdown.title}
        </h1>
        <nav aria-label="Rounds" className="-mx-1 flex gap-1 overflow-x-auto">
          {ROUNDS.map((name, i) => {
            const open = i <= reached && !(outcome && i < 4) && !(i === 4 && !outcome)
            return (
              <button
                key={name}
                type="button"
                disabled={!open}
                onClick={() => go(i)}
                aria-current={round === i ? 'step' : undefined}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  round === i
                    ? 'text-canvas'
                    : i < reached
                      ? 'text-ink hover:bg-surface-2'
                      : 'text-muted'
                }`}
              >
                {round === i ? (
                  <motion.span
                    layoutId="round-pill"
                    aria-hidden="true"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-ink"
                  />
                ) : null}
                <span className="relative tabular-nums opacity-60">{i + 1}</span>
                <span className="relative">{name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {loaded.dropped > 0 ? (
        <p className="text-[13px] text-muted">
          The AI cited {loaded.dropped} {loaded.dropped === 1 ? 'line' : 'lines'} that are not in
          this change. We removed them.
        </p>
      ) : null}
      {diff.skipped.files.length ? (
        <p className="text-[13px] text-muted">
          Big change: this round covers the most important files. {diff.skipped.files.length} more
          can be broken down one by one at the end.
        </p>
      ) : null}

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={round}
          custom={dir}
          variants={reduce ? FADE : SLIDE}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'spring', stiffness: 380, damping: 34, opacity: { duration: 0.18 } }}
        >
          {round === 0 ? (
            <Replay
              breakdown={breakdown}
              diff={diff}
              onNext={() => go(1)}
              onLine={(ref, file) => setLine({ ref, file })}
              onDrill={drill}
            />
          ) : round === 1 ? (
            <Concepts
              concepts={breakdown.concepts}
              diff={diff}
              known={(name) => known.has(conceptKey(name))}
              onNext={() => go(2)}
            />
          ) : round === 2 ? (
            <Quiz
              quiz={breakdown.quiz}
              diff={diff}
              onDone={(n) => {
                setCorrect(n)
                go(3)
              }}
            />
          ) : round === 3 ? (
            <ExplainBack explain={breakdown.explainBack} onDone={finish} />
          ) : outcome ? (
            <Results
              outcome={outcome}
              correct={correct}
              total={breakdown.quiz.length}
              explain={explain}
              explore={breakdown.explore}
              skippedFiles={diff.skipped.files}
              saved={profile.board !== null}
              onDrill={drill}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {line ? (
        <div
          role="dialog"
          aria-label="Where this line is explained"
          className="toast-in glass-strong fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-lg flex-col gap-2 rounded-panel p-4 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate font-mono text-[12px] text-muted">{line.file.path}</p>
            <button
              type="button"
              onClick={() => setLine(null)}
              className="text-[13px] text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
          {sectionsForRef(breakdown, line.ref).length ? (
            <ul className="flex flex-col gap-1 text-[14px]">
              {sectionsForRef(breakdown, line.ref).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-ink-2">
              This line is not part of any step. Want the full story of this file?
            </p>
          )}
          <button
            type="button"
            onClick={() => drill(line.file.path)}
            className={`${buttonStyles('accent')} self-start`}
          >
            Break down this file
          </button>
        </div>
      ) : null}
    </div>
  )
}
