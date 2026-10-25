import type { Metadata } from 'next'
import { Suspense } from 'react'

import { PageShell } from '@/components/PageShell'
import { Player } from '@/features/breakdown/Player'

export const metadata: Metadata = { title: 'Break it down', robots: { index: false } }

// The player reads the URL to know what to break down, so it renders inside Suspense.
export default function BreakdownPage() {
  return (
    <PageShell width="max-w-6xl">
      <Suspense fallback={null}>
        <Player />
      </Suspense>
    </PageShell>
  )
}
