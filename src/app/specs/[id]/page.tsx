import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import { LoadingBlock, PageShell } from '@/components/PageShell'
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
  const spec = await getSpec(await getDb(), ownerId, id)
  if (!spec) notFound()

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
        className="glass mt-12 flex flex-col gap-2 rounded-panel p-6"
      >
        <h2 id="next-heading" className="text-[15px] font-semibold tracking-tight">
          Next · Check the work
        </h2>
        <p className="text-[15px] text-muted">
          Checking your agent&rsquo;s changes against this list arrives in the next build milestone.
          Until then, copy the prompt above into your agent.
        </p>
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
