'use client'

import { useRef } from 'react'

// A card that tilts gently toward the pointer or finger, with a soft shine that follows it.
// Still for people who prefer reduced motion.

export function TiltCard({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const card = useRef<HTMLDivElement>(null)

  function move(event: React.PointerEvent<HTMLDivElement>) {
    const el = card.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`)
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
  }

  function reset() {
    const el = card.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }

  return (
    <div className="[perspective:1200px]">
      <div
        ref={card}
        onPointerMove={move}
        onPointerLeave={reset}
        onPointerUp={reset}
        className={`tilt-card ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
