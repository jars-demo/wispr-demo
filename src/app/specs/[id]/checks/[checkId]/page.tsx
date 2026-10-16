import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import { LoadingBlock, PageShell } from '@/components/PageShell'
import { VerdictSheets } from '@/components/ui/VerdictSheets'
import { describeCheck, toFixPrompt } from '@/domain/check/report'
import { EVIDENCE_SOURCE_COPY } from '@/domain/evidence-source'
import { CheckActions } from '@/features/check/CheckActions'
import { CheckResultView } from '@/features/check/CheckResultView'
import { getCheck } from '@/server/checks/repository'
import { getDb } from '@/server/db'
import { getSpec } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'Check result', robots: { index: false } }

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
})

async function ResultLoader({
  params,
}: {
  params: PageProps<'/specs/[id]/checks/[checkId]'>['params']
}) {
  const { id, checkId } = await params
  const ownerId = await currentOwner()
  if (!ownerId || !z.uuid().safeParse(id).success || !z.uuid().safeParse(checkId).success) {
    notFound()
  }
  const db = await getDb()
  const [spec, check] = await Promise.all([
    getSpec(db, ownerId, id),
    getCheck(db, ownerId, id, checkId),
  ])
  if (!spec || !check) notFound()
  const { found, total } = check.result.summary
  const allFound = total > 0 && found === total

  return (
    <>
      <header className="rise mb-8 flex flex-col gap-3">
        <span className="text-[12px] font-medium tracking-[0.16em] text-muted uppercase">
          Check result
        </span>
        <h1 className="font-display text-5xl leading-[1] tracking-[-0.03em] text-balance sm:text-6xl">
          {found} of {total} <em className="italic">{allFound ? 'found. Nice.' : 'found.'}</em>
        </h1>
        <p className="text-[15px] text-ink-2">{describeCheck(check.result)}</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {check.sources.map((s) => (
            <span key={s} className="rounded-full bg-surface-2 px-2.5 py-1 text-[12px] text-ink-2">
              {EVIDENCE_SOURCE_COPY[s].label}
            </span>
          ))}
          {check.sourceLabel ? (
            <span className="font-mono text-[12px] text-muted">{check.sourceLabel}</span>
          ) : null}
        </div>
        <p className="text-[13px] text-muted">
          {spec.title} · version {check.specVersion} · checked by built-in rules ·{' '}
          {dateFormat.format(check.createdAt)} UTC
        </p>
      </header>
      <div className="mb-10">
        <CheckActions specId={spec.id} fixPrompt={toFixPrompt(spec.title, check.result)} />
      </div>
      <CheckResultView result={check.result} />
      <p className="mt-10 text-[13px] text-muted">
        Found means matching lines exist in the changes. It is evidence, not proof the code works.
      </p>
    </>
  )
}

export default function CheckResultPage(props: PageProps<'/specs/[id]/checks/[checkId]'>) {
  return (
    <PageShell>
      <Suspense fallback={<LoadingBlock label="Loading check" />}>
        <ResultLoader params={props.params} />
      </Suspense>
      <VerdictSheets />
    </PageShell>
  )
}
