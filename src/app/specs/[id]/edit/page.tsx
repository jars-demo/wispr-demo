import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { z } from 'zod'

import { LoadingBlock, PageHeader, PageShell } from '@/components/PageShell'
import { SpecEditForm } from '@/features/spec/SpecEditForm'
import { getDb } from '@/server/db'
import { getSpec } from '@/server/specs/repository'
import { currentOwner } from '@/server/session'

export const metadata: Metadata = { title: 'Edit checklist', robots: { index: false } }

async function EditLoader({ params }: { params: PageProps<'/specs/[id]/edit'>['params'] }) {
  const { id } = await params
  const ownerId = await currentOwner()
  if (!ownerId || !z.uuid().safeParse(id).success) notFound()
  const spec = await getSpec(await getDb(), ownerId, id)
  if (!spec) notFound()

  return (
    <SpecEditForm
      id={spec.id}
      version={spec.version}
      title={spec.title}
      transcript={spec.transcript}
      engine={spec.engine}
      items={spec.items.map(({ code: _code, position: _position, ...item }) => item)}
    />
  )
}

export default function EditSpecPage(props: PageProps<'/specs/[id]/edit'>) {
  return (
    <PageShell>
      <PageHeader title="Edit checklist">
        <p className="text-[15px] text-muted">Saving creates a new version. The old one is kept.</p>
      </PageHeader>
      <Suspense fallback={<LoadingBlock label="Loading checklist" />}>
        <EditLoader params={props.params} />
      </Suspense>
    </PageShell>
  )
}
