import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import Link from 'next/link'

import { LoadingBlock, PageShell } from '@/components/PageShell'
import { buttonStyles } from '@/components/ui/button-styles'
import { describeCheck } from '@/domain/check/report'
import { listChecks } from '@/server/checks/repository'
import { toAgentPrompt, toMarkdown } from '@/domain/spec-export'
import { SpecActions } from '@/features/spec/SpecActions'
import { SpecView } from '@/features/spec/SpecView'
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
      <header className="rise mb-8 flex flex-col gap-3">
        <span className="text-[12px] font-medium tracking-[0.16em] text-muted uppercase">
          Step 3 of 3 · Hand it to your agent
        </span>
        <h1 className="font-display text-5xl leading-[1] tracking-[-0.03em] text-balance sm:text-6xl">
          {spec.title}
        </h1>
        <p className="text-[13px] text-muted">
          Version {spec.version} ·{' '}
          {spec.engine === 'model' ? 'Organised by Claude' : 'Organised by built-in rules'} ·
          Updated {dateFormat.format(spec.updatedAt)} UTC
        </p>
      </header>

      <div className="mb-10">
        <SpecActions id={spec.id} prompt={toAgentPrompt(spec)} markdown={toMarkdown(spec)} />
      </div>

      <SpecView items={spec.items} />

      <section
        aria-labelledby="next-heading"
        className="glass mt-12 flex flex-col gap-4 rounded-panel p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="next-heading" className="font-display text-3xl tracking-[-0.02em]">
              Agent done? <em className="italic">Check it.</em>
            </h2>
            <p className="text-[15px] text-muted">
              Paste the diff or a GitHub link, plus what your agent said.
            </p>
          </div>
          <Link href={`/specs/${spec.id}/check`} className={buttonStyles('primary', 'lg')}>
            Check the work
          </Link>
        </div>
        {checks.length > 0 ? (
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
        ) : null}
      </section>

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
