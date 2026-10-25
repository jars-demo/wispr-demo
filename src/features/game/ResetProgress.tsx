'use client'

import { useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { emptyProfile } from '@/domain/profile'

import { profileStore } from './store'

export function ResetProgress() {
  const [sure, setSure] = useState(false)
  if (!sure) {
    return (
      <button
        type="button"
        onClick={() => setSure(true)}
        className={`${buttonStyles('secondary')} self-start`}
      >
        Reset progress in this browser
      </button>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[14px]">This cannot be undone here.</span>
      <button
        type="button"
        onClick={() => {
          profileStore.write(emptyProfile())
          setSure(false)
        }}
        className={buttonStyles('primary')}
      >
        Yes, reset
      </button>
      <button type="button" onClick={() => setSure(false)} className={buttonStyles('ghost')}>
        Cancel
      </button>
    </div>
  )
}
