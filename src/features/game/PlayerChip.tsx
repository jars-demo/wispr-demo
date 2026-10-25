'use client'

import Link from 'next/link'

import { Avatar } from '@/components/Avatar'
import { levelFor } from '@/domain/game'
import { useBoard } from '@/features/board/board-store'
import { useHydrated } from '@/lib/local-store'

import { profileStore } from './store'

// The player's avatar, level, XP and board rank, always one tap from their card.

export function PlayerChip() {
  const hydrated = useHydrated()
  const profile = profileStore.use()
  const { view } = useBoard()
  const level = levelFor(profile.xp)
  const rank = view?.me?.rank ?? null

  if (!hydrated)
    return <span className="h-10 w-28 rounded-full bg-surface-2/70" aria-hidden="true" />

  return (
    <Link
      href="/me"
      aria-label={`Your card: level ${level.level}, ${profile.xp} XP${rank ? `, rank ${rank}` : ''}`}
      className="flex h-10 items-center gap-2 rounded-full bg-surface/80 py-1 pr-3 pl-1 ring-1 ring-hairline transition-colors hover:bg-surface"
    >
      <Avatar id={profile.avatar} size={32} />
      <span className="flex flex-col leading-none">
        <span className="text-[12px] font-semibold tabular-nums">
          {profile.xp.toLocaleString('en-US')} XP
        </span>
        <span className="text-[11px] text-muted">
          Lv {level.level}
          {rank ? ` · #${rank}` : ''}
        </span>
      </span>
    </Link>
  )
}
