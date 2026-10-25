import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { PageShell } from '@/components/PageShell'
import { buttonStyles } from '@/components/ui/button-styles'
import { decodeCard } from '@/domain/card'
import { levelFor } from '@/domain/game'
import { ScaledCard } from '@/features/card/ScaledCard'

export const metadata: Metadata = {
  title: 'A Breakdown player card',
  description: 'SHIPPED IT? Now understand it. Can you beat this score?',
  twitter: { card: 'summary_large_image' },
}

async function SharedCard({ params }: { params: PageProps<'/card/[code]'>['params'] }) {
  const { code } = await params
  const card = decodeCard(code)
  if (!card) notFound()
  const level = levelFor(card.xp)
  return (
    <div className="flex flex-col items-center gap-8">
      <ScaledCard
        card={card}
        label={`${card.name}, level ${level.level} ${level.title}, ${card.xp} XP`}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-4xl tracking-tight text-balance">
          Can you beat {card.xp.toLocaleString('en-US')} XP?
        </p>
        <p className="max-w-md text-[15px] text-ink-2">
          Breakdown turns what your coding agent ships into a three minute game. Understand the
          change, predict its behaviour, explain it back.
        </p>
        <Link href="/" className={buttonStyles('accent', 'lg')}>
          Start breaking down
        </Link>
        <p className="text-[12px] text-muted">
          Numbers are self-reported by the player&apos;s browser.
        </p>
      </div>
    </div>
  )
}

export default function CardPage({ params }: PageProps<'/card/[code]'>) {
  return (
    <PageShell width="max-w-4xl">
      <Suspense
        fallback={<div className="glass aspect-[1200/630] w-full animate-pulse rounded-panel" />}
      >
        <SharedCard params={params} />
      </Suspense>
    </PageShell>
  )
}
