'use client'

import Link from 'next/link'

import { Avatar } from '@/components/Avatar'
import { buttonStyles } from '@/components/ui/button-styles'
import { timeAgo } from '@/domain/feed'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { useBoard } from './board-store'

// The live board beside the wire: your rank, who is just ahead, the top five, and what other
// players just unlocked.

export function BoardRail() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const { view, error } = useBoard()
  const saved = hydrated && profile.board !== null

  return (
    <aside aria-labelledby="board-title" className="flex flex-col gap-3">
      <div className="glass flex flex-col gap-3 rounded-panel p-5">
        <div className="flex items-baseline justify-between">
          <h2 id="board-title" className="font-display text-2xl tracking-tight">
            Leaderboard
          </h2>
          <Link href="/board" className="text-[13px] text-muted hover:text-ink">
            See all
          </Link>
        </div>

        {saved && view?.me ? (
          <div className="rounded-card bg-ink px-4 py-3 text-canvas">
            <p className="text-[12px] tracking-wider uppercase opacity-70">Your rank</p>
            <p className="font-display text-4xl leading-none tabular-nums">
              #{view.me.rank}
              <span className="ml-2 font-sans text-[13px] opacity-70">of {view.players}</span>
            </p>
            {view.rivalry ? <p className="mt-1 text-[13px] opacity-90">{view.rivalry}</p> : null}
          </div>
        ) : (
          <div className="rounded-card bg-accent-wash px-4 py-3">
            <p className="text-[14px] font-medium">Get on the board</p>
            <p className="text-[13px] text-ink-2">
              Pick a name and your progress is saved. No sign-up, no forms.
            </p>
            <Link href="/me#save" className={`${buttonStyles('primary')} mt-2`}>
              Save my progress
            </Link>
          </div>
        )}

        {view?.top.length ? (
          <ol className="flex flex-col gap-1.5">
            {view.top.slice(0, 5).map((row) => (
              <li
                key={`${row.rank}-${row.name}`}
                className={`flex items-center gap-2.5 rounded-full py-1 pr-3 pl-1 ${row.isMe ? 'bg-accent-wash ring-1 ring-accent/40' : ''}`}
              >
                <span className="w-6 text-center text-[13px] font-semibold text-muted tabular-nums">
                  {row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : row.rank}
                </span>
                <Avatar id={row.avatar} size={28} />
                <span className="min-w-0 flex-1 truncate text-[14px]">
                  {row.name}
                  {row.isMe ? <span className="text-muted"> (you)</span> : null}
                </span>
                <span className="text-[13px] font-medium tabular-nums">
                  {row.xp.toLocaleString('en-US')}
                </span>
              </li>
            ))}
          </ol>
        ) : view ? (
          <p className="text-[13px] text-muted">Nobody on the board yet. First place is open.</p>
        ) : error ? (
          <p className="text-[13px] text-muted">
            The board is taking a nap. Your progress is safe.
          </p>
        ) : (
          <div className="h-40 animate-pulse rounded-card bg-surface-2/60" aria-hidden="true" />
        )}
      </div>

      {view?.events.length ? (
        <div className="glass flex flex-col gap-2 rounded-panel p-5">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold">
            <span className="live-dot size-2 rounded-full bg-accent" aria-hidden="true" />
            Just now on Breakdown
          </h3>
          <ul className="flex flex-col gap-2">
            {view.events.slice(0, 6).map((event, i) => (
              <li key={`${event.at}-${i}`} className="flex items-center gap-2.5 text-[13px]">
                <Avatar id={event.avatar} size={24} />
                <span className="min-w-0 flex-1">{event.text}</span>
                <span className="shrink-0 text-[12px] text-muted">
                  {timeAgo(event.at, new Date())}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </aside>
  )
}
