import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { LoadingBlock, PageHeader, PageShell } from '@/components/PageShell'
import { ReceiptStamp } from '@/components/ReceiptStamp'
import { buttonStyles } from '@/components/ui/button-styles'
import { receiptStatus } from '@/domain/receipt-status'
import { getDb } from '@/server/db'
import { listSpecs } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'Your receipts' }

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' })

async function SpecList() {
  const ownerId = await currentOwner()
  const specs = ownerId ? await listSpecs(await getDb(), ownerId) : []

  if (specs.length === 0) {
    return (
      <div className="glass flex flex-col items-center gap-4 rounded-panel px-6 py-14 text-center">
        <p className="text-lg font-semibold tracking-tight">No receipts yet</p>
        <p className="max-w-sm text-[15px] text-muted">
          Say what you want your agent to do, and it will show up here.
        </p>
        <Link href="/new" className={buttonStyles('primary')}>
          Start a receipt
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {specs.map((spec) => (
        <li key={spec.id}>
          <Link
            href={`/specs/${spec.id}`}
            className="glass flex items-center justify-between gap-4 rounded-card px-5 py-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="truncate text-[15px] font-semibold tracking-tight">
                {spec.title}
              </span>
              <span className="text-[13px] text-muted">
                {spec.requirementCount} {spec.requirementCount === 1 ? 'item' : 'items'} · Updated{' '}
                {dateFormat.format(spec.updatedAt)}
              </span>
            </span>
            <span className="shrink-0">
              <ReceiptStamp status={receiptStatus(spec)} size="sm" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default function SpecsPage() {
  return (
    <PageShell>
      <PageHeader title="My" em="receipts">
        <p className="text-[15px] text-muted">
          Saved in this browser. Anyone else using this browser can see them.
        </p>
      </PageHeader>
      <Suspense fallback={<LoadingBlock label="Loading your receipts" />}>
        <SpecList />
      </Suspense>
    </PageShell>
  )
}
