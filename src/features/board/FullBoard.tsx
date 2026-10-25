'use client'

import Link from 'next/link'

import { Avatar } from '@/components/Avatar'
import { buttonStyles } from '@/components/ui/button-styles'
import { timeAgo } from '@/domain/feed'
import { MAX_XP_PER_RUN, XP } from '@/domain/game'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { useBoard } from './board-store'

// The whole leaderboard, the live feed of unlocks, and how XP is earned.

export function FullBoard() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const { view, error } = useBoard()

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="glass flex flex-col gap-3 rounded-panel p-4 sm:p-6">
        {hydrated && view?.me ? (
          <div className="flex flex-wrap items-center gap-3 rounded-card bg-ink px-4 py-3 text-canvas">
            <span className="font-display text-4xl leading-none tabular-nums">#{view.me.rank}</span>
            <span className="text-[14px] opacity-90">
              {view.rivalry ?? `of ${view.players} players`}
            </span>
          </div>
        ) : hydrated && !profile.board ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-accent-wash px-4 py-3">
            <span className="text-[14px]">You are not on the board yet. It takes one name.</span>
            <Link href="/me#save" className={buttonStyles('primary')}>
              Join the board
            </Link>
          </div>
        ) : null}

        {view?.top.length ? (
          <ol className="flex flex-col">
            {view.top.map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className={`flex items-center gap-3 border-b border-hairline px-2 py-2.5 last:border-0 ${row.isMe ? 'rounded-card bg-accent-wash' : ''}`}
              >
                <span className="w-8 text-center text-[15px] font-semibold text-muted tabular-nums">
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                </span>
                <Avatar id={row.avatar} size={36} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] font-medium">
                    {row.name}
                    {row.isMe ? <span className="text-muted"> (you)</span> : null}
                  </span>
                  <span className="text-[12px] text-muted">{row.level}</span>
                </span>
                <span className="text-[15px] font-semibold tabular-nums">
                  {row.xp.toLocaleString('en-US')} XP
                </span>
              </li>
            ))}
          </ol>
        ) : view ? (
          <p className="py-8 text-center text-[15px] text-muted">
            Nobody here yet. First place is yours to take.
          </p>
        ) : error ? (
          <p className="py-8 text-center text-[15px] text-muted">
            The board could not load. Try again soon.
          </p>
        ) : (
          <div className="h-80 animate-pulse rounded-card bg-surface-2/60" aria-hidden="true" />
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass flex flex-col gap-2 rounded-panel p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="live-dot size-2 rounded-full bg-accent" aria-hidden="true" />
            Live
          </h2>
          {view?.events.length ? (
            <ul className="flex flex-col gap-2">
              {view.events.map((event, i) => (
                <li key={`${event.at}-${i}`} className="flex items-center gap-2.5 text-[13px]">
                  <Avatar id={event.avatar} size={24} />
                  <span className="min-w-0 flex-1">{event.text}</span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {timeAgo(event.at, new Date())}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-muted">Quiet for now.</p>
          )}
        </div>
        <div className="glass flex flex-col gap-2 rounded-panel p-5 text-[14px]">
          <h2 className="text-[15px] font-semibold">How XP works</h2>
          <ul className="flex flex-col gap-1 text-ink-2">
            <li>+{XP.correct} per right prediction</li>
            <li>Up to +{100 * XP.explainPerPoint} for explaining it back</li>
            <li>
              +{XP.finish} for finishing, +{XP.newConcept} per new concept
            </li>
            <li>Replays earn a quarter. At most {MAX_XP_PER_RUN} per change.</li>
          </ul>
          <p className="text-[12px] text-muted">
            Numbers come from each player&apos;s browser and are checked against these rules. It is
            a game, not a certificate.
          </p>
        </div>
      </div>
    </div>
  )
}
