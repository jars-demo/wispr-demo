'use client'

import { useState } from 'react'

import { AgentLogo } from '@/components/AgentLogo'
import { buttonStyles } from '@/components/ui/button-styles'
import { isRepoName } from '@/domain/github-handoff'

import { saveConnection, type Connection } from './connection'
import { getViewer, GitHubError, listRepos, type Repo } from './github'

// Connect GitHub with a token that stays in this browser, then pick the repo agents work in.

const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new'

export function ConnectGitHub({ connection }: { connection: Connection | null }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [repos, setRepos] = useState<Repo[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect(withToken: string) {
    setBusy(true)
    setError(null)
    try {
      const [{ login }, list] = await Promise.all([getViewer(withToken), listRepos(withToken)])
      saveConnection({ token: withToken, login, repo: connection?.repo ?? null })
      setRepos(list)
      setToken('')
    } catch (caught) {
      setError(caught instanceof GitHubError ? caught.message : 'Could not reach GitHub.')
    } finally {
      setBusy(false)
    }
  }

  // Connected and a repo chosen: one quiet line with a way to change it.
  if (connection?.repo && repos === null) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
        <AgentLogo id="github" size={16} />
        <span>
          <span className="text-ink">{connection.repo}</span> as {connection.login}
        </span>
        <button
          type="button"
          onClick={() => connect(connection.token)}
          className="underline-offset-4 hover:text-ink hover:underline"
        >
          Change repo
        </button>
        <button
          type="button"
          onClick={() => saveConnection(null)}
          className="underline-offset-4 hover:text-ink hover:underline"
        >
          Disconnect
        </button>
      </div>
    )
  }

  // Connected: choose the repo.
  if (connection) {
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor="repo" className="text-[13px] text-muted">
          Which repo should the agent work in?
        </label>
        {repos ? (
          <select
            id="repo"
            defaultValue={connection.repo ?? ''}
            onChange={(event) => {
              const repo = event.target.value
              if (isRepoName(repo)) {
                saveConnection({ ...connection, repo })
                setRepos(null)
              }
            }}
            className="h-12 rounded-full border border-hairline bg-surface px-4 text-[15px]"
          >
            <option value="" disabled>
              Choose a repository
            </option>
            {repos.map((repo) => (
              <option key={repo.full_name} value={repo.full_name}>
                {repo.full_name}
                {repo.private ? ' (private)' : ''}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            onClick={() => connect(connection.token)}
            disabled={busy}
            className={buttonStyles('secondary')}
          >
            {busy ? 'Loading repositories…' : 'Choose a repository'}
          </button>
        )}
        {error ? (
          <p role="alert" className="text-sm text-bad">
            {error}
          </p>
        ) : null}
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${buttonStyles('secondary', 'lg')} gap-2.5`}
      >
        <AgentLogo id="github" size={18} />
        Connect GitHub
      </button>
    )
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void connect(token.trim())
      }}
      className="flex flex-col gap-3 rounded-card bg-surface/70 p-4"
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
          for the repos you want agents to work in.
        </li>
        <li>
          Give it read and write access to Contents, Issues, Pull requests and Actions (Metadata is
          read-only).
        </li>
        <li>Paste it here.</li>
      </ol>
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
        className="h-12 rounded-full border border-hairline bg-surface px-4 font-mono text-[14px]"
      />
      <p className="text-[12px] text-muted">
        Kept only in this browser and sent only to api.github.com. Receipts&apos; server never sees
        it. Disconnect any time.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || token.trim() === ''}
          className={buttonStyles('primary')}
        >
          {busy ? 'Connecting…' : 'Connect'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={buttonStyles('ghost')}>
          Cancel
        </button>
      </div>
    </form>
  )
}
