import { Lock } from 'lucide-react'

import { achievementById, type Tier } from '@/domain/game'

import { BADGE_ICONS } from './icons'

// An achievement medallion: a metal ring by tier around a quiet disc with a line icon. Locked
// badges are a dashed outline with a lock, so status never relies on colour alone.

export const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold' }

export function Badge({
  id,
  size = 56,
  locked = false,
  className = '',
}: {
  id: string
  size?: number
  locked?: boolean
  className?: string
}) {
  const achievement = achievementById(id)
  if (!achievement) return null
  const Icon = BADGE_ICONS[achievement.icon]
  const tier = TIER_LABEL[achievement.tier].toLowerCase()
  return (
    <span
      role="img"
      aria-label={`${achievement.title}, ${tier} badge${locked ? ', locked' : ''}`}
      className={`badge ${locked ? 'badge-locked' : `badge-${achievement.tier}`} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className="badge-disc">
        <Icon
          aria-hidden="true"
          strokeWidth={1.75}
          style={{ width: size * 0.42, height: size * 0.42 }}
        />
      </span>
      {locked ? (
        <span aria-hidden="true" className="badge-lock">
          <Lock strokeWidth={2.5} style={{ width: '55%', height: '55%' }} />
        </span>
      ) : null}
    </span>
  )
}
