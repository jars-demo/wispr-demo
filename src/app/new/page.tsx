import type { Metadata } from 'next'

import { PageShell } from '@/components/PageShell'
import { SpecComposer } from '@/features/spec/SpecComposer'

export const metadata: Metadata = { title: 'New receipt' }

export default function NewSpecPage() {
  return (
    <PageShell>
      <SpecComposer />
    </PageShell>
  )
}
