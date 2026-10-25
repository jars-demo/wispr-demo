import Link from 'next/link'

import { PageShell } from '@/components/PageShell'
import { buttonStyles } from '@/components/ui/button-styles'

export default function NotFound() {
  return (
    <PageShell>
      <div className="glass mt-10 flex flex-col items-center gap-4 rounded-panel px-6 py-16 text-center">
        <p className="text-2xl font-semibold tracking-tight">Nothing here</p>
        <p className="max-w-sm text-[15px] text-muted">
          This page does not exist. Plenty of changes are waiting on the wire, though.
        </p>
        <Link href="/" className={buttonStyles('primary')}>
          Back to the wire
        </Link>
      </div>
    </PageShell>
  )
}
