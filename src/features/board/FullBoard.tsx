'use client'

import { motion, useReducedMotion } from 'motion/react'
import Link from 'next/link'

import { Avatar } from '@/components/Avatar'
import { buttonStyles } from '@/components/ui/button-styles'
import type { BoardView } from '@/domain/board'
import { MAX_XP_PER_RUN, XP } from '@/domain/game'
import { profileStore } from '@/features/game/store'
import { useHydrated } from '@/lib/local-store'

import { useBoard } from './board-store'
import { BoardRows, LiveFeed, RankMark } from './board-ui'

// The whole leaderboard: a podium for the top three, everyone else in rows that glide when
// ranks change, the live feed of unlocks, and how XP is earned.

type Row = BoardView['top'][number]

// Podium order on screen: second, first, third. First stands tallest.
const STEPS = [
  { at: 1, height: 'h-16', avatar: 64 },
  { at: 0, height: 'h-24', avatar: 80 },
  { at: 2, height: 'h-12', avatar: 56 },
] as const

function Podium({ top }: { top: Row[] }) {
  const reduce = useReducedMotion()
  return (
    <div className="grid grid-cols-3 items-end gap-2 px-1 pt-2 sm:gap-4">
      {STEPS.map(({ at, height, avatar }, i) => {
        const row = top[at]
        if (!row) return <div key={at} />
        return (
          <motion.div
            key={row.name}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.1 + i * 0.08 }}
            className="flex min-w-0 flex-col items-center gap-2 text-center"
          >
            <Avatar
              id={row.avatar}
              size={avatar}
              className={row.isMe ? 'ring-2 ring-accent' : ''}
            />
            <span className="w-full truncate text-[14px] font-semibold">{row.name}</span>
            <span className="text-[12px] text-muted tabular-nums">
              {row.xp.toLocaleString('en-US')} XP
            </span>
            <div
              className={`flex w-full ${height} items-start justify-center rounded-t-2xl bg-surface-2 pt-2 ring-1 ring-hairline`}
            >
              <RankMark rank={row.rank} size={30} />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

export function FullBoard() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const { view, error } = useBoard()

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="glass flex flex-col gap-4 rounded-panel p-4 sm:p-6">
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
            <Link href="/me" className={buttonStyles('primary')}>
              Claim my name
            </Link>
          </div>
        ) : null}

        {view?.top.length ? (
          <>
            <Podium top={view.top} />
            {view.top.length > 3 ? <BoardRows rows={view.top.slice(3)} /> : null}
          </>
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
        <div className="glass flex flex-col gap-3 rounded-panel p-5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="live-dot size-2 rounded-full bg-accent" aria-hidden="true" />
            Live
          </h2>
          {view?.events.length ? (
            <LiveFeed events={view.events} limit={12} />
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
