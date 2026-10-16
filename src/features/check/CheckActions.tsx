'use client'

import Link from 'next/link'
import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'

// Actions on a check result: copy a fix-up prompt for the agent, check again, or go back.

export function CheckActions({ specId, fixPrompt }: { specId: string; fixPrompt: string | null }) {
  const [status, setStatus] = useState<string | null>(null)

  async function copy() {
    if (!fixPrompt) return
    try {
      await navigator.clipboard.writeText(fixPrompt)
      setStatus('Fix-up prompt copied. Paste it into your agent.')
    } catch {
      setStatus('Copying is blocked here. Select the prompt below instead.')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {fixPrompt ? (
          <button type="button" onClick={copy} className={buttonStyles('primary')}>
            Copy a fix-up prompt
          </button>
        ) : null}
        <Link href={`/specs/${specId}/check`} className={buttonStyles('secondary')}>
          Check again
        </Link>
        <Link href={`/specs/${specId}`} className={buttonStyles('ghost')}>
          Back to checklist
        </Link>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-ok">
        {status}
      </p>
    </div>
  )
}
