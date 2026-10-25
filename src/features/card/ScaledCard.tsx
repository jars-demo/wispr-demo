'use client'

import { useEffect, useRef, useState } from 'react'

import type { CardData } from '@/domain/card'

import { CARD_SIZE, CardArt } from './CardArt'

// Shows the 1200 by 630 card scaled to fit its column, pixel-identical to the shared image.

export function ScaledCard({ card, label }: { card: CardData; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = box.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / CARD_SIZE.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={box}
      role="img"
      aria-label={label}
      className="relative w-full overflow-hidden rounded-panel shadow-[var(--shadow-lift)] ring-1 ring-hairline"
      style={{ aspectRatio: `${CARD_SIZE.width} / ${CARD_SIZE.height}` }}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        <CardArt card={card} />
      </div>
    </div>
  )
}
