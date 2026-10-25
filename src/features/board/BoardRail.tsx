'use client'

import Link from 'next/link'

import { buttonStyles } from '@/components/ui/button-styles'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { useBoard } from './board-store'
import { BoardRows, LiveFeed } from './board-ui'

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
              Claim a name and your progress is saved. No sign-up, no forms.
            </p>
            <Link href="/me" className={`${buttonStyles('primary')} mt-2`}>
              Claim my name
            </Link>
          </div>
        )}

        {view?.top.length ? (
          <BoardRows rows={view.top.slice(0, 5)} compact />
        ) : view ? (
          <p className="text-[13px] text-muted">Nobody on the board yet. First place is open.</p>
        ) : error ? (
          <p className="text-[13px] text-muted">
            The board is taking a nap. Your progress is safe in this browser.
          </p>
        ) : (
          <div className="h-40 animate-pulse rounded-card bg-surface-2/60" aria-hidden="true" />
        )}
      </div>

      {view?.events.length ? (
        <div className="glass flex flex-col gap-3 rounded-panel p-5">
          <h3 className="flex items-center gap-2 text-[14px] font-semibold">
            <span className="live-dot size-2 rounded-full bg-accent" aria-hidden="true" />
            Just now on Breakdown
          </h3>
          <LiveFeed events={view.events} limit={5} />
        </div>
      ) : null}
    </aside>
  )
}
