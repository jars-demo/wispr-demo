import type { Metadata } from 'next'

import { PageHeader, PageShell } from '@/components/PageShell'
import { SharedList } from '@/features/shared/SharedList'

export const metadata: Metadata = {
  title: 'Learn from others',
  description: 'Breakdowns other players made public. Play any of them free.',
}

export default function LearnPage() {
  return (
    <PageShell width="max-w-6xl">
      <PageHeader eyebrow="Learn from others" title="Real changes, broken down by" em="players.">
        <p className="max-w-xl text-[16px] text-ink-2">
          Each one was made public by the player who broke it down. Play any of them free: no AI
          call, no hourly limit.
        </p>
      </PageHeader>
      <SharedList />
    </PageShell>
  )
}
