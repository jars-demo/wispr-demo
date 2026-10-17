'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { linkedPullNumber, parseIssueUrl, pullIsReady } from '@/domain/github-handoff'
import type { Connection } from '@/features/connect/connection'
import {
  getPull,
  getPullDiff,
  getTimeline,
  GitHubError,
  type Pull,
} from '@/features/connect/github'

import { createCheck } from './api'

// Follows a GitHub issue to the agent's pull request, and checks the work the moment the pull
// request is ready: the diff and the agent's own description are fetched from GitHub here, in
// the browser, then checked like a pasted diff. Nothing to copy or paste.

const POLL_MS = 15_000
const MAX_DIFF = 400_000

type Watch =
  | { state: 'waiting' }
  | { state: 'working'; pull: Pull }
  | { state: 'ready'; pull: Pull }
  | { state: 'checking'; pull: Pull }
  | { state: 'error'; message: string }

export function WatchAgent({
  specId,
  issueUrl,
  agent,
  connection,
}: {
  specId: string
  issueUrl: string
  agent: string
  connection: Connection
}) {
  const router = useRouter()
  const issue = parseIssueUrl(issueUrl)
  const [watch, setWatch] = useState<Watch>({ state: 'waiting' })
  const checking = useRef(false)

  async function check(pull: Pull) {
    if (!issue || checking.current) return
    checking.current = true
    setWatch({ state: 'checking', pull })
    try {
      const diff = await getPullDiff(connection.token, issue.repo, pull.number)
      if (diff.length > MAX_DIFF) {
        throw new Error('This pull request is too large to check here. Check a smaller part.')
      }
      const { id } = await createCheck(specId, {
        diff,
        link: '',
        summary: pull.body ?? '',
        testOutput: '',
      })
      router.push(`/specs/${specId}/checks/${id}`)
    } catch (caught) {
      checking.current = false
      setWatch({
        state: 'error',
        message: caught instanceof Error ? caught.message : 'The check failed.',
      })
    }
  }

  useEffect(() => {
    if (!issue) return
    let stopped = false
    async function poll() {
      if (!issue || checking.current) return
      try {
        const number = linkedPullNumber(
          await getTimeline(connection.token, issue.repo, issue.number),
        )
        if (stopped) return
        if (number === null) return setWatch({ state: 'waiting' })
        const pull = await getPull(connection.token, issue.repo, number)
        if (stopped) return
        if (pullIsReady(pull)) {
          setWatch({ state: 'ready', pull })
          void check(pull)
        } else {
          setWatch({ state: 'working', pull })
        }
      } catch (caught) {
        if (!stopped) {
          setWatch({
            state: 'error',
            message: caught instanceof GitHubError ? caught.message : 'Could not reach GitHub.',
          })
        }
      }
    }
    void poll()
    const timer = window.setInterval(poll, POLL_MS)
    window.addEventListener('focus', poll)
    return () => {
      stopped = true
      window.clearInterval(timer)
      window.removeEventListener('focus', poll)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the issue changes
  }, [issueUrl, connection.token])

  if (!issue) return null
  const pull = 'pull' in watch ? watch.pull : null

  return (
    <div className="flex flex-col gap-3" role="status" aria-live="polite">
      <ol className="flex flex-col gap-2 text-[14px]">
        <Line done label={`Issue #${issue.number} opened for ${agent}`} href={issueUrl} />
        <Line
          done={pull !== null}
          busy={watch.state === 'waiting'}
          label={
            pull
              ? `Pull request #${pull.number} opened`
              : `Waiting for ${agent} to open a pull request`
          }
          href={pull?.html_url}
        />
        <Line
          done={watch.state === 'ready' || watch.state === 'checking'}
          busy={watch.state === 'working'}
          label={watch.state === 'working' ? `${agent} is still working on it` : 'Ready for review'}
        />
        <Line busy={watch.state === 'checking'} label="Checking the work against your receipt" />
      </ol>
      {watch.state === 'error' ? (
        <p role="alert" className="text-sm text-bad">
          {watch.message}
        </p>
      ) : null}
      {pull && watch.state !== 'checking' ? (
        <button type="button" onClick={() => check(pull)} className={buttonStyles('secondary')}>
          Check it now
        </button>
      ) : null}
      <p className="text-[12px] text-muted">
        Checking GitHub every few seconds while this page is open. You can leave and come back.
      </p>
    </div>
  )
}

function Line({
  label,
  done = false,
  busy = false,
  href,
}: {
  label: string
  done?: boolean
  busy?: boolean
  href?: string | undefined
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] ${
          done
            ? 'bg-ok text-canvas'
            : busy
              ? 'bg-accent-wash text-accent-text'
              : 'bg-surface-2 text-muted'
        }`}
      >
        {done ? (
          '✓'
        ) : busy ? (
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
        ) : (
          ''
        )}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-ink underline-offset-4 hover:underline"
        >
          {label}
        </a>
      ) : (
        <span className={done || busy ? 'text-ink' : 'text-muted'}>{label}</span>
      )}
    </li>
  )
}
