import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ImageResponse } from 'next/og'

import { decodeCard, type CardData } from '@/domain/card'
import { AVATAR_ART } from '@/features/card/avatar-art'
import { CARD_SIZE, CardArt } from '@/features/card/CardArt'

// The share image for a player card: the same template as on the page, filled from the link.
// The avatar comes in as a data URI and Instrument Serif (OFL) is loaded from the repo, so the
// image renders without fetching anything.

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

const fontFile = (name: string) => readFile(join(process.cwd(), 'src/app/card/fonts', name))

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const card = decodeCard(code) ?? FALLBACK
  const [regular, italic] = await Promise.all([
    fontFile('InstrumentSerif-Regular.ttf'),
    fontFile('InstrumentSerif-Italic.ttf'),
  ])
  return new ImageResponse(
    <CardArt
      card={card}
      assets={{ avatarSrc: AVATAR_ART[card.avatar], display: 'Instrument Serif' }}
    />,
    {
      ...size,
      fonts: [
        { name: 'Instrument Serif', data: regular, style: 'normal', weight: 400 },
        { name: 'Instrument Serif', data: italic, style: 'italic', weight: 400 },
      ],
    },
  )
}
