'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { buttonStyles } from '@/components/ui/button-styles'
import { LIMITS } from '@/domain/spec'
import { PENDING_TRANSCRIPT_KEY } from '@/features/spec/draft'

import { WisprHint } from './WisprHint'

// The landing page's single action. Wispr Flow is the voice: click the box, hold the Flow key and
// talk, and Flow types the words here. The words are handed to /new, which organises them.

export function VoiceStart() {
  const router = useRouter()
  const [text, setText] = useState('')
  const field = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const value = text.trim()
    if (!value) {
      field.current?.focus()
      return
    }
    try {
      window.sessionStorage.setItem(PENDING_TRANSCRIPT_KEY, value)
    } catch {
      // Without storage the words cannot travel; /new still opens and the user can paste.
    }
    router.push('/new')
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="glass-strong flex w-full max-w-2xl flex-col gap-3 rounded-[2rem] p-3 text-left shadow-lift sm:p-4"
    >
      <WisprHint />
      <label htmlFor="start-text" className="sr-only">
        What do you want your agent to build?
      </label>
      <textarea
        id="start-text"
        ref={field}
        value={text}
        maxLength={LIMITS.transcript}
        rows={3}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            submit()
          }
        }}
        placeholder="Say what you want built. What should it do? What should it leave alone? What are you unsure about?"
        className="min-h-28 w-full resize-none rounded-[1.4rem] bg-surface/80 px-4 py-3.5 text-[17px] leading-relaxed outline-none [field-sizing:content] placeholder:text-muted/80 focus-visible:outline-2 focus-visible:outline-accent sm:text-[18px]"
      />
      <div className="flex items-center justify-between gap-3 pl-2">
        <span className="text-[12px] text-muted">Free, no sign-up. Enter to go.</span>
        <button type="submit" disabled={!text.trim()} className={buttonStyles('primary', 'lg')}>
          Make my checklist
        </button>
      </div>
    </form>
  )
}
