'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { PageHeader } from '@/components/PageShell'
import { buttonStyles } from '@/components/ui/button-styles'
import type { StructuringEngine } from '@/domain/spec'
import { isMuted, setMuted, speak, subscribeMuted, summarise } from '@/features/voice/speak'

import { ApiError, createSpec, structure } from './api'
import { ChecklistEditor } from './ChecklistEditor'
import { DictationBox } from './DictationBox'
import { finaliseDraft, PENDING_TRANSCRIPT_KEY, toDraftItems, type Draft } from './draft'
import { SaveBar } from './SaveBar'

// Step 1: say it. Step 2: check the checklist. Step 3: save. Nothing is stored until Save.

const EXAMPLE =
  'Add rate limiting to the login route, five attempts per minute per IP, and return a 429 with ' +
  'a Retry-After header. Do not touch the signup flow. Add tests for the limit and the reset. ' +
  'And maybe log the blocked attempts?'

const ENGINE_LABEL: Record<StructuringEngine, string> = {
  rules: 'Organised by built-in rules',
  model: 'Organised by Claude, checked against your words',
}

type Phase = { step: 'say' } | { step: 'review'; engine: StructuringEngine; notices: string[] }

function takePendingTranscript(): string | null {
  try {
    const value = window.sessionStorage.getItem(PENDING_TRANSCRIPT_KEY)
    window.sessionStorage.removeItem(PENDING_TRANSCRIPT_KEY)
    return value?.trim() ? value : null
  } catch {
    return null
  }
}

function VoiceToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false)
  return (
    <button
      type="button"
      aria-pressed={!muted}
      onClick={() => setMuted(!muted)}
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-[12px] text-ink-2 transition-colors hover:bg-surface"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9v6h4l5 4V5L8 9H4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {muted ? (
          <path d="m17 9 5 6m0-6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path
            d="M17 8.5a5 5 0 0 1 0 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
      {muted ? 'Voice off' : 'Voice on'}
    </button>
  )
}

export function SpecComposer() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [phase, setPhase] = useState<Phase>({ step: 'say' })
  const [draft, setDraft] = useState<Draft>({ title: '', items: [] })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // One id per draft makes a double-clicked or retried save land on the same checklist.
  const clientId = useRef<string | null>(null)
  const started = useRef(false)

  async function organise(text: string) {
    setTranscript(text)
    setBusy(true)
    setError(null)
    try {
      const result = await structure(text)
      if (result.items.length === 0) {
        setError('Nothing to act on was found. Try describing what you want changed.')
        return
      }
      setDraft({ title: result.title, items: toDraftItems(result.items, crypto.randomUUID()) })
      setPhase({ step: 'review', engine: result.engine, notices: result.notices })
      window.scrollTo({ top: 0 })
      speak(
        summarise({
          todo: result.items.filter((item) => item.kind === 'requirement').length,
          leaveAlone: result.items.filter((item) => item.kind === 'non_goal').length,
          questions: result.items.filter((item) => item.kind === 'open_question').length,
        }),
      )
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  // Words spoken on the landing page arrive through sessionStorage and are organised straight
  // away. This page is prerendered, so the storage can only be read after hydration: a one-time
  // sync with an external system on mount. The ref guard stops a second submit in Strict Mode.
  useEffect(() => {
    if (started.current) return
    started.current = true
    const pending = takePendingTranscript()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (pending) void organise(pending)
  }, [])

  async function save() {
    if (phase.step !== 'review') return
    const final = finaliseDraft(draft, transcript, phase.engine)
    if (!final.ok) {
      setError(final.message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      clientId.current ??= crypto.randomUUID()
      const { id } = await createSpec(clientId.current, final.value)
      router.push(`/specs/${id}`)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Saving failed. Try again.')
      setBusy(false)
    }
  }

  if (phase.step === 'say') {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow="Step 1 of 3" title="Say what you" em="want.">
          <p className="max-w-xl text-[17px] leading-relaxed text-ink-2">
            Talk or type the change. Receipts turns it into a short checklist for your agent. You
            check it before anything is saved.
          </p>
        </PageHeader>
        <DictationBox value={transcript} onChange={setTranscript} disabled={busy} />
        {error ? (
          <p role="alert" className="px-1 text-sm text-bad">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setTranscript(EXAMPLE)}
            disabled={busy}
            className={buttonStyles('ghost')}
          >
            Fill in an example
          </button>
          <button
            type="button"
            onClick={() => organise(transcript)}
            disabled={busy || transcript.trim() === ''}
            className={buttonStyles('primary', 'lg')}
          >
            {busy ? 'Organising…' : 'Turn into a checklist'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader eyebrow="Step 2 of 3" title="Is this what you" em="meant?" />
      <div className="-mt-4 mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex h-8 items-center gap-2 rounded-full bg-surface-2 px-3 text-[12px] text-ink-2">
            <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
            {ENGINE_LABEL[phase.engine]}
          </span>
          <VoiceToggle />
        </div>
        {phase.notices.map((notice) => (
          <p key={notice} className="rounded-xl bg-unknown-wash px-3 py-2 text-sm text-unknown">
            {notice}
          </p>
        ))}
        <p className="text-[15px] text-muted">
          Edit, move or remove anything that is off. Nothing is saved until you press Save.
        </p>
      </div>
      <ChecklistEditor draft={draft} onChange={setDraft} />
      <SaveBar error={error}>
        <button
          type="button"
          onClick={() => {
            setPhase({ step: 'say' })
            setError(null)
          }}
          disabled={busy}
          className={buttonStyles('ghost')}
        >
          Back
        </button>
        <button type="button" onClick={save} disabled={busy} className={buttonStyles('primary')}>
          {busy ? 'Saving…' : 'Save checklist'}
        </button>
      </SaveBar>
    </div>
  )
}
