'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'

import { ApiError, deleteSpec } from './api'

// Edit and delete. Delete asks once more inline, with no browser dialog. Copying lives in
// HandoffFlow.

export function SpecActions({ id }: { id: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    try {
      await deleteSpec(id)
      router.push('/specs')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Deleting failed. Try again.')
      setConfirming(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="-ml-3 flex flex-wrap items-center gap-1">
        <Link href={`/specs/${id}/edit`} className={buttonStyles('ghost')}>
          Edit
        </Link>
        {confirming ? (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={remove}
              className="h-9 rounded-full bg-bad px-4 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
            >
              Delete for good
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className={buttonStyles('ghost')}
            >
              Keep it
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className={buttonStyles('ghost')}
          >
            Delete
          </button>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  )
}
