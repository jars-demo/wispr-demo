import { MARK_INK, MARK_ORANGE, MARK_PAPER } from './logo-mark'

// The exploded B: the lower bowl of a B pulled out of place, in orange. Understanding by taking
// apart. Geometry lives in logo-mark.ts; src/app/icon.svg mirrors it for the favicon.

export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <rect width="64" height="64" rx="16" fill={MARK_INK} />
      <rect x="15" y="14" width="7" height="36" rx="1.5" fill={MARK_PAPER} />
      <path d="M25 14h10a8 8 0 0 1 0 16H25Z" fill={MARK_PAPER} />
      <path className="logo-bowl" d="M29 34h12a8 8 0 0 1 0 16H29Z" fill={MARK_ORANGE} />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="logo inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.03em]">
      <LogoMark />
      Breakdown
    </span>
  )
}
