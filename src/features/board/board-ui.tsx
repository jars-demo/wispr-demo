'use client'

import { ChevronsUp } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import { Avatar } from '@/components/Avatar'
import { Badge } from '@/components/Badge'
import type { BoardView } from '@/domain/board'
import { timeAgo } from '@/domain/feed'

// Pieces shared by the board rail and the full board: rank marks, rows that glide when ranks
// change, and the live feed where new events slide in at the top.

const METAL = ['badge-gold', 'badge-silver', 'badge-bronze'] as const

/** Ranks 1 to 3 get a metal disc with the number; the rest a plain number. */
export function RankMark({ rank, size = 26 }: { rank: number; size?: number }) {
  const metal = METAL[rank - 1]
  if (!metal) {
    return (
      <span
        className="inline-grid shrink-0 place-items-center text-[13px] font-semibold text-muted tabular-nums"
        style={{ width: size, height: size }}
      >
        {rank}
      </span>
    )
  }
  return (
    <span
      aria-label={`Rank ${rank}`}
      className={`badge ${metal} shrink-0`}
      style={{ width: size, height: size, padding: 2 }}
    >
      <span
        className="badge-disc text-[12px] font-bold tabular-nums"
        style={{ fontSize: size * 0.44 }}
      >
        {rank}
      </span>
    </span>
  )
}

type Row = BoardView['top'][number]

export function BoardRows({ rows, compact = false }: { rows: Row[]; compact?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <ol className="flex flex-col gap-1">
      {rows.map((row) => (
        <motion.li
          key={row.name}
          layout={!reduce}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className={`flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 ${row.isMe ? 'bg-accent-wash ring-1 ring-accent/40' : 'hover:bg-surface-2/70'}`}
        >
          <RankMark rank={row.rank} />
          <Avatar id={row.avatar} size={compact ? 30 : 38} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[14px] font-medium">
              {row.name}
              {row.isMe ? <span className="font-normal text-muted"> (you)</span> : null}
            </span>
            {compact ? null : <span className="text-[12px] text-muted">{row.level}</span>}
          </span>
          <span className="text-[14px] font-semibold tabular-nums">
            {row.xp.toLocaleString('en-US')}
            <span className="ml-1 text-[11px] font-medium text-muted">XP</span>
          </span>
        </motion.li>
      ))}
    </ol>
  )
}

type Event = BoardView['events'][number]

function EventArt({ event }: { event: Event }) {
  if (event.kind === 'achievement') return <Badge id={event.detail} size={30} />
  if (event.kind === 'avatar') return <Avatar id={event.detail} size={30} />
  if (event.kind === 'level') {
    return (
      <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-ink text-canvas">
        <ChevronsUp aria-hidden="true" className="size-4" />
      </span>
    )
  }
  return <Avatar id={event.avatar} size={30} />
}

export function LiveFeed({ events, limit }: { events: Event[]; limit: number }) {
  const reduce = useReducedMotion()
  const now = new Date()
  return (
    <ul className="flex flex-col gap-2.5">
      <AnimatePresence initial={false}>
        {events.slice(0, limit).map((event) => (
          <motion.li
            key={`${event.at}-${event.kind}-${event.detail}-${event.text}`}
            layout={!reduce}
            initial={reduce ? false : { opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="flex items-center gap-2.5 text-[13px]"
          >
            <EventArt event={event} />
            <span className="min-w-0 flex-1 leading-snug">{event.text}</span>
            <span className="shrink-0 text-[12px] text-muted">{timeAgo(event.at, now)}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}
