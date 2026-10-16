'use client'

// The one big control: tap to talk, tap again to stop. Rings breathe while listening and stay
// still for people who prefer reduced motion.

function MicGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8.5" y="3" width="7" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 11.5a7 7 0 0 0 14 0M12 18.5V21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StopGlyph({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" />
    </svg>
  )
}

export function VoiceOrb({
  listening,
  onToggle,
  disabled = false,
  size = 'lg',
  label,
}: {
  listening: boolean
  onToggle: () => void
  disabled?: boolean
  size?: 'lg' | 'md' | 'sm'
  label?: string
}) {
  const box = { lg: 'size-24', md: 'size-14', sm: 'size-11' }[size]
  const glyph = { lg: 34, md: 22, sm: 18 }[size]
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={listening}
      aria-label={label ?? (listening ? 'Stop listening' : 'Tap to talk')}
      className={`orb relative inline-flex ${box} shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.96] disabled:opacity-40 disabled:hover:scale-100 ${
        listening ? 'bg-accent text-accent-on' : 'bg-ink text-canvas'
      }`}
      data-listening={listening || undefined}
    >
      <span aria-hidden="true" className="orb-ring" />
      <span aria-hidden="true" className="orb-ring orb-ring-late" />
      {listening ? <StopGlyph size={glyph} /> : <MicGlyph size={glyph} />}
    </button>
  )
}
