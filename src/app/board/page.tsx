import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { FullBoard } from '@/features/board/FullBoard'

export const metadata: Metadata = { title: 'Leaderboard' }

export default function BoardPage() {
  return (
    <PageShell width="max-w-6xl">
      <PageHeader eyebrow="Leaderboard" title="Who understands what they" em="ship.">
        <p className="max-w-xl text-[16px] text-ink-2">
          Points come from predicting how real changes behave and explaining them back. Climb by
          understanding, not by shipping more.
        </p>
      </PageHeader>
      <FullBoard />
    </PageShell>
  )
}
