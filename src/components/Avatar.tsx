import { Lock } from 'lucide-react'

import { avatarById } from '@/domain/game'

// A player avatar: line-drawn character art (public/avatars, made by scripts/avatars.mjs) on its
// own soft tone. Locked avatars show greyed with a lock.

export function Avatar({
  id,
  size = 40,
  locked = false,
  label,
  className = '',
}: {
  id: string
  size?: number
  locked?: boolean
  label?: string
  className?: string
}) {
  const avatar = avatarById(id)
  const lock = Math.max(16, Math.round(size * 0.3))
  return (
    <span
      role="img"
      aria-label={label ?? `${avatar.name} avatar${locked ? ', locked' : ''}`}
      className={`relative inline-flex shrink-0 rounded-full ring-1 ring-hairline-strong ${className}`}
      style={{ width: size, height: size, background: avatar.tone }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- small static SVGs need no optimiser */}
      <img
        src={`/avatars/${avatar.id}.svg`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="size-full rounded-full"
        style={locked ? { filter: 'grayscale(1)', opacity: 0.4 } : undefined}
      />
      {locked ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 grid place-items-center rounded-full bg-ink text-canvas ring-2 ring-canvas"
          style={{ width: lock, height: lock }}
        >
          <Lock strokeWidth={2.5} style={{ width: '55%', height: '55%' }} />
        </span>
      ) : null}
    </span>
  )
}
