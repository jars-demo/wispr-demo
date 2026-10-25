'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { timeAgo, type FeedItem } from '@/domain/feed'
import { MAX_XP_PER_RUN } from '@/domain/game'
import type { Run } from '@/domain/profile'

import { breakdownHref } from './links'

// One story on the wire. "Break it down" cracks the card into shards, then opens the breakdown.

const SHARDS = [
  { dx: '-90px', dy: '-60px', rot: '-160deg', x: '78%', y: '70%' },
  { dx: '70px', dy: '-80px', rot: '200deg', x: '82%', y: '68%' },
  { dx: '110px', dy: '20px', rot: '120deg', x: '86%', y: '74%' },
  { dx: '-40px', dy: '70px', rot: '-90deg', x: '80%', y: '78%' },
  { dx: '60px', dy: '80px', rot: '260deg', x: '84%', y: '80%' },
  { dx: '-120px', dy: '10px', rot: '-220deg', x: '76%', y: '72%' },
  { dx: '20px', dy: '-110px', rot: '90deg', x: '83%', y: '66%' },
]

export function FeedCard({
  item,
  now,
  best,
  isNew,
  sample,
  delay,
}: {
  item: FeedItem
  now: Date
  best: Run | null
  isNew: boolean
  sample: boolean
  delay: number
}) {
  const router = useRouter()
  const [breaking, setBreaking] = useState(false)
  const href = breakdownHref(item)

  function breakIt() {
    if (breaking) return
    setBreaking(true)
    router.prefetch(href)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => router.push(href), reduce ? 0 : 480)
  }

  const tag =
    item.kind === 'pr' && 'pr' in item.source
      ? `PR #${item.source.pr}`
      : item.kind === 'commit' && 'sha' in item.source
        ? `Commit ${item.source.sha.slice(0, 7)}`
        : item.kind === 'pr'
          ? 'Pull request'
          : 'Commit'

  return (
    <article
      className={`rise lift glass relative flex flex-col gap-3 rounded-card p-4 sm:p-5 ${breaking ? 'is-breaking' : ''}`}
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2 py-0.5 font-medium text-canvas">
          <span aria-hidden="true">{item.kind === 'pr' ? '⑂' : '●'}</span>
          {tag}
        </span>
        <span className="truncate font-mono text-muted">{item.repo}</span>
        <span className="ml-auto text-muted">{sample ? 'Sample' : timeAgo(item.at, now)}</span>
        {isNew ? (
          <span className="rounded-full bg-accent px-2 py-0.5 font-semibold tracking-wide text-accent-on uppercase">
            New
          </span>
        ) : null}
      </div>
      <h3 className="text-[17px] leading-snug font-medium tracking-tight text-balance">
        {item.title}
      </h3>
      <p className="text-[13px] text-muted">by {item.author}</p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
        {best ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-wash px-2.5 py-1 text-[12px] font-medium text-ok">
            <span aria-hidden="true">✓</span>
            Broken down · {best.correct}/{best.total} · +{best.xp} XP
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-wash px-2.5 py-1 text-[12px] font-medium text-accent-text">
            <span aria-hidden="true">✦</span>
            Up to {MAX_XP_PER_RUN} XP
          </span>
        )}
        <button
          type="button"
          onClick={breakIt}
          disabled={breaking}
          className={`${buttonStyles(best ? 'secondary' : 'accent')} group`}
        >
          {best ? 'Play again' : 'Break it down'}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </div>
      {breaking ? (
        <span aria-hidden="true">
          {SHARDS.map((s, i) => (
            <span
              key={i}
              className="shard"
              style={
                {
                  '--dx': s.dx,
                  '--dy': s.dy,
                  '--rot': s.rot,
                  '--x': s.x,
                  '--y': s.y,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      ) : null}
    </article>
  )
}
