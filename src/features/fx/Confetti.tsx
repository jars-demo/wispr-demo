'use client'

import { useMemo } from 'react'

// A short burst of confetti. Positions come from a seeded generator, so the render is stable.
// Hidden entirely for people who prefer reduced motion (see fx.css).

const COLORS = ['#ff5a1f', '#141412', '#ffb38a', '#c2410c', '#f3efe6', '#ffd166']

function seeded(seed: number) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

export function Confetti({ seed = 7, count = 70 }: { seed?: number; count?: number }) {
  const pieces = useMemo(() => {
    const random = seeded(seed)
    return Array.from({ length: count }, (_, i) => ({
      key: i,
      style: {
        '--x': `${random() * 100}%`,
        '--dx': `${(random() - 0.5) * 240}px`,
        '--rot': `${(random() - 0.5) * 1440}deg`,
        '--c': COLORS[i % COLORS.length],
        '--t': `${1.3 + random() * 1.2}s`,
        '--delay': `${random() * 300}ms`,
      } as React.CSSProperties,
    }))
  }, [seed, count])
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.key} style={p.style} />
      ))}
    </div>
  )
}
