'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'

import { githubStore } from './connection'
import { getViewer, GitHubError } from './github'

// Connect GitHub with a read-only token that stays in this browser.

const TOKEN_URL =
  'https://github.com/settings/personal-access-tokens/new?description=Breakdown&contents=read&pull_requests=read&metadata=read'

export function GitHubMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  )
}

export function ConnectGitHub({ compact = false }: { compact?: boolean }) {
  const connection = githubStore.use()
  const [open, setOpen] = useState(!compact)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect() {
    const value = token.trim()
    if (!value) return
    setBusy(true)
    setError(null)
    try {
      const { login } = await getViewer(value)
      githubStore.write({ token: value, login })
      setToken('')
    } catch (caught) {
      setError(caught instanceof GitHubError ? caught.message : 'Could not reach GitHub.')
    } finally {
      setBusy(false)
    }
  }

  if (connection) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
        <GitHubMark />
        <span>
          Connected as <span className="font-medium">{connection.login}</span>
        </span>
        <button
          type="button"
          onClick={() => githubStore.write(null)}
          className="text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonStyles('primary', 'lg')}>
        <GitHubMark />
        Plug in your GitHub
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void connect()
      }}
      className="flex flex-col gap-3"
    >
      <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13px] leading-relaxed text-ink-2">
        <li>
          <a
            href={TOKEN_URL}
            target="_blank"
            rel="noreferrer"
            className="text-accent-text underline"
          >
            Create a fine-grained token
          </a>{' '}
          with read-only Contents and Pull requests.
        </li>
        <li>Paste it here. That is it.</li>
      </ol>
      <div className="flex gap-2">
        <label htmlFor="gh-token" className="sr-only">
          GitHub token
        </label>
        <input
          id="gh-token"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="github_pat_…"
          className="field field-mono min-w-0 flex-1"
        />
        <button
          type="submit"
          disabled={busy || !token.trim()}
          className={buttonStyles('primary', 'field')}
        >
          {busy ? 'Checking…' : 'Connect'}
        </button>
      </div>
      <p className="text-[12px] text-muted">
        Stays in this browser and is only ever sent to api.github.com. Breakdown&apos;s server never
        sees it.
      </p>
      {error ? (
        <p role="alert" className="text-[13px] text-bad">
          {error}
        </p>
      ) : null}
    </form>
  )
}
