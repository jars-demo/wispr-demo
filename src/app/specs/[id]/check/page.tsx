import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import { LoadingBlock, PageHeader, PageShell } from '@/components/PageShell'
import { SAMPLE_REQUEST } from '@/domain/check/sample'
import { CheckForm } from '@/features/check/CheckForm'
import { getConfig } from '@/server/config'
import { getDb } from '@/server/db'
import { getSpec } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'Check the work', robots: { index: false } }

async function CheckLoader({ params }: { params: PageProps<'/specs/[id]/check'>['params'] }) {
  const { id } = await params
  const ownerId = await currentOwner()
  if (!ownerId || !z.uuid().safeParse(id).success) notFound()
  const spec = await getSpec(await getDb(), ownerId, id)
  if (!spec) notFound()
  return (
    <>
      <p className="-mt-6 mb-8 text-[15px] text-muted">
        Checking against{' '}
        <Link href={`/specs/${spec.id}`} className="text-ink underline-offset-4 hover:underline">
          {spec.title}
        </Link>
        , version {spec.version}.
      </p>
      <CheckForm
        specId={spec.id}
        showSample={spec.transcript.trim() === SAMPLE_REQUEST}
        aiEnabled={getConfig().groq !== null}
      />
    </>
  )
}

export default function CheckPage(props: PageProps<'/specs/[id]/check'>) {
  return (
    <PageShell>
      <PageHeader eyebrow="Step 3 of 3" title="Check the" em="work." />
      <Suspense fallback={<LoadingBlock label="Loading checklist" />}>
        <CheckLoader params={props.params} />
      </Suspense>
    </PageShell>
  )
}
