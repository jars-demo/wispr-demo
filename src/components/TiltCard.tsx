'use client'

import { useRef } from 'react'

// A card that tilts toward the pointer or finger, with layers floating at different depths and a
// shine that follows. It drifts gently on its own while idle. Still under reduced motion.

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
    el.classList.add('is-active')
    el.style.setProperty('--rx', `${(-y * 22).toFixed(2)}deg`)
    el.style.setProperty('--ry', `${(x * 26).toFixed(2)}deg`)
    el.style.setProperty('--s', '1.03')
    el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
  }

  function reset() {
    const el = card.current
    if (!el) return
    el.classList.remove('is-active')
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    el.style.setProperty('--s', '1')
  }

  return (
    <div className="tilt-stage">
      <div
        ref={card}
        onPointerMove={move}
        onPointerDown={move}
        onPointerLeave={reset}
        onPointerCancel={reset}
        className={`tilt-card touch-pan-y ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
