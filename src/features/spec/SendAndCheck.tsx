'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { AgentLogo, type LogoId } from '@/components/AgentLogo'
import { buttonStyles } from '@/components/ui/button-styles'
import { AGENTS, handoff, type Agent, type AgentId, type Shell } from '@/domain/agent-handoff'
import { issueFor } from '@/domain/github-handoff'
import { CheckForm } from '@/features/check/CheckForm'
import { ConnectGitHub } from '@/features/connect/ConnectGitHub'
import { useConnection } from '@/features/connect/connection'
import { createIssue, GitHubError } from '@/features/connect/github'

import { ApiError, markSent } from './api'
import { WatchAgent } from './WatchAgent'

// Step 1 sends the receipt with one tap on an agent's logo. Step 2 checks the work: on GitHub
// Receipts follows the agent's pull request and checks it by itself; anywhere else, the check
// opens here after a short pause.

const BUFFER_MS = 30_000

const LOGO: Record<AgentId, LogoId> = {
  copilot: 'copilot',
  'claude-github': 'claude',
  'claude-code': 'claude-code',
  codex: 'codex',
  cursor: 'cursor',
  'claude-web': 'claude',
  chatgpt: 'chat',
  other: 'copy',
}

type Sent = { at: string | null; via: string | null; ref: string | null }
type Note = { text: string; ok: boolean } | null

const noop = () => () => {}
const detectShell = (): Shell => (/Windows/.test(navigator.userAgent) ? 'powershell' : 'posix')
const byKind = (kind: Agent['kind']) => AGENTS.filter((agent) => agent.kind === kind)

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(timer)
  }, [active])
  return now
}

export function SendAndCheck({
  id,
  title,
  prompt,
  markdown,
  showSample,
  aiEnabled,
  sent: initialSent,
}: {
  id: string
  title: string
  prompt: string
  markdown: string
  showSample: boolean
  aiEnabled: boolean
  sent: Sent
}) {
  const router = useRouter()
  const connection = useConnection()
  const detectedShell = useSyncExternalStore(noop, detectShell, () => 'posix' as const)
  const [shellChoice, setShellChoice] = useState<Shell | null>(null)
  const shell = shellChoice ?? detectedShell
  const [sent, setSent] = useState<Sent>(initialSent)
  const [resending, setResending] = useState(false)
  const [skipWait, setSkipWait] = useState(false)
  const [busy, setBusy] = useState<AgentId | null>(null)
  const [note, setNote] = useState<Note>(null)

  const onGitHub = sent.via === 'copilot' || sent.via === 'claude-github'
  const now = useNow(sent.at !== null && !onGitHub)
  const left = sent.at ? Math.max(0, BUFFER_MS - (now - Date.parse(sent.at))) : BUFFER_MS
  const sentAgent = AGENTS.find((agent) => agent.id === sent.via)

  async function record(via: AgentId, ref?: string) {
    try {
      const { sentAt } = await markSent(id, via, ref)
      setSent({ at: sentAt, via, ref: ref ?? null })
      setResending(false)
      router.refresh()
    } catch (caught) {
      setNote({
        text: caught instanceof ApiError ? caught.message : 'Could not save that.',
        ok: false,
      })
    }
  }

  async function send(agent: Agent) {
    setNote(null)
    if (agent.kind === 'github') {
      if (!connection?.repo) return
      setBusy(agent.id)
      try {
        const issue = await createIssue(
          connection.token,
          connection.repo,
          issueFor(agent.id as 'copilot' | 'claude-github', title, prompt),
        )
        if (
          agent.id === 'copilot' &&
          !issue.assignees?.some((a) => a.login.toLowerCase().includes('copilot'))
        ) {
          setNote({
            text: 'The issue was created, but Copilot was not assigned. Is the Copilot coding agent turned on for this repo?',
            ok: false,
          })
        }
        await record(agent.id, issue.html_url)
      } catch (caught) {
        setNote({
          text: caught instanceof GitHubError ? caught.message : 'Could not reach GitHub.',
          ok: false,
        })
      } finally {
        setBusy(null)
      }
      return
    }
    const plan = handoff(agent.id, prompt, shell)
    // Open first, inside the click, so the browser does not block the new tab.
    if (plan.open) window.open(plan.open, '_blank', 'noopener,noreferrer')
    const copied = await writeClipboard(plan.copy)
    if (!copied && !plan.open) {
      setNote({ text: 'Copying is blocked here. Use Download instead.', ok: false })
      return
    }
    setNote({
      text: copied ? plan.note : 'Opened. Copying is blocked, so paste the brief by hand.',
      ok: copied,
    })
    await record(agent.id)
  }

  async function copy(text: string, label: string) {
    const ok = await writeClipboard(text)
    setNote(
      ok ? { text: `${label} copied.`, ok: true } : { text: 'Copying is blocked here.', ok: false },
    )
  }

  function download() {
    const url = URL.createObjectURL(new Blob([prompt], { type: 'text/markdown' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'receipt'
    }.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const showSend = sent.at === null || resending

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-labelledby="send-heading"
        className="glass flex flex-col gap-5 rounded-panel p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="send-heading" className="text-[17px] font-semibold tracking-tight">
            {showSend ? 'Send it to your agent' : 'Sent'}
          </h2>
          {!showSend && sentAgent ? (
            <div className="flex items-center gap-2 text-[14px]">
              <AgentLogo id={LOGO[sentAgent.id]} size={18} />
              <span>{sentAgent.name}</span>
              <button
                type="button"
                onClick={() => setResending(true)}
                className={buttonStyles('ghost')}
              >
                Send again
              </button>
            </div>
          ) : null}
        </div>

        {showSend ? (
          <>
            <Group
              title="Send on GitHub"
              subtitle="The agent starts by itself, and Receipts checks its pull request."
            >
              {connection?.repo ? (
                byKind('github').map((agent) => (
                  <Tile
                    key={agent.id}
                    agent={agent}
                    busy={busy === agent.id}
                    onClick={() => send(agent)}
                  />
                ))
              ) : (
                <div className="col-span-full">
                  <ConnectGitHub connection={connection} />
                </div>
              )}
            </Group>
            {connection?.repo ? <ConnectGitHub connection={connection} /> : null}

            <Group
              title="Run it yourself"
              subtitle="Opens or copies a ready command for your machine."
            >
              {byKind('local').map((agent) => (
                <Tile key={agent.id} agent={agent} busy={false} onClick={() => send(agent)} />
              ))}
            </Group>
            <div
              className="-mt-3 flex items-center gap-1 text-[12px] text-muted"
              role="group"
              aria-label="Terminal"
            >
              <span className="mr-1">Terminal:</span>
              {(['posix', 'powershell'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={shell === option}
                  onClick={() => setShellChoice(option)}
                  className={`rounded-full px-2 py-0.5 ${shell === option ? 'bg-surface-2 text-ink' : 'hover:text-ink'}`}
                >
                  {option === 'posix' ? 'bash / zsh' : 'PowerShell'}
                </button>
              ))}
            </div>

            <Group title="Ask in a chat">
              {byKind('chat').map((agent) => (
                <Tile key={agent.id} agent={agent} busy={false} onClick={() => send(agent)} />
              ))}
            </Group>
          </>
        ) : null}

        <p
          aria-live="polite"
          className={`min-h-5 text-sm ${note?.ok === false ? 'text-warn' : 'text-ok'}`}
        >
          {note?.text}
        </p>

        <details className="group -mt-2">
          <summary className="cursor-pointer text-[13px] text-muted">
            More: copy, download, preview
          </summary>
          <div className="mt-3 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => copy(prompt, 'Brief')}
              className={buttonStyles('ghost')}
            >
              Copy brief
            </button>
            <button
              type="button"
              onClick={() => copy(markdown, 'Receipt')}
              className={buttonStyles('ghost')}
            >
              Copy as Markdown
            </button>
            <button type="button" onClick={download} className={buttonStyles('ghost')}>
              Download .md
            </button>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded-card bg-surface-2 p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-2">
            {prompt}
          </pre>
        </details>
      </section>

      <section
        id="check"
        aria-labelledby="check-heading"
        className="glass flex scroll-mt-24 flex-col gap-4 rounded-panel p-5 sm:p-6"
      >
        <h2 id="check-heading" className="text-[17px] font-semibold tracking-tight">
          Check the work
        </h2>

        {sent.at === null && !skipWait ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] text-muted">Send it first. The check opens here by itself.</p>
            <button
              type="button"
              onClick={() => setSkipWait(true)}
              className={buttonStyles('ghost')}
            >
              Already sent? Check now
            </button>
          </div>
        ) : onGitHub && sent.ref && connection ? (
          <WatchAgent
            specId={id}
            issueUrl={sent.ref}
            agent={sentAgent?.name ?? 'the agent'}
            connection={connection}
          />
        ) : !onGitHub && left > 0 && !skipWait ? (
          <div className="flex flex-col gap-2" role="status">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[15px] text-ink-2">
                Your agent is on it. The check opens here in{' '}
                <span className="font-mono tabular-nums" suppressHydrationWarning>
                  {Math.ceil(left / 1000)}s
                </span>
                .
              </p>
              <button
                type="button"
                onClick={() => setSkipWait(true)}
                className={buttonStyles('ghost')}
              >
                Done already? Check now
              </button>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden="true">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-500 ease-linear"
                style={{ width: `${100 - (left / BUFFER_MS) * 100}%` }}
                suppressHydrationWarning
              />
            </div>
          </div>
        ) : (
          <div className="rise flex flex-col gap-3">
            {onGitHub && !connection ? (
              <p className="text-[14px] text-muted">
                Connect GitHub on this device to have Receipts follow the pull request, or paste its
                link below.
              </p>
            ) : null}
            <CheckForm specId={id} showSample={showSample} aiEnabled={aiEnabled} />
          </div>
        )}
      </section>
    </div>
  )
}

function Group({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <h3 className="text-[13px] font-semibold tracking-tight text-ink">{title}</h3>
        {subtitle ? <p className="text-[12.5px] text-muted">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>
    </div>
  )
}

function Tile({ agent, busy, onClick }: { agent: Agent; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="lift flex min-w-0 flex-col items-start gap-2 rounded-card bg-surface/85 p-3.5 text-left ring-1 ring-hairline transition-colors hover:bg-surface hover:ring-hairline-strong disabled:opacity-60"
    >
      <AgentLogo id={LOGO[agent.id]} size={24} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold">{busy ? 'Sending…' : agent.name}</span>
        <span className="text-[11.5px] leading-snug text-muted">{agent.hint}</span>
      </span>
    </button>
  )
}
