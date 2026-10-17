import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import { LoadingBlock, PageShell } from '@/components/PageShell'
import { ReceiptCard } from '@/components/ReceiptCard'
import { Steps } from '@/components/Steps'
import { describeCheck } from '@/domain/check/report'
import { SAMPLE_REQUEST } from '@/domain/check/sample'
import { receiptStatus } from '@/domain/receipt-status'
import { toAgentPrompt, toMarkdown } from '@/domain/spec-export'
import { SendAndCheck } from '@/features/spec/SendAndCheck'
import { SpecActions } from '@/features/spec/SpecActions'
import { listChecks } from '@/server/checks/repository'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { getSpec } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'My receipt', robots: { index: false } }

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

async function ReceiptDetail({ params }: { params: PageProps<'/specs/[id]'>['params'] }) {
  const { id } = await params
  const ownerId = await currentOwner()
  if (!ownerId || !z.uuid().safeParse(id).success) notFound()
  const db = await getDb()
  const spec = await getSpec(db, ownerId, id)
  if (!spec) notFound()
  const checks = await listChecks(db, ownerId, spec.id)
  const last = checks[0] ?? null
  const status = receiptStatus({
    sentAt: spec.sentAt,
    sentVia: spec.sentVia,
    lastCheck: last?.result ?? null,
    lastCheckAt: last?.createdAt ?? null,
  })

  return (
    <>
      <Steps current={status.stage === 'ready' ? 1 : status.stage === 'sent' ? 2 : 3} />

      <ReceiptCard
        id={spec.id}
        title={spec.title}
        items={spec.items}
        updatedAt={spec.updatedAt}
        sentVia={spec.sentVia}
        status={status}
        checkLine={status.stage === 'checked' && last ? status.label : 'Not yet'}
      />
      <div className="mt-3 mb-8 px-1">
        <SpecActions id={spec.id} />
      </div>

      <SendAndCheck
        id={spec.id}
        title={spec.title}
        prompt={toAgentPrompt(spec)}
        markdown={toMarkdown(spec)}
        showSample={spec.transcript.trim() === SAMPLE_REQUEST}
        aiEnabled={getConfig().groq !== null}
        sent={{
          at: spec.sentAt?.toISOString() ?? null,
          via: spec.sentVia,
          ref: spec.sentRef,
        }}
      />

      {checks.length > 0 ? (
        <section aria-labelledby="past-heading" className="mt-8 flex flex-col gap-2">
          <h2 id="past-heading" className="px-1 text-sm font-medium text-muted">
            Checks so far
          </h2>
          <ul className="flex flex-col gap-1.5">
            {checks.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/specs/${spec.id}/checks/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-card bg-surface/70 px-4 py-3 text-sm transition-colors hover:bg-surface"
                >
                  <span className="min-w-0 truncate">{describeCheck(c.result)}</span>
                  <span className="shrink-0 text-[12px] text-muted">
                    {dateFormat.format(c.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <details className="mt-6 rounded-card px-1">
        <summary className="cursor-pointer text-sm text-muted">Show what you said</summary>
        <p className="mt-2 rounded-card bg-surface-2 p-4 text-[15px] leading-relaxed whitespace-pre-wrap text-ink-2">
          {spec.transcript || 'No transcript was saved for this receipt.'}
        </p>
      </details>
    </>
  )
}

export default function ReceiptPage(props: PageProps<'/specs/[id]'>) {
  return (
    <PageShell>
      <Suspense fallback={<LoadingBlock label="Loading your receipt" />}>
        <ReceiptDetail params={props.params} />
      </Suspense>
    </PageShell>
  )
}
