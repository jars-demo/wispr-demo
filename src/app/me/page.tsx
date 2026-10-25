import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { MyCard } from '@/features/card/MyCard'
import { MyShares } from '@/features/shared/MyShares'

export const metadata: Metadata = { title: 'Your card', robots: { index: false } }

export default function MePage() {
  return (
    <PageShell width="max-w-6xl">
      <PageHeader eyebrow="Your card" title="Show what you" em="understand.">
        <p className="max-w-xl text-[16px] text-ink-2">
          Every number on it was earned by breaking down real changes. Unlock avatars and badges by
          playing, then post it on X.
        </p>
      </PageHeader>
      <MyCard />
      <MyShares />
    </PageShell>
  )
}
