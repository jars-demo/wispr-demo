import { ImageResponse } from 'next/og'

import { decodeCard, type CardData } from '@/domain/card'
import { AVATAR_ART } from '@/features/card/avatar-art'
import { CARD_SIZE, CardArt } from '@/features/card/CardArt'
import { loadOgFonts } from '@/features/card/og-fonts'

// The share image for a player card: the same template as on the page, filled from the link.
// The avatar comes in as a data URI and the fonts are read from the repo, so the image renders
// without fetching anything.

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
  return new ImageResponse(
    <CardArt
      card={card}
      assets={{
        avatarSrc: AVATAR_ART[card.avatar],
        display: 'Instrument Serif',
        sans: 'Geist',
      }}
    />,
    {
      ...size,
      fonts: [...(await loadOgFonts())],
    },
  )
}
