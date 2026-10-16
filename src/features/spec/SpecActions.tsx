'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'

import { ApiError, deleteSpec } from './api'

// Copy for your agent, copy as Markdown, edit, delete. Delete asks once more inline, with no
// browser dialog.

type CopyState = { label: string; ok: boolean } | null

export function SpecActions({
  id,
  prompt,
  markdown,
}: {
  id: string
  prompt: string
  markdown: string
}) {
  const router = useRouter()
  const [copied, setCopied] = useState<CopyState>(null)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ label: `${label} copied.`, ok: true })
    } catch {
      setCopied({ label: 'Copying is blocked here. Select the text below instead.', ok: false })
    }
  }

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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => copy(prompt, 'Prompt')}
          className={buttonStyles('primary')}
        >
          Copy for your agent
        </button>
        <button
          type="button"
          onClick={() => copy(markdown, 'Markdown')}
          className={buttonStyles('secondary')}
        >
          Copy as Markdown
        </button>
        <Link href={`/specs/${id}/edit`} className={buttonStyles('secondary')}>
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
      <p
        aria-live="polite"
        className={`min-h-5 text-sm ${copied?.ok === false ? 'text-warn' : 'text-ok'}`}
      >
        {copied?.label}
      </p>
      {error ? (
        <p role="alert" className="text-sm text-bad">
          {error}
        </p>
      ) : null}
    </div>
  )
}
