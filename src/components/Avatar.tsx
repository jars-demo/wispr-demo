import { avatarById } from '@/domain/game'

// A player avatar: an emoji on its own soft gradient. Locked avatars show greyed with a lock.

export function Avatar({
  id,
  size = 40,
  locked = false,
  label,
}: {
  id: string
  size?: number
  locked?: boolean
  label?: string
}) {
  const avatar = avatarById(id)
  return (
    <span
      role="img"
      aria-label={label ?? `${avatar.name} avatar${locked ? ', locked' : ''}`}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.6),0_0_0_1px_var(--hairline)]"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        background: `linear-gradient(140deg, ${avatar.colors[0]}, ${avatar.colors[1]})`,
        filter: locked ? 'grayscale(1)' : undefined,
        opacity: locked ? 0.45 : 1,
      }}
    >
      <span aria-hidden="true" className="leading-none">
        {avatar.emoji}
      </span>
      {locked ? (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -bottom-0.5 rounded-full bg-ink px-1 text-[10px] leading-4 text-canvas"
        >
          🔒
        </span>
      ) : null}
    </span>
  )
}
