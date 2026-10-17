'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { CheckForm } from '@/features/check/CheckForm'

// One place for the rest of the flow: send the checklist to your agent, give it a moment, then
// check the work right here. The "sent" time lives in sessionStorage, so coming back from your
// agent (or reloading) picks up where you left off.

const BUFFER_MS = 30_000
const EVENT = 'receipts:sent'
const key = (id: string) => `receipts:sent:${id}`

function readSent(id: string): number | null {
  try {
    const value = Number(window.sessionStorage.getItem(key(id)))
    return value > 0 ? value : null
  } catch {
    return null
  }
}

function markSent(id: string, at: number) {
  try {
    window.sessionStorage.setItem(key(id), String(at))
  } catch {
    // Storage blocked: the flow still works for this visit through the event below.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { id, at } }))
}

function useSentAt(id: string): number | null {
  const [fallback, setFallback] = useState<number | null>(null)
  const stored = useSyncExternalStore(
    (onChange) => {
      const listener = (event: Event) => {
        const detail = (event as CustomEvent<{ id: string; at: number }>).detail
        if (detail.id === id) setFallback(detail.at)
        onChange()
      }
      window.addEventListener(EVENT, listener)
      return () => window.removeEventListener(EVENT, listener)
    },
    () => readSent(id),
    () => null,
  )
  return stored ?? fallback
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}

type CopyNote = { text: string; ok: boolean } | null

export function HandoffFlow({
  id,
  title,
  prompt,
  markdown,
  showSample,
  aiEnabled,
}: {
  id: string
  title: string
  prompt: string
  markdown: string
  showSample: boolean
  aiEnabled: boolean
}) {
  const sentAt = useSentAt(id)
  const now = useNow(sentAt !== null)
  const [note, setNote] = useState<CopyNote>(null)
  const left = sentAt === null ? BUFFER_MS : Math.max(0, BUFFER_MS - (now - sentAt))
  const stage = sentAt === null ? 'send' : left > 0 ? 'wait' : 'check'

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setNote({ text: `${label} copied. Paste it into your agent.`, ok: true })
      if (sentAt === null) markSent(id, Date.now())
    } catch {
      setNote({ text: 'Copying is blocked here. Use Download instead.', ok: false })
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'checklist'
    }.md`
    link.click()
    URL.revokeObjectURL(url)
    setNote({ text: 'Downloaded. Hand the file to your agent.', ok: true })
    if (sentAt === null) markSent(id, Date.now())
  }

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="send-heading"
        className="glass flex flex-col gap-4 rounded-panel p-5 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <StepDot n={1} done={stage !== 'send'} />
          <h2 id="send-heading" className="text-[17px] font-semibold tracking-tight">
            Send it to your agent
          </h2>
        </div>
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <button
            type="button"
            onClick={() => copy(prompt, 'Prompt')}
            className={buttonStyles('primary')}
          >
            Copy for your agent
          </button>
          <button
            type="button"
            onClick={() => copy(markdown, 'Markdown')}
            className={buttonStyles('secondary')}
          >
            Copy as Markdown
          </button>
          <button type="button" onClick={download} className={buttonStyles('secondary')}>
            Download .md
          </button>
        </div>
        <p
          aria-live="polite"
          className={`min-h-5 text-sm ${note?.ok === false ? 'text-warn' : 'text-ok'}`}
        >
          {note?.text ?? 'Works with Claude Code, Codex, Cursor, Copilot or any chat.'}
        </p>
      </section>

      <section
        id="check"
        aria-labelledby="check-heading"
        className={`flex scroll-mt-24 flex-col gap-4 ${
          // Once the form shows, its own cards take over, so this one steps back.
          stage === 'check' ? 'pt-2' : 'glass rounded-panel p-5 sm:p-6'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StepDot n={2} done={false} />
            <h2 id="check-heading" className="text-[17px] font-semibold tracking-tight">
              Check what was done
            </h2>
          </div>
          {stage !== 'check' ? (
            <button
              type="button"
              onClick={() => markSent(id, Date.now() - BUFFER_MS)}
              className={buttonStyles('ghost')}
            >
              {stage === 'send' ? 'Already sent? Check now' : 'Done already? Check now'}
            </button>
          ) : null}
        </div>

        {stage === 'send' ? (
          <p className="text-[15px] text-muted">Send the checklist first. This opens by itself.</p>
        ) : null}

        {stage === 'wait' ? (
          <div className="flex flex-col gap-2" role="status">
            <p className="text-[15px] text-ink-2">
              Your agent is on it. The check opens here in{' '}
              <span className="font-mono tabular-nums">{Math.ceil(left / 1000)}s</span>.
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300 ease-linear"
                style={{ width: `${100 - (left / BUFFER_MS) * 100}%` }}
              />
            </div>
          </div>
        ) : null}

        {stage === 'check' ? (
          <div className="rise">
            <CheckForm specId={id} showSample={showSample} aiEnabled={aiEnabled} />
          </div>
        ) : null}
      </section>
    </div>
  )
}

function StepDot({ n, done }: { n: number; done: boolean }) {
  return (
    <span
      className={`grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-semibold ${
        done ? 'bg-ok text-canvas' : 'bg-ink text-canvas'
      }`}
      aria-hidden="true"
    >
      {done ? '✓' : n}
    </span>
  )
}
