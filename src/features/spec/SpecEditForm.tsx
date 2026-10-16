'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import type { SpecItemInput, StructuringEngine } from '@/domain/spec'

import { ApiError, updateSpec } from './api'
import { ChecklistEditor } from './ChecklistEditor'
import { finaliseDraft, toDraftItems, type Draft } from './draft'
import { SaveBar } from './SaveBar'

// Editing saves a new version. A save from a stale tab is refused rather than overwriting.

export function SpecEditForm({
  id,
  version,
  title,
  transcript,
  engine,
  items,
}: {
  id: string
  version: number
  title: string
  transcript: string
  engine: StructuringEngine
  items: SpecItemInput[]
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(() => ({ title, items: toDraftItems(items) }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    const final = finaliseDraft(draft, transcript, engine)
    if (!final.ok) {
      setError(final.message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      await updateSpec(id, version, final.value)
      router.push(`/specs/${id}`)
      router.refresh()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Saving failed. Try again.')
      setBusy(false)
    }
  }

  return (
    <div>
      <ChecklistEditor draft={draft} onChange={setDraft} />
      <SaveBar error={error}>
        <Link href={`/specs/${id}`} className={buttonStyles('ghost')}>
          Cancel
        </Link>
        <button type="button" onClick={save} disabled={busy} className={buttonStyles('primary')}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </SaveBar>
    </div>
  )
}
