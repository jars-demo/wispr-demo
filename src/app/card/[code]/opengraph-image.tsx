import { ImageResponse } from 'next/og'

import { decodeCard, type CardData } from '@/domain/card'
import { CARD_SIZE, CardArt } from '@/features/card/CardArt'

// The share image for a player card: the same template as on the page, filled from the link.

export const size = CARD_SIZE
export const contentType = 'image/png'
export const alt = 'A Breakdown player card'

const FALLBACK: CardData = {
  name: 'A developer',
  avatar: 'dev-he',
  xp: 0,
  breakdowns: 0,
  concepts: 0,
  streak: 0,
  achievements: [],
  topConcepts: [],
  template: 'paper',
  tagline: 0,
}

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const card = decodeCard(code) ?? FALLBACK
  return new ImageResponse(<CardArt card={card} />, { ...size, emoji: 'twemoji' })
}
