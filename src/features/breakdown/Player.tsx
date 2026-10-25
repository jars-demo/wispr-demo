'use client'

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
import { loadBreakdown, LoadError, readPasted, type Loaded } from './load'
import { Concepts } from './rounds/Concepts'
import { ExplainBack } from './rounds/ExplainBack'
import { Quiz } from './rounds/Quiz'
import { Replay } from './rounds/Replay'
import { Results } from './rounds/Results'
import { hrefFor, readRequest, runKey, runSource, type Request } from './source'

// The breakdown game: replay, engineering, predict, explain back, score.

const ROUNDS = ['Replay', 'Engineering', 'Predict', 'Explain', 'Score'] as const

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string; code: string }
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
            ? { status: 'error', message: error.message, code: error.code }
            : { status: 'error', message: 'Something went wrong. Try again.', code: 'error' },
        )
      })
    return () => {
      cancelled = true
    }
  }, [request, key, fresh])

  const go = useCallback((next: number) => {
    setRound(next)
    setReached((r) => Math.max(r, next))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

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
      <div className="glass mt-10 flex flex-col items-center gap-4 rounded-panel px-6 py-14 text-center">
        <p className="text-4xl" aria-hidden="true">
          🧩
        </p>
        <p role="alert" className="max-w-md text-[16px]">
          {state.message}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={onRetry} className={buttonStyles('primary')}>
            Try again
          </button>
          {['no_github', 'bad_key', 'rate_limited', 'too_large', 'ai_not_configured'].includes(
            state.code,
          ) ? (
            <Link href="/settings" className={buttonStyles('secondary')}>
              Open settings
            </Link>
          ) : null}
          <Link href="/" className={buttonStyles('ghost')}>
            Back to the wire
          </Link>
        </div>
      </div>
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
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  round === i
                    ? 'bg-ink text-canvas'
                    : i < reached
                      ? 'text-ink hover:bg-surface-2'
                      : 'text-muted'
                }`}
              >
                <span className="tabular-nums opacity-60">{i + 1}</span>
                {name}
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

      <div key={round} className="rise">
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
      </div>

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
