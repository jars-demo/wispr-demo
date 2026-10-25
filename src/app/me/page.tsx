import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { MyCard } from '@/features/card/MyCard'
import { SaveSection } from '@/features/game/SaveSection'

export const metadata: Metadata = { title: 'Your card', robots: { index: false } }

export default function MePage() {
  return (
    <PageShell width="max-w-6xl">
      <PageHeader eyebrow="Your card" title="Show what you" em="understand.">
        <p className="max-w-xl text-[16px] text-ink-2">
          Unlock avatars by playing, pick a look, and post your card. Every number on it was earned
          by breaking down real changes.
        </p>
      </PageHeader>
      <MyCard />
      <section
        id="save"
        aria-labelledby="save-title"
        className="glass mt-10 flex scroll-mt-28 flex-col gap-3 rounded-panel p-5 sm:p-6"
      >
        <h2 id="save-title" className="font-display text-3xl tracking-tight">
          Save your progress
        </h2>
        <SaveSection />
      </section>
    </PageShell>
  )
}
