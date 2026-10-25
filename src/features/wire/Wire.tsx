'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { SampleLabel } from '@/components/SampleLabel'
import type { FeedItem } from '@/domain/feed'
import type { Run } from '@/domain/profile'
import { SAMPLES } from '@/domain/samples'
import { ConnectGitHub, GitHubMark } from '@/features/connect/ConnectGitHub'
import { githubStore } from '@/features/connect/connection'
import { GitHubError, loadFeed } from '@/features/connect/github'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { FeedCard } from './FeedCard'

// The Wire: what you (and your agents) shipped lately, as breaking news. Without GitHub it runs a
// clearly labelled sample wire so anyone can play straight away.

const SEEN_KEY = 'breakdown:seen'
const REFRESH_MS = 3 * 60_000

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY)
  } catch {
    return null
  }
}

function sampleItems(now: Date): FeedItem[] {
  return SAMPLES.map(({ item }) => {
    const { minutesAgo, ...rest } = item
    return { ...rest, at: new Date(now.getTime() - minutesAgo * 60_000).toISOString() }
  })
}

function bestRuns(runs: readonly Run[]): Map<string, Run> {
  const best = new Map<string, Run>()
  for (const run of runs) {
    const current = best.get(run.key)
    if (!current || run.xp > current.xp) best.set(run.key, run)
  }
  return best
}

function Ticker({ items, live }: { items: FeedItem[]; live: boolean }) {
  if (!items.length) return null
  const row = items.slice(0, 8)
  return (
    <div className="marquee rounded-full bg-ink text-canvas" aria-hidden="true">
      <div className="marquee-track py-2!">
        {[...row, ...row].map((item, i) => (
          <span
            key={`${item.id}-${i}`}
            className="inline-flex items-center gap-2 px-3 text-[13px] whitespace-nowrap"
          >
            <span className="font-semibold tracking-wider text-accent">
              {live ? 'SHIPPED' : 'SAMPLE'}
            </span>
            <span className="opacity-60">{item.repo}</span>
            <span>{item.title}</span>
            <span className="opacity-40">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}

type FeedState = {
  items: FeedItem[]
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
}

export function Wire() {
  const hydrated = useHydrated()
  const connection = githubStore.use()
  const profile = profileStore.use()
  // Read only after hydration: the clock and storage differ between server and browser.
  const now = useMemo(() => (hydrated ? new Date() : null), [hydrated])
  const seen = useMemo(() => (hydrated ? readSeen() : null), [hydrated])
  const [feed, setFeed] = useState<FeedState>({ items: [], status: 'idle' })

  const refresh = useCallback(async () => {
    if (!connection) return
    setFeed((f) => ({ ...f, status: 'loading' }))
    try {
      const items = await loadFeed(connection.token, connection.login)
      setFeed({ items, status: 'ready' })
    } catch (error) {
      setFeed((f) => ({
        ...f,
        status: 'error',
        error: error instanceof GitHubError ? error.message : 'Could not load your feed.',
      }))
    }
  }, [connection])

  useEffect(() => {
    if (!connection) return
    void refresh()
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [connection, refresh])

  useEffect(() => {
    // Everything on screen now counts as seen next time.
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
      } catch {
        // Storage blocked: every visit just has no "New" badges.
      }
    }, 4000)
    return () => window.clearTimeout(id)
  }, [])

  const best = useMemo(() => bestRuns(profile.runs), [profile.runs])
  const samples = useMemo(() => (now ? sampleItems(now) : []), [now])

  if (!hydrated || !now) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass h-44 animate-pulse rounded-card" />
        ))}
      </div>
    )
  }

  const live = Boolean(connection)
  const items = live ? feed.items : samples

  return (
    <section aria-labelledby="wire-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="wire-title" className="font-display text-3xl tracking-tight">
          The wire
        </h2>
        {live ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[12px] font-medium ring-1 ring-hairline">
            <span className="live-dot size-2 rounded-full bg-accent" aria-hidden="true" />
            Live from {connection?.login}
          </span>
        ) : (
          <SampleLabel>Sample wire · connect GitHub for yours</SampleLabel>
        )}
        {live ? (
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={feed.status === 'loading'}
            className="ml-auto text-[13px] text-muted underline-offset-4 hover:text-ink hover:underline disabled:opacity-50"
          >
            {feed.status === 'loading' ? 'Checking GitHub…' : 'Refresh'}
          </button>
        ) : null}
      </div>

      <Ticker items={items} live={live} />

      {live && feed.status === 'error' ? (
        <p role="alert" className="rounded-card bg-bad-wash px-4 py-3 text-[14px] text-bad">
          {feed.error}
        </p>
      ) : null}

      {live && feed.status === 'ready' && !feed.items.length ? (
        <p className="glass rounded-card px-5 py-4 text-[14px] text-ink-2">
          Nothing shipped lately in the repos you pushed to last. Play a practice round below, or
          paste any public PR in the search bar.
        </p>
      ) : null}

      {live && feed.status === 'loading' && !feed.items.length ? (
        <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Loading your feed">
          {[0, 1].map((i) => (
            <div key={i} className="glass h-44 animate-pulse rounded-card" />
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <FeedCard
            key={item.id}
            item={item}
            now={now}
            best={best.get(item.id) ?? null}
            isNew={live && seen !== null && item.at > seen}
            sample={!live}
            delay={Math.min(i, 8) * 60}
          />
        ))}
      </div>

      {!live ? (
        <div className="glass flex flex-col gap-4 rounded-panel p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
              <GitHubMark size={20} />
            </span>
            <div>
              <h3 className="text-[17px] font-semibold tracking-tight">Get your own wire</h3>
              <p className="text-[14px] text-ink-2">
                Plug in GitHub once and every PR and commit you or your agents ship shows up here,
                ready to break down.
              </p>
            </div>
          </div>
          <ConnectGitHub compact />
          <div className="flex flex-wrap gap-2 text-[12px] text-muted">
            <span className="rounded-full px-2.5 py-1 ring-1 ring-hairline">GitLab · soon</span>
            <span className="rounded-full px-2.5 py-1 ring-1 ring-hairline">Bitbucket · soon</span>
          </div>
        </div>
      ) : (
        <details className="group">
          <summary className="cursor-pointer text-[14px] text-muted hover:text-ink">
            Practice rounds (samples)
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {samples.map((item, i) => (
              <FeedCard
                key={item.id}
                item={item}
                now={now}
                best={best.get(item.id) ?? null}
                isNew={false}
                sample
                delay={i * 60}
              />
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
