import type { Metadata } from 'next'

import { PageShell } from '@/components/PageShell'
import { Restore } from '@/features/game/Restore'

export const metadata: Metadata = { title: 'Restore progress', robots: { index: false } }

export default function RestorePage() {
  return (
    <PageShell>
      <Restore />
    </PageShell>
  )
}
