import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import Link from 'next/link'

import { LoadingBlock, PageShell } from '@/components/PageShell'
import { describeCheck } from '@/domain/check/report'
import { listChecks } from '@/server/checks/repository'
import { toAgentPrompt, toMarkdown } from '@/domain/spec-export'
import { SAMPLE_REQUEST } from '@/domain/check/sample'
import { HandoffFlow } from '@/features/spec/HandoffFlow'
import { SpecActions } from '@/features/spec/SpecActions'
import { SpecView } from '@/features/spec/SpecView'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { getSpec } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'Checklist', robots: { index: false } }

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

async function SpecDetail({ params }: { params: PageProps<'/specs/[id]'>['params'] }) {
  const { id } = await params
  const ownerId = await currentOwner()
  if (!ownerId || !z.uuid().safeParse(id).success) notFound()
  const db = await getDb()
  const spec = await getSpec(db, ownerId, id)
  if (!spec) notFound()
  const checks = await listChecks(db, ownerId, spec.id)

  return (
    <>
      <header className="rise mb-6 flex flex-col gap-3">
        <span className="text-[12px] font-medium tracking-[0.16em] text-muted uppercase">
          Step 3 of 3 · Send it, then check it
        </span>
        <h1 className="font-display text-4xl leading-[1.02] tracking-[-0.03em] text-balance sm:text-6xl">
          {spec.title}
        </h1>
        <SpecActions id={spec.id} />
      </header>

      <details className="group mb-6 rounded-card">
        <summary className="cursor-pointer list-none text-sm font-medium text-ink-2">
          <span className="group-open:hidden">Show the checklist ({spec.items.length})</span>
          <span className="hidden group-open:inline">Hide the checklist</span>
        </summary>
        <div className="mt-4">
          <SpecView items={spec.items} />
        </div>
      </details>

      <HandoffFlow
        id={spec.id}
        title={spec.title}
        prompt={toAgentPrompt(spec)}
        markdown={toMarkdown(spec)}
        showSample={spec.transcript.trim() === SAMPLE_REQUEST}
        aiEnabled={getConfig().groq !== null}
      />

      {checks.length > 0 ? (
        <section aria-labelledby="past-heading" className="mt-8 flex flex-col gap-2">
          <h2 id="past-heading" className="px-1 text-sm font-medium text-muted">
            Earlier checks
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
          {spec.transcript || 'No transcript was saved for this checklist.'}
        </p>
      </details>
    </>
  )
}

export default function SpecPage(props: PageProps<'/specs/[id]'>) {
  return (
    <PageShell>
      <Suspense fallback={<LoadingBlock label="Loading checklist" />}>
        <SpecDetail params={props.params} />
      </Suspense>
    </PageShell>
  )
}
